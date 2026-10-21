import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';

export function getCodingContestsDb() {
  if (!isValidServiceRoleKey()) {
    throw new Error(
      'Coding contests require SUPABASE_SERVICE_ROLE_KEY. Run supabase/migrations/setup_coding_contests.sql then set the service role JWT.'
    );
  }
  return getSupabaseServer(true);
}
