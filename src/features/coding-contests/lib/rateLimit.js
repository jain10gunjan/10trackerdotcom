/**
 * DB-backed rate limits (no Redis). Uses hit_coding_rate_limit RPC.
 */

import { logContest } from './logger.js';

export const RATE_LIMITS = Object.freeze({
  SUBMIT_PER_USER_PER_MIN: Number(process.env.CODING_SUBMIT_RPM || 12),
  RUN_PER_USER_PER_MIN: Number(process.env.CODING_RUN_RPM || 20),
  SUBMIT_GLOBAL_PER_MIN: Number(process.env.CODING_SUBMIT_GLOBAL_RPM || 400),
  RUN_GLOBAL_PER_MIN: Number(process.env.CODING_RUN_GLOBAL_RPM || 600),
  MAX_INFLIGHT_PER_USER: Number(process.env.CODING_MAX_INFLIGHT_PER_USER || 3),
  WEBHOOK_PER_IP_PER_MIN: Number(process.env.CODING_WEBHOOK_RPM || 300),
});

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} key
 * @param {number} limit
 * @param {number} [windowSeconds]
 */
export async function checkRateLimit(supabase, key, limit, windowSeconds = 60) {
  try {
    const { data, error } = await supabase.rpc('hit_coding_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      // Migration not applied yet — fail open but log.
      logContest('warn', 'rate_limit_rpc_missing', { error: error.message, key });
      return { allowed: true, remaining: limit, resetAt: null, degraded: true };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: Boolean(row?.allowed),
      remaining: Number(row?.remaining ?? 0),
      resetAt: row?.reset_at || null,
      degraded: false,
    };
  } catch (err) {
    logContest('warn', 'rate_limit_error', { error: err.message, key });
    return { allowed: true, remaining: limit, resetAt: null, degraded: true };
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 */
export async function countInflightSubmissions(supabase, userId) {
  const { count, error } = await supabase
    .from('coding_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['queued', 'judging']);
  if (error) {
    logContest('warn', 'inflight_count_failed', { error: error.message });
    return 0;
  }
  return count || 0;
}
