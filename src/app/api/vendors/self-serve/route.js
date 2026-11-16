import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { normalizeDomain, isPlausibleDomain } from '@/features/vendor-tests/lib/vendorDomain';
import {
  getVendorSupabase,
  isValidVendorSlug,
  writeVendorAuditLog,
} from '@/features/vendor-tests/lib/vendorDb';
import { ACCESS_MODES } from '@/features/vendor-tests/lib/vendorConstants';
import { VENDOR_PLAN_IDS } from '@/features/vendor-tests/lib/vendorPlans';

/**
 * POST — institute self-serve: create vendor on trial + assign caller as vendor_admin.
 * Body: { name, slug, domain? }
 */
export async function POST(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const slug = String(body?.slug || '').trim().toLowerCase();
    const domain = body?.domain ? normalizeDomain(body.domain) : '';

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: 'Institute name is required' }, { status: 400 });
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
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const insertRow = {
      name,
      slug,
      status: 'active',
      contact_email: normalizeEmail(email),
      plan_id: VENDOR_PLAN_IDS.TRIAL,
      plan_status: 'trialing',
      trial_ends_at: trialEndsAt,
      coding_contests_addon: false,
    };

    const { data: vendor, error: insertError } = await supabase
      .from('vendors')
      .insert(insertRow)
      .select('id, name, slug, plan_id, plan_status, trial_ends_at')
      .single();

    if (insertError) {
      // Older DBs without billing columns — retry without plan fields.
      if (String(insertError.message || '').includes('plan_id') || insertError.code === 'PGRST204') {
        const { data: fallback, error: fallbackErr } = await supabase
          .from('vendors')
          .insert({
            name,
            slug,
            status: 'active',
            contact_email: normalizeEmail(email),
          })
          .select('id, name, slug')
          .single();
        if (fallbackErr) {
          if (fallbackErr.code === '23505') {
            return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 });
          }
          return NextResponse.json({ success: false, error: fallbackErr.message }, { status: 500 });
        }
        await finalizeVendorSetup(supabase, fallback, email, domain);
        return NextResponse.json({
          success: true,
          vendor: fallback,
          href: `/practice-tests/${fallback.slug}/admin`,
          billingMigrationRequired: true,
        });
      }
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    await finalizeVendorSetup(supabase, vendor, email, domain);

    return NextResponse.json({
      success: true,
      vendor,
      href: `/practice-tests/${vendor.slug}/admin`,
    });
  } catch (err) {
    console.error('vendors/self-serve', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create institute' },
      { status: 500 }
    );
  }
}

async function finalizeVendorSetup(supabase, vendor, email, domain) {
  await supabase.from('vendor_access_settings').upsert({
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
      created_by: normalizeEmail(email),
    });
  }

  await supabase.from('vendor_members').upsert(
    {
      vendor_id: vendor.id,
      user_email: normalizeEmail(email),
      role: 'vendor_admin',
      status: 'active',
      source: 'self_serve',
      created_by: normalizeEmail(email),
    },
    { onConflict: 'vendor_id,user_email' }
  );

  await writeVendorAuditLog(supabase, {
    vendorId: vendor.id,
    actorEmail: email,
    action: 'vendor.self_serve_created',
    entityType: 'vendor',
    entityId: vendor.id,
    details: { slug: vendor.slug, domain: domain || null },
  });
}
