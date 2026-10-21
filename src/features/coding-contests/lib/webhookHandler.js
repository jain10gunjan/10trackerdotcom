import { getJudge0Config } from '../../../lib/judge0/config.js';
import { decodeSubmissionFields } from '../../../lib/judge0/encode.js';
import { mapJudge0StatusToVerdict } from '../../../lib/judge0/verdicts.js';
import { truncateOutput } from './truncate.js';
import {
  applyJudge0ResultToRow,
  finalizeSubmissionIfComplete,
} from './finalizeSubmission.js';
import { logContest } from './logger.js';
import { safeEqualString } from './security.js';

/**
 * Verify webhook secret from query or header (timing-safe).
 * @param {Request} request
 */
export function verifyWebhookSecret(request) {
  const cfg = getJudge0Config();
  const expected = cfg.webhookSecret;
  if (!expected) {
    return { ok: false, status: 503, error: 'JUDGE0_WEBHOOK_SECRET not configured' };
  }

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('secret') || '';
  const fromHeader =
    request.headers.get('x-judge0-webhook-secret') ||
    request.headers.get('x-webhook-secret') ||
    '';
  const provided = fromHeader || fromQuery;
  if (!provided || !safeEqualString(provided, expected)) {
    return { ok: false, status: 401, error: 'Invalid webhook secret' };
  }
  return { ok: true, resultId: url.searchParams.get('resultId') };
}

/**
 * Idempotent webhook handling.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Request} request
 * @param {unknown} body
 */
export async function handleJudge0Webhook(supabase, request, body) {
  const auth = verifyWebhookSecret(request);
  if (!auth.ok) return auth;

  const payload = decodeSubmissionFields(body && typeof body === 'object' ? body : {});
  const token = payload.token || payload?.submission?.token;
  const resultId = auth.resultId;

  let resultRow = null;
  if (resultId) {
    const { data, error } = await supabase
      .from('coding_submission_results')
      .select('*')
      .eq('id', resultId)
      .maybeSingle();
    if (error) throw error;
    resultRow = data;
  }
  if (!resultRow && token) {
    const { data, error } = await supabase
      .from('coding_submission_results')
      .select('*')
      .eq('judge0_token', token)
      .maybeSingle();
    if (error) throw error;
    resultRow = data;
  }

  if (!resultRow) {
    logContest('warn', 'webhook_unknown_token', { token, resultId });
    // Idempotent success — Judge0 may retry; avoid endless retries for orphans.
    return { ok: true, status: 200, ignored: true };
  }

  const applied = await applyJudge0ResultToRow(
    supabase,
    resultRow,
    payload,
    mapJudge0StatusToVerdict,
    truncateOutput
  );

  if (applied.finished || resultRow.finished) {
    await finalizeSubmissionIfComplete(supabase, resultRow.submission_id);
  }

  return {
    ok: true,
    status: 200,
    updated: applied.updated,
    finished: applied.finished,
    submissionId: resultRow.submission_id,
  };
}
