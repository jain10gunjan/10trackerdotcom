import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';

/**
 * Admin mock-test API routes (NextAuth admin check first).
 * Uses NEXT_PUBLIC_SUPABASE_ANON_KEY by default — same key you already have in .env.
 * If SUPABASE_SERVICE_ROLE_KEY is set (valid service_role JWT), uses that instead.
 *
 * With anon key, run scripts/fix_mock_tests_rls_secure.sql so RLS allows admin
 * SELECT/UPDATE via server routes while students still read active tests in the app.
 */
export const SUPABASE_ADMIN_SETUP_HINT =
  'Run scripts/fix_mock_tests_rls_secure.sql in Supabase SQL Editor. Admin routes use NEXT_PUBLIC_SUPABASE_ANON_KEY on the server after NextAuth admin verification.';

/** Server Supabase client for admin mock-test routes. */
export function getSupabaseAdmin() {
  if (isValidServiceRoleKey()) {
    return getSupabaseServer(true);
  }
  return getSupabaseServer(false);
}

export function usesAnonAdminKey() {
  return !isValidServiceRoleKey();
}

export function isRlsPolicyError(error) {
  const code = error?.code;
  const msg = String(error?.message || '');
  return (
    code === '42501' ||
    /row-level security/i.test(msg) ||
    /violates row-level security/i.test(msg)
  );
}

export function formatAdminDbError(error, setupHint = SUPABASE_ADMIN_SETUP_HINT) {
  if (isRlsPolicyError(error)) {
    return `${error.message} ${setupHint}`;
  }
  return error?.message || 'Database operation failed';
}

export function isUniqueViolation(error) {
  return error?.code === '23505';
}
