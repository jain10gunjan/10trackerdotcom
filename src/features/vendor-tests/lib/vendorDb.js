/**
 * Tenant-scoped Supabase access for vendor practice-tests.
 * Always uses service role when available — never expose these helpers to the browser.
 */

import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { RESERVED_VENDOR_SLUGS, SLUG_REGEX, VENDOR_STATUSES } from './vendorConstants';
import { MEMBER_ROLES, MEMBER_STATUSES } from './vendorConstants';

export const VENDOR_DB_SETUP_HINT =
  'Run supabase/migrations/setup_vendor_practice_tests.sql in the Supabase SQL Editor, then reload the API schema.';

export function getVendorSupabase() {
  if (!isValidServiceRoleKey()) {
    const err = new Error(
      `SUPABASE_SERVICE_ROLE_KEY (service_role JWT) is required for vendor practice-tests. ${VENDOR_DB_SETUP_HINT}`
    );
    err.code = 'VENDOR_SERVICE_ROLE_REQUIRED';
    throw err;
  }
  return getSupabaseServer(true);
}

export function isValidVendorSlug(slug) {
  const s = String(slug || '').trim().toLowerCase();
  if (!s || !SLUG_REGEX.test(s)) return false;
  if (RESERVED_VENDOR_SLUGS.has(s)) return false;
  return true;
}

export async function fetchVendorBySlug(supabase, slug) {
  const s = String(slug || '').trim().toLowerCase();
  if (!s) return { vendor: null, error: null };

  const { data, error } = await supabase
    .from('vendors')
    .select(
      'id, name, slug, status, logo_url, banner_url, theme_color, contact_email, city, custom_domain, created_at'
    )
    .eq('slug', s)
    .maybeSingle();

  if (error) return { vendor: null, error };
  return { vendor: data, error: null };
}

export async function fetchVendorAccessBundle(supabase, vendorId) {
  const [settingsRes, domainsRes] = await Promise.all([
    supabase.from('vendor_access_settings').select('*').eq('vendor_id', vendorId).maybeSingle(),
    supabase
      .from('vendor_allowed_domains')
      .select('id, domain, created_at')
      .eq('vendor_id', vendorId)
      .order('domain', { ascending: true }),
  ]);

  return {
    settings: settingsRes.data || null,
    domains: domainsRes.data || [],
    error: settingsRes.error || domainsRes.error || null,
  };
}

export async function fetchVendorMember(supabase, vendorId, email) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) return { member: null, error: null };

  const { data, error } = await supabase
    .from('vendor_members')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('user_email', userEmail)
    .maybeSingle();

  return { member: data, error };
}

/**
 * Ensure membership row exists / activate invited → active.
 * Always scopes writes with vendor_id.
 */
export async function ensureVendorMembership(supabase, {
  vendorId,
  email,
  role = MEMBER_ROLES.STUDENT,
  source = 'domain',
  activateInvited = false,
  displayName = null,
}) {
  const userEmail = normalizeEmail(email);
  if (!userEmail || !vendorId) {
    return { member: null, error: new Error('vendorId and email required') };
  }

  const { member: existing, error: fetchError } = await fetchVendorMember(
    supabase,
    vendorId,
    userEmail
  );
  if (fetchError) return { member: null, error: fetchError };

  if (existing) {
    if (existing.status === MEMBER_STATUSES.REVOKED) {
      return { member: existing, error: null };
    }
    if (activateInvited && existing.status === MEMBER_STATUSES.INVITED) {
      const { data, error } = await supabase
        .from('vendor_members')
        .update({
          status: MEMBER_STATUSES.ACTIVE,
          updated_at: new Date().toISOString(),
        })
        .eq('vendor_id', vendorId)
        .eq('user_email', userEmail)
        .select()
        .single();
      return { member: data || existing, error };
    }
    return { member: existing, error: null };
  }

  const payload = {
    vendor_id: vendorId,
    user_email: userEmail,
    role,
    status: MEMBER_STATUSES.ACTIVE,
    source,
    display_name: displayName || null,
    created_by: 'auto_enroll',
  };

  const { data, error } = await supabase
    .from('vendor_members')
    .upsert(payload, { onConflict: 'vendor_id,user_email' })
    .select()
    .single();

  return { member: data, error };
}

export async function writeVendorAuditLog(supabase, {
  vendorId,
  actorEmail,
  action,
  entityType = null,
  entityId = null,
  details = {},
}) {
  const { error } = await supabase.from('vendor_audit_logs').insert({
    vendor_id: vendorId,
    actor_email: normalizeEmail(actorEmail) || actorEmail || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
  return { error };
}

/** Public-safe vendor fields (no secrets). */
export function publicVendorView(vendor) {
  if (!vendor) return null;
  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    status: vendor.status,
    logo_url: vendor.logo_url,
    banner_url: vendor.banner_url,
    theme_color: vendor.theme_color,
    city: vendor.city,
  };
}

export function vendorIsActive(vendor) {
  return vendor?.status === VENDOR_STATUSES.ACTIVE;
}
