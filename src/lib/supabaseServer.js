import { createClient } from '@supabase/supabase-js';

function decodeJwtPayload(key) {
  const part = key.split('.')[1];
  if (!part) return null;
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const json =
    typeof Buffer !== 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf8')
      : atob(base64);
  if (!json?.trim()) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** True only for a Supabase service_role JWT (bypasses RLS). */
export function isValidServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return false;
  if (key.startsWith('sb_publishable_') || key.includes('publishable')) return false;
  if (!key.startsWith('eyJ')) return false;
  try {
    const payload = decodeJwtPayload(key);
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

export function hasServiceRoleKey() {
  return isValidServiceRoleKey();
}

/**
 * Server-side Supabase client.
 * @param {boolean} useServiceRole - Use SUPABASE_SERVICE_ROLE_KEY when it is a valid service_role JWT.
 */
export function getSupabaseServer(useServiceRole = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (useServiceRole && isValidServiceRoleKey()) {
    return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  return createClient(url, anonKey);
}
