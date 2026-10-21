import {
  buildCallbackUrl,
  createBatch,
  createSubmission,
  getBatch,
  getSubmission,
} from '../../../lib/judge0/client.js';
import { mapJudge0StatusToVerdict } from '../../../lib/judge0/verdicts.js';
import { resolveSubmissionLimits } from '../../../lib/judge0/limits.js';
import { JOB_TYPES, SUBMISSION_STATUS } from '../lib/constants.js';
import { truncateOutput } from '../lib/truncate.js';
import { logContest } from '../lib/logger.js';
import { enqueueJob } from '../lib/jobQueue.js';
import {
  applyJudge0ResultToRow,
  finalizeSubmissionIfComplete,
} from '../lib/finalizeSubmission.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Record<string, unknown>} job
 */
export async function processJudgeJob(supabase, job) {
  const type = job.job_type;
  const payload = job.payload || {};

  if (type === JOB_TYPES.JUDGE_SUBMISSION) {
    await processJudgeSubmission(supabase, payload.submissionId);
    return;
  }
  if (type === JOB_TYPES.POLL_SUBMISSION) {
    await processPollSubmission(supabase, payload.submissionId, payload.attempt || 0);
    return;
  }
  if (type === JOB_TYPES.RUN_CUSTOM) {
    await processRunCustom(supabase, payload.submissionId);
    return;
  }
  throw new Error(`Unknown job type: ${type}`);
}

async function processJudgeSubmission(supabase, submissionId) {
  const { data: submission, error } = await supabase
    .from('coding_submissions')
    .select('*, coding_languages(judge0_language_id), coding_problems(*)')
    .eq('id', submissionId)
    .single();
  if (error) throw error;
  if (!submission) throw new Error('Submission not found');
  if (submission.is_run_only) {
    await processRunCustom(supabase, submissionId);
    return;
  }

  const { data: contest } = await supabase
    .from('coding_contests')
    .select('stop_on_first_fail')
    .eq('id', submission.contest_id)
    .single();

  const { data: testCases, error: tcErr } = await supabase
    .from('coding_test_cases')
    .select('*')
    .eq('problem_id', submission.problem_id)
    .order('sort_order', { ascending: true });
  if (tcErr) throw tcErr;
  if (!testCases?.length) {
    await supabase
      .from('coding_submissions')
      .update({
        status: SUBMISSION_STATUS.ERROR,
        verdict: 'Internal Error',
        error_message: 'No test cases configured',
        finished_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
    return;
  }

  await supabase
    .from('coding_submissions')
    .update({ status: SUBMISSION_STATUS.JUDGING })
    .eq('id', submissionId);

  // Clear prior results if re-judging
  await supabase.from('coding_submission_results').delete().eq('submission_id', submissionId);

  const languageId = submission.coding_languages?.judge0_language_id;
  if (!languageId) throw new Error('Language missing judge0_language_id');

  const problem = submission.coding_problems || {};
  const limits = resolveSubmissionLimits(problem);
  const stopEarly = contest?.stop_on_first_fail !== false;

  /** @type {Array<Record<string, unknown>>} */
  const resultRows = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const { data: row, error: insErr } = await supabase
      .from('coding_submission_results')
      .insert({
        submission_id: submissionId,
        test_case_id: tc.id,
        sort_order: tc.sort_order ?? i,
        is_hidden: tc.is_hidden !== false,
        finished: false,
      })
      .select('*')
      .single();
    if (insErr) throw insErr;
    resultRows.push({ ...row, _tc: tc });
  }

  // ICPC-style: submit sequentially and stop on first fail when configured.
  // Otherwise batch all.
  if (stopEarly) {
    for (const row of resultRows) {
      const callback_url = buildCallbackUrl(row.id);
      const created = await createSubmission({
        source_code: submission.source_code,
        language_id: languageId,
        stdin: row._tc.input,
        expected_output: row._tc.expected_output,
        callback_url,
        ...limits,
      });
      const token = created?.token;
      if (!token) throw new Error('Judge0 did not return token');

      await supabase
        .from('coding_submission_results')
        .update({ judge0_token: token })
        .eq('id', row.id);

      // Short poll to decide early-stop (webhook may also update).
      const judged = await waitBrieflyForToken(token);
      if (judged) {
        await applyJudge0ResultToRow(
          supabase,
          { ...row, judge0_token: token },
          judged,
          mapJudge0StatusToVerdict,
          truncateOutput
        );
        const verdict = mapJudge0StatusToVerdict(judged?.status?.id, judged?.status);
        if (verdict !== 'Accepted') {
          // Mark remaining as skipped
          const rest = resultRows.filter((r) => r.sort_order > row.sort_order);
          for (const r of rest) {
            await supabase
              .from('coding_submission_results')
              .update({
                finished: true,
                verdict: 'Skipped',
                status: 'Skipped',
                updated_at: new Date().toISOString(),
              })
              .eq('id', r.id)
              .eq('finished', false);
          }
          break;
        }
      }
    }
  } else {
    const batchPayload = resultRows.map((row) => ({
      source_code: submission.source_code,
      language_id: languageId,
      stdin: row._tc.input,
      expected_output: row._tc.expected_output,
      callback_url: buildCallbackUrl(row.id),
      ...limits,
    }));
    const created = await createBatch(batchPayload);
    for (let i = 0; i < resultRows.length; i++) {
      const token = created[i]?.token;
      if (!token) continue;
      await supabase
        .from('coding_submission_results')
        .update({ judge0_token: token })
        .eq('id', resultRows[i].id);
    }
  }

  await enqueueJob(supabase, JOB_TYPES.POLL_SUBMISSION, {
    submissionId,
    attempt: 0,
  });

  logContest('info', 'judge_enqueued_poll', { submissionId });
}

async function waitBrieflyForToken(token) {
  // One quick check; full completion handled by poll job / webhook.
  try {
    const data = await getSubmission(token);
    const id = data?.status?.id;
    if (id && id !== 1 && id !== 2) return data;
  } catch {
    /* ignore */
  }
  return null;
}

async function processPollSubmission(supabase, submissionId, attempt) {
  const { data: results, error } = await supabase
    .from('coding_submission_results')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('finished', false);
  if (error) throw error;

  if (!results?.length) {
    await finalizeSubmissionIfComplete(supabase, submissionId);
    return;
  }

  const tokens = results.map((r) => r.judge0_token).filter(Boolean);
  if (!tokens.length) {
    // Tokens not ready yet — retry
    if (attempt < 20) {
      await enqueueJob(
        supabase,
        JOB_TYPES.POLL_SUBMISSION,
        { submissionId, attempt: attempt + 1 },
        { availableAt: new Date(Date.now() + backoffMs(attempt)) }
      );
    }
    return;
  }

  const batch = tokens.length === 1 ? [await getSubmission(tokens[0])] : await getBatch(tokens);
  const byToken = new Map(batch.filter(Boolean).map((b) => [b.token, b]));

  for (const row of results) {
    const payload = byToken.get(row.judge0_token);
    if (!payload) continue;
    await applyJudge0ResultToRow(
      supabase,
      row,
      payload,
      mapJudge0StatusToVerdict,
      truncateOutput
    );
  }

  const { data: still } = await supabase
    .from('coding_submission_results')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('finished', false);

  if (still?.length) {
    if (attempt < 40) {
      await enqueueJob(
        supabase,
        JOB_TYPES.POLL_SUBMISSION,
        { submissionId, attempt: attempt + 1 },
        { availableAt: new Date(Date.now() + backoffMs(attempt)) }
      );
    } else {
      await supabase
        .from('coding_submissions')
        .update({
          status: SUBMISSION_STATUS.ERROR,
          verdict: 'Internal Error',
          error_message: 'Judging timed out waiting for Judge0',
          finished_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
    }
    return;
  }

  await finalizeSubmissionIfComplete(supabase, submissionId);
}

async function processRunCustom(supabase, submissionId) {
  const { data: submission, error } = await supabase
    .from('coding_submissions')
    .select('*, coding_languages(judge0_language_id), coding_problems(*)')
    .eq('id', submissionId)
    .single();
  if (error) throw error;

  const languageId = submission.coding_languages?.judge0_language_id;
  const limits = resolveSubmissionLimits(submission.coding_problems || {});

  await supabase
    .from('coding_submissions')
    .update({ status: SUBMISSION_STATUS.JUDGING })
    .eq('id', submissionId);

  await supabase.from('coding_submission_results').delete().eq('submission_id', submissionId);

  const { data: row, error: insErr } = await supabase
    .from('coding_submission_results')
    .insert({
      submission_id: submissionId,
      test_case_id: null,
      sort_order: 0,
      is_hidden: false,
      finished: false,
    })
    .select('*')
    .single();
  if (insErr) throw insErr;

  const created = await createSubmission({
    source_code: submission.source_code,
    language_id: languageId,
    stdin: submission.custom_stdin || '',
    expected_output: null,
    callback_url: buildCallbackUrl(row.id),
    ...limits,
  });

  await supabase
    .from('coding_submission_results')
    .update({ judge0_token: created.token })
    .eq('id', row.id);

  await enqueueJob(supabase, JOB_TYPES.POLL_SUBMISSION, {
    submissionId,
    attempt: 0,
  });
}

function backoffMs(attempt) {
  // Faster early polls, still caps for RapidAPI friendliness.
  return Math.min(12000, 250 * 2 ** Math.min(attempt, 5));
}
