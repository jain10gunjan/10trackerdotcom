import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { ACCESS_MODES } from '@/features/vendor-tests/lib/vendorConstants';
import { isSuperAdminEmail } from '@/features/vendor-tests/lib/vendorAccess';
import { parseEnrollmentSettings } from '@/features/vendor-tests/lib/vendorEnrollment';

const VALID_MODES = new Set(Object.values(ACCESS_MODES));

/** GET branding + access settings (vendor admin+) */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;

  return NextResponse.json({
    success: true,
    vendor: {
      id: ctx.vendor.id,
      name: ctx.vendor.name,
      slug: ctx.vendor.slug,
      status: ctx.vendor.status,
      logo_url: ctx.vendor.logo_url,
      banner_url: ctx.vendor.banner_url,
      theme_color: ctx.vendor.theme_color,
      contact_email: ctx.vendor.contact_email,
      city: ctx.vendor.city,
    },
    settings: ctx.settings,
    domains: ctx.domains,
    permissions: ctx.permissions,
  });
}

/**
 * PATCH branding and/or access settings.
 * open_to_all only by platform super admin.
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
    const supabase = ctx.supabase;
    const vendorId = ctx.vendor.id;
    const changes = {};

    const vendorUpdates = {};
    for (const key of ['name', 'city', 'contact_email', 'theme_color', 'logo_url', 'banner_url']) {
      if (body[key] !== undefined) {
        vendorUpdates[key] =
          body[key] === null || body[key] === '' ? null : String(body[key]).trim();
      }
    }
    if (Object.keys(vendorUpdates).length) {
      vendorUpdates.updated_at = new Date().toISOString();
      const { error: vErr } = await supabase
        .from('vendors')
        .update(vendorUpdates)
        .eq('id', vendorId);
      if (vErr) {
        return NextResponse.json({ success: false, error: vErr.message }, { status: 500 });
      }
      changes.vendor = vendorUpdates;
    }

    const settingsUpdates = {};
    if (body.access_mode !== undefined) {
      const mode = String(body.access_mode);
      if (!VALID_MODES.has(mode)) {
        return NextResponse.json({ success: false, error: 'Invalid access_mode' }, { status: 400 });
      }
      if (mode === ACCESS_MODES.OPEN_TO_ALL && !isSuperAdminEmail(ctx.email)) {
        return NextResponse.json(
          { success: false, error: 'Only platform super admin can set Open to all' },
          { status: 403 }
        );
      }
      settingsUpdates.access_mode = mode;
    }
    if (body.auto_enroll !== undefined) {
      settingsUpdates.auto_enroll = !!body.auto_enroll;
    }
    if (body.allow_subdomains !== undefined) {
      settingsUpdates.allow_subdomains = !!body.allow_subdomains;
    }
    if (body.require_workspace_hd !== undefined) {
      settingsUpdates.require_workspace_hd = !!body.require_workspace_hd;
    }
    if (body.allow_gmail_auto_enroll !== undefined) {
      settingsUpdates.allow_gmail_auto_enroll = !!body.allow_gmail_auto_enroll;
    }
    const enrollment = parseEnrollmentSettings(body, ctx.settings || {});
    if (enrollment.error) {
      return NextResponse.json({ success: false, error: enrollment.error }, { status: 400 });
    }
    Object.assign(settingsUpdates, enrollment.data || {});

    if (Object.keys(settingsUpdates).length) {
      settingsUpdates.updated_at = new Date().toISOString();
      const { error: sErr } = await supabase
        .from('vendor_access_settings')
        .upsert({ vendor_id: vendorId, ...settingsUpdates }, { onConflict: 'vendor_id' });
      if (sErr) {
        const missingEnrollment = /enrollment_/i.test(sErr.message || '');
        return NextResponse.json(
          {
            success: false,
            error: missingEnrollment
              ? 'Enrollment settings are not in the database yet. Run scripts/vendor_enrollment_rules.sql in the Supabase SQL editor, then reload the API schema.'
              : sErr.message,
          },
          { status: 500 }
        );
      }
      changes.settings = settingsUpdates;
    }

    if (Object.keys(changes).length) {
      await writeVendorAuditLog(supabase, {
        vendorId,
        actorEmail: ctx.email,
        action: 'settings.updated',
        entityType: 'vendor_access_settings',
        entityId: vendorId,
        details: changes,
      });
    }

    return NextResponse.json({ success: true, changes });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
