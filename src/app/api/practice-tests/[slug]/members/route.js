import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  MEMBER_ROLES,
  MEMBER_STATUSES,
} from '@/features/vendor-tests/lib/vendorConstants';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { freezeInProgressAttempts } from '@/features/vendor-tests/server/freezeVendorAttempts';
import { isSuperAdminEmail } from '@/features/vendor-tests/lib/vendorAccess';
import {
  normalizeRollNo,
  assertRollNoUnique,
} from '@/features/vendor-tests/lib/vendorEnrollment';

const VALID_ROLES = new Set(Object.values(MEMBER_ROLES));
const VALID_STATUSES = new Set(Object.values(MEMBER_STATUSES));

function parseMemberRow(raw) {
  const email = normalizeEmail(raw.email || raw.user_email);
  if (!email) return { ok: false, error: 'email required' };

  let role = String(raw.role || MEMBER_ROLES.STUDENT).toLowerCase();
  if (role === 'admin') role = MEMBER_ROLES.VENDOR_ADMIN;
  if (role === 'staff') role = MEMBER_ROLES.VENDOR_STAFF;
  if (!VALID_ROLES.has(role)) role = MEMBER_ROLES.STUDENT;

  // Never allow creating super_admin via this API
  if (role !== MEMBER_ROLES.STUDENT && role !== MEMBER_ROLES.VENDOR_STAFF && role !== MEMBER_ROLES.VENDOR_ADMIN) {
    return { ok: false, error: `Invalid role for ${email}` };
  }

  return {
    ok: true,
    row: {
      user_email: email,
      role,
      status: raw.status === MEMBER_STATUSES.INVITED ? MEMBER_STATUSES.INVITED : MEMBER_STATUSES.ACTIVE,
      source: raw.source === 'domain' ? 'domain' : raw.source === 'allowlist' ? 'allowlist' : 'manual',
      display_name: raw.display_name || raw.name || null,
      roll_no: normalizeRollNo(raw.roll_no || raw.rollNo || null),
      branch: raw.branch || null,
      batch: raw.batch || null,
      year: raw.year != null ? String(raw.year) : null,
    },
  };
}

/** GET members — vendor admin (full) or staff (read) */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role');
  const q = String(searchParams.get('q') || '').trim().toLowerCase();
  const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit')) || 100));
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

  let query = ctx.supabase
    .from('vendor_members')
    .select(
      'id, user_email, role, status, source, roll_no, branch, batch, year, display_name, created_by, created_at, updated_at',
      { count: 'exact' }
    )
    .eq('vendor_id', ctx.vendor.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && VALID_STATUSES.has(status)) query = query.eq('status', status);
  if (role && VALID_ROLES.has(role)) query = query.eq('role', role);
  if (q) query = query.ilike('user_email', `%${q}%`);

  const { data, error: listError, count } = await query;
  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    members: data || [],
    count: count ?? (data || []).length,
    limit,
    offset,
    canManage: ctx.permissions.manageAccess,
  });
}

/**
 * POST — add one member or bulk
 * { email, role?, name?, roll_no?, branch?, batch?, year?, status? }
 * or { members: [...] }
 */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;
  if (!ctx.permissions.manageAccess) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body?.members) ? body.members : [body];
    if (!items.length) {
      return NextResponse.json({ success: false, error: 'No members provided' }, { status: 400 });
    }
    if (items.length > 500) {
      return NextResponse.json({ success: false, error: 'Max 500 members per request' }, { status: 400 });
    }

    const rows = [];
    const rowErrors = [];
    for (let i = 0; i < items.length; i++) {
      const parsed = parseMemberRow(items[i] || {});
      if (!parsed.ok) {
        rowErrors.push({ index: i, error: parsed.error });
        continue;
      }
      // Only vendor admins / super can assign vendor_admin; staff role ok
      if (
        parsed.row.role === MEMBER_ROLES.VENDOR_ADMIN &&
        !ctx.isSuperAdmin &&
        ctx.role !== MEMBER_ROLES.VENDOR_ADMIN
      ) {
        rowErrors.push({ index: i, error: 'Cannot assign vendor_admin' });
        continue;
      }
      rows.push({
        vendor_id: ctx.vendor.id,
        ...parsed.row,
        created_by: ctx.email,
        updated_at: new Date().toISOString(),
      });
    }

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: 'No valid members', rowErrors },
        { status: 400 }
      );
    }

    const { data, error: upsertError } = await ctx.supabase
      .from('vendor_members')
      .upsert(rows, { onConflict: 'vendor_id,user_email' })
      .select('id, user_email, role, status');

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'members.upserted',
      entityType: 'vendor_member',
      details: {
        count: rows.length,
        emails: rows.map((r) => r.user_email).slice(0, 50),
        rowErrors,
      },
    });

    return NextResponse.json({
      success: true,
      upserted: data || [],
      rowErrors,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH — update one member by email or id
 * { id?|email, role?, status?, roll_no?, branch?, batch?, year?, display_name? }
 */
export async function PATCH(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;
  if (!ctx.permissions.manageAccess) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email || body.user_email);
    const id = body.id;
    if (!email && !id) {
      return NextResponse.json({ success: false, error: 'id or email required' }, { status: 400 });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (body.role !== undefined) {
      const role = String(body.role);
      if (!VALID_ROLES.has(role)) {
        return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
      }
      updates.role = role;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      updates.status = body.status;
    }
    for (const key of ['roll_no', 'branch', 'batch', 'year', 'display_name']) {
      if (body[key] !== undefined) {
        updates[key] =
          body[key] === null || body[key] === ''
            ? null
            : key === 'roll_no'
              ? normalizeRollNo(body[key])
              : String(body[key]).trim();
      }
    }

    // Resolve target for uniqueness exclude
    let excludeId = id || null;
    if (!excludeId && email) {
      const { data: existing } = await ctx.supabase
        .from('vendor_members')
        .select('id')
        .eq('vendor_id', ctx.vendor.id)
        .eq('user_email', email)
        .maybeSingle();
      excludeId = existing?.id || null;
    }

    if (updates.roll_no) {
      const unique = await assertRollNoUnique(
        ctx.supabase,
        ctx.vendor.id,
        updates.roll_no,
        excludeId
      );
      if (!unique.ok) {
        return NextResponse.json({ success: false, error: unique.error }, { status: 409 });
      }
      updates.roll_no = unique.rollNo;
    }

    let query = ctx.supabase
      .from('vendor_members')
      .update(updates)
      .eq('vendor_id', ctx.vendor.id);

    if (id) query = query.eq('id', id);
    else query = query.eq('user_email', email);

    const { data, error: upError } = await query.select().maybeSingle();
    if (upError) {
      if (/unique|duplicate/i.test(upError.message || '')) {
        return NextResponse.json(
          {
            success: false,
            error: 'This enrollment / roll number is already used by another member',
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: upError.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    // Protect last admin? soft: allow but audit
    if (updates.status === MEMBER_STATUSES.REVOKED) {
      const targetEmail = data.user_email;
      if (!isSuperAdminEmail(targetEmail)) {
        await freezeInProgressAttempts(ctx.supabase, {
          vendorId: ctx.vendor.id,
          userEmail: targetEmail,
          reason: 'member_revoked',
        });
      }
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: updates.status === MEMBER_STATUSES.REVOKED ? 'member.revoked' : 'member.updated',
      entityType: 'vendor_member',
      entityId: data.id,
      details: { user_email: data.user_email, updates },
    });

    return NextResponse.json({ success: true, member: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
