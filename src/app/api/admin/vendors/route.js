import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  getVendorSupabase,
  isValidVendorSlug,
  VENDOR_DB_SETUP_HINT,
  writeVendorAuditLog,
} from '@/features/vendor-tests/lib/vendorDb';
import { ACCESS_MODES } from '@/features/vendor-tests/lib/vendorConstants';
import { isPlausibleDomain, normalizeDomain } from '@/features/vendor-tests/lib/vendorDomain';
import { normalizeEmail } from '@/lib/normalizeEmail';

/** GET — list vendors (super admin) */
export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  try {
    const supabase = getVendorSupabase();
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, slug, status, city, contact_email, theme_color, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: VENDOR_DB_SETUP_HINT, dbSetupRequired: true },
          { status: 503 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const vendors = data || [];
    const ids = vendors.map((v) => v.id);
    let domainsByVendor = {};
    let settingsByVendor = {};

    if (ids.length) {
      const [domRes, setRes] = await Promise.all([
        supabase.from('vendor_allowed_domains').select('vendor_id, domain').in('vendor_id', ids),
        supabase
          .from('vendor_access_settings')
          .select('vendor_id, access_mode, auto_enroll')
          .in('vendor_id', ids),
      ]);
      for (const row of domRes.data || []) {
        if (!domainsByVendor[row.vendor_id]) domainsByVendor[row.vendor_id] = [];
        domainsByVendor[row.vendor_id].push(row.domain);
      }
      for (const row of setRes.data || []) {
        settingsByVendor[row.vendor_id] = row;
      }
    }

    return NextResponse.json({
      success: true,
      vendors: vendors.map((v) => ({
        ...v,
        domains: domainsByVendor[v.id] || [],
        access_mode: settingsByVendor[v.id]?.access_mode || null,
        auto_enroll: settingsByVendor[v.id]?.auto_enroll ?? null,
      })),
    });
  } catch (err) {
    if (err?.code === 'VENDOR_SERVICE_ROLE_REQUIRED') {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST — create vendor + default access settings + optional domain + optional admin email
 * Body: { name, slug, domain?, adminEmail?, city?, contactEmail? }
 */
export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const slug = String(body?.slug || '').trim().toLowerCase();
    const domain = body?.domain ? normalizeDomain(body.domain) : '';
    const adminEmail = body?.adminEmail ? normalizeEmail(body.adminEmail) : '';
    const city = body?.city ? String(body.city).trim() : null;
    const contactEmail = body?.contactEmail ? normalizeEmail(body.contactEmail) : null;

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!isValidVendorSlug(slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or reserved slug (lowercase letters, numbers, hyphens)' },
        { status: 400 }
      );
    }
    if (domain && !isPlausibleDomain(domain)) {
      return NextResponse.json({ success: false, error: 'Invalid domain' }, { status: 400 });
    }

    const supabase = getVendorSupabase();

    const { data: vendor, error: insertError } = await supabase
      .from('vendors')
      .insert({
        name,
        slug,
        status: 'active',
        city,
        contact_email: contactEmail,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    await supabase.from('vendor_access_settings').insert({
      vendor_id: vendor.id,
      access_mode: ACCESS_MODES.DOMAIN_AND_ALLOWLIST,
      auto_enroll: true,
      allow_subdomains: false,
      require_workspace_hd: false,
    });

    if (domain) {
      await supabase.from('vendor_allowed_domains').insert({
        vendor_id: vendor.id,
        domain,
        created_by: userEmail,
      });
    }

    if (adminEmail) {
      await supabase.from('vendor_members').upsert(
        {
          vendor_id: vendor.id,
          user_email: adminEmail,
          role: 'vendor_admin',
          status: 'active',
          source: 'manual',
          created_by: userEmail,
        },
        { onConflict: 'vendor_id,user_email' }
      );
    }

    await writeVendorAuditLog(supabase, {
      vendorId: vendor.id,
      actorEmail: userEmail,
      action: 'vendor.created',
      entityType: 'vendor',
      entityId: vendor.id,
      details: { slug, domain: domain || null, adminEmail: adminEmail || null },
    });

    return NextResponse.json({
      success: true,
      vendor,
      portalUrl: `/practice-tests/${vendor.slug}`,
    });
  } catch (err) {
    if (err?.code === 'VENDOR_SERVICE_ROLE_REQUIRED') {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
