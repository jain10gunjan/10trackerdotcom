import { JOB_STATUS } from './constants.js';
import { logContest } from './logger.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} jobType
 * @param {Record<string, unknown>} payload
 * @param {{ availableAt?: Date|string, maxAttempts?: number }} [opts]
 */
export async function enqueueJob(supabase, jobType, payload, opts = {}) {
  const row = {
    job_type: jobType,
    payload: payload || {},
    status: JOB_STATUS.PENDING,
    priority: opts.priority ?? (jobType === 'poll_submission' ? 50 : 100),
    available_at: opts.availableAt
      ? new Date(opts.availableAt).toISOString()
      : new Date().toISOString(),
    max_attempts: opts.maxAttempts ?? 8,
  };
  let { data, error } = await supabase
    .from('coding_judge_jobs')
    .insert(row)
    .select('*')
    .single();

  // Backward compatible if scale migration (priority column) not applied yet.
  if (error && /priority/i.test(error.message || '')) {
    delete row.priority;
    ({ data, error } = await supabase
      .from('coding_judge_jobs')
      .insert(row)
      .select('*')
      .single());
  }

  if (error) {
    logContest('error', 'enqueue_failed', { jobType, error: error.message });
    throw error;
  }
  return data;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} workerId
 */
export async function claimNextJob(supabase, workerId) {
  const jobs = await claimJobs(supabase, workerId, 1);
  return jobs[0] || null;
}

/**
 * Claim up to `limit` jobs (falls back to single-claim RPC).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} workerId
 * @param {number} [limit]
 */
export async function claimJobs(supabase, workerId, limit = 5) {
  const { data, error } = await supabase.rpc('claim_coding_judge_jobs', {
    p_worker_id: workerId,
    p_limit: limit,
  });
  if (!error) {
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  // Fallback if scale migration not applied yet.
  if (/claim_coding_judge_jobs|function .* does not exist/i.test(error.message || '')) {
    const { data: one, error: oneErr } = await supabase.rpc('claim_coding_judge_job', {
      p_worker_id: workerId,
    });
    if (oneErr) {
      logContest('error', 'claim_failed', { error: oneErr.message });
      throw oneErr;
    }
    if (Array.isArray(one)) return one[0] ? [one[0]] : [];
    return one ? [one] : [];
  }

  logContest('error', 'claim_failed', { error: error.message });
  throw error;
}

/**
 * Re-queue jobs stuck in processing (crashed workers).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {number} [staleSeconds]
 */
export async function requeueStaleJobs(supabase, staleSeconds = 120) {
  const { data, error } = await supabase.rpc('requeue_stale_coding_judge_jobs', {
    p_stale_seconds: staleSeconds,
  });
  if (error) {
    if (/does not exist/i.test(error.message || '')) return 0;
    logContest('warn', 'requeue_stale_failed', { error: error.message });
    return 0;
  }
  return Number(data) || 0;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} jobId
 */
export async function completeJob(supabase, jobId) {
  const { error } = await supabase
    .from('coding_judge_jobs')
    .update({
      status: JOB_STATUS.DONE,
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', jobId);
  if (error) throw error;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} jobId
 * @param {string} message
 * @param {{ retryDelayMs?: number, attempts?: number, maxAttempts?: number }} [opts]
 */
export async function failJob(supabase, jobId, message, opts = {}) {
  const attempts = opts.attempts ?? 0;
  const maxAttempts = opts.maxAttempts ?? 8;
  const retryDelayMs = opts.retryDelayMs ?? 2000 * 2 ** Math.min(attempts, 6);
  const canRetry = attempts < maxAttempts;

  const patch = {
    updated_at: new Date().toISOString(),
    last_error: String(message || 'failed').slice(0, 2000),
    locked_at: null,
    locked_by: null,
  };

  if (canRetry) {
    patch.status = JOB_STATUS.PENDING;
    patch.available_at = new Date(Date.now() + retryDelayMs).toISOString();
  } else {
    patch.status = JOB_STATUS.FAILED;
  }

  const { error } = await supabase.from('coding_judge_jobs').update(patch).eq('id', jobId);
  if (error) throw error;
}
