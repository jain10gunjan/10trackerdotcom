/**
 * Contest window + participant helpers (server-side).
 */

export function isContestActive(contest, now = new Date()) {
  if (!contest || contest.status !== 'published') return false;
  const t = now.getTime();
  if (contest.starts_at && t < new Date(contest.starts_at).getTime()) return false;
  if (contest.ends_at && t > new Date(contest.ends_at).getTime()) return false;
  return true;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} contestId
 * @param {{ userId: string, userEmail?: string|null, displayName?: string|null }} user
 */
export async function ensureParticipant(supabase, contestId, user) {
  const { data: existing, error: findErr } = await supabase
    .from('coding_participants')
    .select('id')
    .eq('contest_id', contestId)
    .eq('user_id', user.userId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('coding_participants')
    .insert({
      contest_id: contestId,
      user_id: user.userId,
      user_email: user.userEmail || null,
      display_name: user.displayName || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Sanitize submission result for client (never leak hidden I/O).
 * @param {Record<string, unknown>} result
 * @param {{ includeOutputs?: boolean }} [opts]
 */
export function publicSubmissionResult(result, opts = {}) {
  if (!result) return null;
  const hidden = Boolean(result.is_hidden);
  const base = {
    id: result.id,
    sort_order: result.sort_order,
    is_hidden: hidden,
    verdict: result.verdict,
    status: result.status,
    time_ms: result.time_ms,
    memory_kb: result.memory_kb,
    finished: result.finished,
    passed: result.verdict === 'Accepted',
  };
  if (!hidden && opts.includeOutputs !== false) {
    return {
      ...base,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  return base;
}

/**
 * @param {Record<string, unknown>} submission
 * @param {Array<Record<string, unknown>>} [results]
 */
export function publicSubmission(submission, results = []) {
  if (!submission) return null;
  return {
    id: submission.id,
    contest_id: submission.contest_id,
    problem_id: submission.problem_id,
    user_id: submission.user_id,
    language_id: submission.language_id,
    status: submission.status,
    verdict: submission.verdict,
    score: submission.score,
    time_ms: submission.time_ms,
    memory_kb: submission.memory_kb,
    is_run_only: submission.is_run_only,
    error_message: submission.error_message,
    created_at: submission.created_at,
    finished_at: submission.finished_at,
    // Never return full source to other users — caller must gate.
    source_code: submission.source_code,
    results: (results || []).map((r) => publicSubmissionResult(r)),
  };
}
