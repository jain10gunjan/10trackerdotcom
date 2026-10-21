import { VERDICTS, isAcceptedVerdict, isTerminalVerdict } from '../../../lib/judge0/verdicts.js';
import { SUBMISSION_STATUS } from './constants.js';
import { getScoringStrategy } from './scoring.js';
import { logContest } from './logger.js';

/**
 * Recompute final verdict from per-test results and update submission + leaderboard.
 * Idempotent when called after all results finished.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} submissionId
 */
export async function finalizeSubmissionIfComplete(supabase, submissionId) {
  const { data: submission, error: subErr } = await supabase
    .from('coding_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();
  if (subErr) throw subErr;
  if (!submission) return { finalized: false, reason: 'missing' };
  if (submission.status === SUBMISSION_STATUS.DONE) {
    return { finalized: false, reason: 'already_done', submission };
  }

  const { data: results, error: resErr } = await supabase
    .from('coding_submission_results')
    .select('*')
    .eq('submission_id', submissionId)
    .order('sort_order', { ascending: true });
  if (resErr) throw resErr;

  if (!results?.length) {
    return { finalized: false, reason: 'no_results' };
  }

  const unfinished = results.filter((r) => !r.finished);
  if (unfinished.length) {
    return { finalized: false, reason: 'pending', pending: unfinished.length };
  }

  if (submission.is_run_only) {
    const r0 = results[0];
    const { error: runErr } = await supabase
      .from('coding_submissions')
      .update({
        status: SUBMISSION_STATUS.DONE,
        verdict: r0?.verdict || VERDICTS.INTERNAL_ERROR,
        time_ms: r0?.time_ms != null ? Math.round(Number(r0.time_ms)) : null,
        memory_kb: r0?.memory_kb ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .neq('status', SUBMISSION_STATUS.DONE);
    if (runErr) throw runErr;
    return { finalized: true, verdict: r0?.verdict, runOnly: true };
  }

  let verdict = VERDICTS.ACCEPTED;
  let score = 0;
  let maxTime = 0;
  let maxMem = 0;
  const total = results.length;
  let passed = 0;

  for (const r of results) {
    const v = r.verdict || VERDICTS.INTERNAL_ERROR;
    if (typeof r.time_ms === 'number') maxTime = Math.max(maxTime, r.time_ms);
    if (typeof r.memory_kb === 'number') maxMem = Math.max(maxMem, r.memory_kb);
    if (isAcceptedVerdict(v)) {
      passed += 1;
      continue;
    }
    if (verdict === VERDICTS.ACCEPTED) {
      verdict = v;
    }
  }

  if (verdict === VERDICTS.ACCEPTED) {
    score = 100;
  } else {
    score = total ? Math.round((passed / total) * 100) : 0;
  }

  const { error: upErr } = await supabase
    .from('coding_submissions')
    .update({
      status: SUBMISSION_STATUS.DONE,
      verdict,
      score,
      time_ms: Math.round(maxTime),
      memory_kb: maxMem || null,
      finished_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', submissionId)
    .neq('status', SUBMISSION_STATUS.DONE);
  if (upErr) throw upErr;

  await recomputeLeaderboardForUser(supabase, submission.contest_id, submission.user_id);

  logContest('info', 'submission_finalized', {
    submissionId,
    verdict,
    score,
  });

  return { finalized: true, verdict, score };
}

/**
 * Apply one Judge0 payload to a submission_result row (idempotent).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Record<string, unknown>} resultRow
 * @param {Record<string, unknown>} judge0Payload decoded submission
 * @param {(id: number, status?: object) => string} mapVerdict
 * @param {(text: string|null) => string|null} truncate
 */
export async function applyJudge0ResultToRow(
  supabase,
  resultRow,
  judge0Payload,
  mapVerdict,
  truncate
) {
  if (resultRow.finished) {
    return { updated: false, reason: 'already_finished' };
  }

  const statusId = judge0Payload?.status?.id ?? judge0Payload?.status_id;
  const verdict = mapVerdict(statusId, judge0Payload?.status);
  const terminal = isTerminalVerdict(verdict);

  const patch = {
    judge0_status_id: Number.isFinite(Number(statusId)) ? Number(statusId) : null,
    status: judge0Payload?.status?.description || verdict,
    verdict,
    time_ms:
      judge0Payload?.time != null
        ? Math.round(Number(judge0Payload.time) * 1000)
        : resultRow.time_ms,
    memory_kb:
      judge0Payload?.memory != null ? Number(judge0Payload.memory) : resultRow.memory_kb,
    stdout: truncate(judge0Payload?.stdout ?? null),
    stderr: truncate(
      [judge0Payload?.stderr, judge0Payload?.compile_output, judge0Payload?.message]
        .filter(Boolean)
        .join('\n') || null
    ),
    updated_at: new Date().toISOString(),
    finished: terminal,
  };

  const { error } = await supabase
    .from('coding_submission_results')
    .update(patch)
    .eq('id', resultRow.id)
    .eq('finished', false);
  if (error) throw error;

  return { updated: true, finished: terminal, verdict, submissionId: resultRow.submission_id };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} contestId
 * @param {string} userId
 */
export async function recomputeLeaderboardForUser(supabase, contestId, userId) {
  const { data: contest, error: cErr } = await supabase
    .from('coding_contests')
    .select('id, scoring_mode, starts_at, created_at, ignore_ce_penalty, wrong_penalty_minutes')
    .eq('id', contestId)
    .single();
  if (cErr) throw cErr;

  const { data: subs, error: sErr } = await supabase
    .from('coding_submissions')
    .select('id, problem_id, verdict, created_at, is_run_only, status')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .eq('is_run_only', false)
    .eq('status', SUBMISSION_STATUS.DONE);
  if (sErr) throw sErr;

  const { data: problems } = await supabase
    .from('coding_problems')
    .select('id, points')
    .eq('contest_id', contestId);

  const strategy = getScoringStrategy(contest.scoring_mode || 'icpc');
  const computed = strategy.compute(
    (subs || []).map((s) => ({
      problemId: s.problem_id,
      verdict: s.verdict,
      createdAt: s.created_at,
    })),
    {
      contestStartedAt: contest.starts_at || contest.created_at || new Date(0).toISOString(),
      options: {
        ignoreCompilationErrorPenalty: contest.ignore_ce_penalty !== false,
        wrongPenaltyMinutes: contest.wrong_penalty_minutes ?? 20,
      },
      problemPoints: Object.fromEntries((problems || []).map((p) => [p.id, p.points])),
    }
  );

  let lastAccepted = null;
  for (const s of subs || []) {
    if (s.verdict === VERDICTS.ACCEPTED) {
      const t = new Date(s.created_at).getTime();
      if (!lastAccepted || t > lastAccepted) lastAccepted = t;
    }
  }

  const { data: participant } = await supabase
    .from('coding_participants')
    .select('display_name, user_email')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .maybeSingle();

  const { error: upErr } = await supabase.from('coding_leaderboard_entries').upsert(
    {
      contest_id: contestId,
      user_id: userId,
      display_name: participant?.display_name || null,
      user_email: participant?.user_email || null,
      solved_count: computed.solvedCount || 0,
      penalty_minutes: computed.penaltyMinutes || 0,
      score: computed.score || 0,
      last_accepted_at: lastAccepted ? new Date(lastAccepted).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'contest_id,user_id' }
  );
  if (upErr) throw upErr;
}
