import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  getVendorSupabase,
  writeVendorAuditLog,
  VENDOR_DB_SETUP_HINT,
} from '@/features/vendor-tests/lib/vendorDb';
import { MEMBER_ROLES, MEMBER_STATUSES, VENDOR_STATUSES } from '@/features/vendor-tests/lib/vendorConstants';
import { normalizeEmail } from '@/lib/normalizeEmail';

async function loadVendor(supabase, vendorId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .maybeSingle();
  return { vendor: data, error };
}

/** GET — vendor detail + admins */
export async function GET(_request, { params }) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  const { vendorId } = await params;
  try {
    const supabase = getVendorSupabase();
    const { vendor, error } = await loadVendor(supabase, vendorId);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || VENDOR_DB_SETUP_HINT },
        { status: error.code === '42P01' ? 503 : 500 }
      );
    }
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const [settingsRes, domainsRes, adminsRes] = await Promise.all([
      supabase.from('vendor_access_settings').select('*').eq('vendor_id', vendorId).maybeSingle(),
      supabase.from('vendor_allowed_domains').select('*').eq('vendor_id', vendorId),
      supabase
        .from('vendor_members')
        .select('id, user_email, role, status, source, created_at')
        .eq('vendor_id', vendorId)
        .in('role', [MEMBER_ROLES.VENDOR_ADMIN, MEMBER_ROLES.VENDOR_STAFF])
        .order('role', { ascending: true }),
    ]);

    return NextResponse.json({
      success: true,
      vendor,
      settings: settingsRes.data,
      domains: domainsRes.data || [],
      admins: adminsRes.data || [],
    });
  } catch (err) {
    if (err?.code === 'VENDOR_SERVICE_ROLE_REQUIRED') {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH — suspend/activate, assign admin, update basic fields
 * Body: {
 *   status?: 'active'|'suspended',
 *   assignAdminEmail?: string,
 *   removeAdminEmail?: string,
 *   name?, city?, contact_email?, theme_color?, logo_url?, banner_url?
 * }
 */
export async function PATCH(request, { params }) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  const { vendorId } = await params;
  try {
    const body = await request.json();
    const supabase = getVendorSupabase();
    const { vendor, error } = await loadVendor(supabase, vendorId);
    if (error || !vendor) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Vendor not found' },
        { status: error ? 500 : 404 }
      );
    }

    const updates = {};
    if (body.status === VENDOR_STATUSES.ACTIVE || body.status === VENDOR_STATUSES.SUSPENDED) {
      updates.status = body.status;
    }
    for (const key of ['name', 'city', 'contact_email', 'theme_color', 'logo_url', 'banner_url']) {
      if (body[key] !== undefined) {
        updates[key] = body[key] === null || body[key] === '' ? null : String(body[key]).trim();
      }
    }
    if (Object.keys(updates).length) {
      updates.updated_at = new Date().toISOString();
      const { error: upErr } = await supabase.from('vendors').update(updates).eq('id', vendorId);
      if (upErr) {
        return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
      }
      await writeVendorAuditLog(supabase, {
        vendorId,
        actorEmail: userEmail,
        action: updates.status ? `vendor.${updates.status}` : 'vendor.updated',
        entityType: 'vendor',
        entityId: vendorId,
        details: updates,
      });
    }

    if (body.assignAdminEmail) {
      const adminEmail = normalizeEmail(body.assignAdminEmail);
      if (!adminEmail) {
        return NextResponse.json({ success: false, error: 'Invalid admin email' }, { status: 400 });
      }
      const { error: memErr } = await supabase.from('vendor_members').upsert(
        {
          vendor_id: vendorId,
          user_email: adminEmail,
          role: MEMBER_ROLES.VENDOR_ADMIN,
          status: MEMBER_STATUSES.ACTIVE,
          source: 'manual',
          created_by: userEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'vendor_id,user_email' }
      );
      if (memErr) {
        return NextResponse.json({ success: false, error: memErr.message }, { status: 500 });
      }
      await writeVendorAuditLog(supabase, {
        vendorId,
        actorEmail: userEmail,
        action: 'member.admin_assigned',
        entityType: 'vendor_member',
        details: { user_email: adminEmail },
      });
    }

    if (body.removeAdminEmail) {
      const adminEmail = normalizeEmail(body.removeAdminEmail);
      const { error: remErr } = await supabase
        .from('vendor_members')
        .update({
          role: MEMBER_ROLES.STUDENT,
          updated_at: new Date().toISOString(),
        })
        .eq('vendor_id', vendorId)
        .eq('user_email', adminEmail)
        .eq('role', MEMBER_ROLES.VENDOR_ADMIN);
      if (remErr) {
        return NextResponse.json({ success: false, error: remErr.message }, { status: 500 });
      }
      await writeVendorAuditLog(supabase, {
        vendorId,
        actorEmail: userEmail,
        action: 'member.admin_removed',
        entityType: 'vendor_member',
        details: { user_email: adminEmail },
      });
    }

    const { vendor: fresh } = await loadVendor(supabase, vendorId);
    return NextResponse.json({ success: true, vendor: fresh });
  } catch (err) {
    if (err?.code === 'VENDOR_SERVICE_ROLE_REQUIRED') {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
