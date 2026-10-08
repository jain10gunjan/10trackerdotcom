import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { MEMBER_ROLES, MEMBER_STATUSES } from '@/features/vendor-tests/lib/vendorConstants';
import { normalizeEmail } from '@/lib/normalizeEmail';

/** GET pending/all access requests — vendor admin */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  let query = ctx.supabase
    .from('vendor_access_requests')
    .select('*')
    .eq('vendor_id', ctx.vendor.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error: listError } = await query;
  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, requests: data || [] });
}

/**
 * PATCH { id, action: 'approve'|'reject', role?: 'student'|'vendor_staff' }
 * Approve → upsert allowlist member active
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
    const id = body.id;
    const action = body.action;
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { success: false, error: 'id and action (approve|reject) required' },
        { status: 400 }
      );
    }

    const { data: reqRow, error: fetchError } = await ctx.supabase
      .from('vendor_access_requests')
      .select('*')
      .eq('vendor_id', ctx.vendor.id)
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !reqRow) {
      return NextResponse.json(
        { success: false, error: fetchError?.message || 'Request not found' },
        { status: fetchError ? 500 : 404 }
      );
    }

    if (reqRow.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Request already resolved' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error: upError } = await ctx.supabase
      .from('vendor_access_requests')
      .update({
        status: newStatus,
        resolved_at: now,
        resolved_by: ctx.email,
      })
      .eq('id', id)
      .eq('vendor_id', ctx.vendor.id);

    if (upError) {
      return NextResponse.json({ success: false, error: upError.message }, { status: 500 });
    }

    if (action === 'approve') {
      const role =
        body.role === MEMBER_ROLES.VENDOR_STAFF
          ? MEMBER_ROLES.VENDOR_STAFF
          : MEMBER_ROLES.STUDENT;
      const email = normalizeEmail(reqRow.user_email);
      await ctx.supabase.from('vendor_members').upsert(
        {
          vendor_id: ctx.vendor.id,
          user_email: email,
          role,
          status: MEMBER_STATUSES.ACTIVE,
          source: 'allowlist',
          created_by: ctx.email,
          updated_at: now,
        },
        { onConflict: 'vendor_id,user_email' }
      );
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: `access_request.${newStatus}`,
      entityType: 'vendor_access_request',
      entityId: id,
      details: { user_email: reqRow.user_email },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
