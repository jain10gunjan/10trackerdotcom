import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseSessionName } from '@/lib/userProfile';
import { selectProfile, upsertProfile } from '@/lib/userProfileDb';

const PEOPLE_PHONE_URL =
  'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers';

function blank(value) {
  return value == null || String(value).trim() === '';
}

/** Google People API. Requires scope user.phonenumbers.read and the People API enabled. */
export async function fetchGooglePhoneNumber(accessToken) {
  if (!accessToken) return null;

  const res = await fetch(PEOPLE_PHONE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn('[auth] Google phone lookup failed', res.status);
    return null;
  }

  const data = await res.json();
  const numbers = Array.isArray(data.phoneNumbers) ? data.phoneNumbers : [];
  const primary = numbers.find((entry) => entry?.metadata?.primary) || numbers[0];
  const value = primary?.canonicalForm || primary?.value;
  const phone = typeof value === 'string' ? value.trim() : '';
  return phone || null;
}

/**
 * Save Google account name, photo, and phone onto user_profiles when those
 * fields are still empty. The admin users list reads this row.
 */
export async function syncGoogleSignInProfile({ email, profile, accessToken }) {
  const normalized = String(email || profile?.email || '').trim();
  if (!normalized) return { phone: null };

  const phone = await fetchGooglePhoneNumber(accessToken);
  const given = typeof profile?.given_name === 'string' ? profile.given_name.trim() : '';
  const family = typeof profile?.family_name === 'string' ? profile.family_name.trim() : '';
  const parsed = parseSessionName(profile?.name);
  const first = given || parsed.first_name;
  const last = family || parsed.last_name;
  const display =
    [first, last].filter(Boolean).join(' ') || String(profile?.name || '').trim();
  const avatar = typeof profile?.picture === 'string' ? profile.picture.trim() : '';

  const supabase = getSupabaseAdmin();
  const { profile: existing, error: readError } = await selectProfile(supabase, normalized);
  if (readError) {
    console.error('[auth] profile read before Google sync', readError.message || readError);
    return { phone };
  }

  const fields = {};
  if (display && blank(existing?.display_name)) fields.display_name = display;
  if (first && blank(existing?.first_name)) fields.first_name = first;
  if (last && blank(existing?.last_name)) fields.last_name = last;
  if (avatar && blank(existing?.avatar_url)) fields.avatar_url = avatar;
  if (phone && blank(existing?.phone_number)) fields.phone_number = phone;

  if (Object.keys(fields).length) {
    const { error } = await upsertProfile(supabase, normalized, fields);
    if (error) console.error('[auth] Google profile sync', error.message || error);
  }

  return { phone };
}
