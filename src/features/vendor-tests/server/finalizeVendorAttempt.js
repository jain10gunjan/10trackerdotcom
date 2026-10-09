import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  normalizeClientAnswers,
  canReleaseResults,
} from '@/features/vendor-tests/lib/attemptQuestions';
import { scoreVendorAttempt } from '@/features/vendor-tests/lib/scoreVendorAttempt';
import { recomputeVendorTestRanks } from '@/features/vendor-tests/lib/vendorRanks';
import {
  loadTestPins,
  loadOwnedAttempt,
  loadVendorQuestionsByIds,
} from '@/features/vendor-tests/server/attemptService';

export function focusViolationLimit(test) {
  const n = Number(test?.max_focus_violations);
  if (!Number.isFinite(n) || n < 1) return 4;
  return Math.min(50, Math.round(n));
}

export function countFocusViolations(attempt) {
  if (attempt?.focus_violation_count != null && attempt.focus_violation_count !== '') {
    const n = Number(attempt.focus_violation_count);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const events = Array.isArray(attempt?.anti_cheat_events) ? attempt.anti_cheat_events : [];
  return events.filter((event) => event?.type === 'focus_violation').length;
}

export function attemptIsCheated(attempt) {
  return Boolean(attempt?.cheated || attempt?.final_stats?.cheated);
}

/** Drop unknown columns so a missing migration does not block submit. */
export async function updateInProgressAttempt(supabase, { vendorId, attemptId, userEmail, patch }) {
  let row = { ...patch, updated_at: new Date().toISOString() };
  let last = null;
  for (let i = 0; i < 8; i += 1) {
    last = await supabase
      .from('vendor_attempts')
      .update(row)
      .eq('id', attemptId)
      .eq('vendor_id', vendorId)
      .eq('user_email', userEmail)
      .eq('status', 'in_progress')
      .select('*')
      .maybeSingle();
    if (!last.error) return last;
    const match = /Could not find the '([^']+)' column/i.exec(last.error.message || '');
    if (
      (last.error.code === 'PGRST204' || last.error.code === '42703') &&
      match &&
      Object.prototype.hasOwnProperty.call(row, match[1])
    ) {
      delete row[match[1]];
      continue;
    }
    return last;
  }
  return last;
}

export function summarizeAttempt(attempt, released) {
  const cheated = attemptIsCheated(attempt);
  return {
    id: attempt.id,
    testId: attempt.test_id,
    status: attempt.status,
    submittedAt: attempt.submitted_at,
    durationTaken: attempt.duration_taken,
    resultsReleased: released,
    cheated,
    focusViolationCount: countFocusViolations(attempt),
    score: released ? attempt.score : null,
    maxScore: released ? attempt.max_score : null,
    percentage: released ? attempt.percentage : null,
    correctCount: released ? attempt.correct_count : null,
    incorrectCount: released ? attempt.incorrect_count : null,
    skippedCount: released ? attempt.skipped_count : null,
    denseRank: released ? attempt.dense_rank : null,
    rank: released ? attempt.rank : null,
  };
}

/**
 * Score and close an in-progress attempt.
 * Cheated is set only when recorded switches are past the test limit.
 */
export async function finalizeVendorAttempt({
  supabase,
  vendorId,
  email,
  attemptId,
  attempt,
  test,
  answers: rawAnswers,
  markedForReview: rawMarked,
  auto = false,
}) {
  const released = canReleaseResults(test);

  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    return {
      ok: true,
      alreadySubmitted: true,
      attempt: summarizeAttempt(attempt, released),
    };
  }

  if (attempt.status === 'frozen_access_revoked') {
    return {
      ok: false,
      status: 403,
      error: 'Attempt was frozen — it cannot be submitted as a scored attempt',
      attemptStatus: attempt.status,
    };
  }

  const answers =
    rawAnswers !== undefined
      ? normalizeClientAnswers(rawAnswers, attempt.answers || {})
      : attempt.answers || {};
  const markedForReview =
    rawMarked !== undefined
      ? [...new Set((rawMarked || []).map(String))]
      : attempt.marked_for_review || [];

  const stats = attempt.final_stats || {};
  const answerKey = stats.answerKey || null;
  let pins = [];
  let questions = [];

  if (!answerKey || !Object.keys(answerKey).length) {
    const { pins: p, error: pinErr } = await loadTestPins(supabase, vendorId, attempt.test_id);
    if (pinErr) return { ok: false, status: 500, error: pinErr.message };
    pins = p;
    const ids = pins.map((row) => row.question_id);
    const { questions: q, error: qErr } = await loadVendorQuestionsByIds(supabase, vendorId, ids);
    if (qErr) return { ok: false, status: 500, error: qErr.message };
    questions = q;
  }

  const scored = scoreVendorAttempt({
    pins,
    questions,
    answers,
    markedForReview,
    negativeMarking: test.negative_marking,
    answerKey,
    questionOrder: stats.questionOrder || null,
  });

  const now = new Date();
  const started = attempt.started_at ? new Date(attempt.started_at) : now;
  const durationTaken = Math.max(0, Math.round((now.getTime() - started.getTime()) / 1000));
  const violations = countFocusViolations(attempt);
  const limit = focusViolationLimit(test);
  const cheated = test.anti_cheat_enabled !== false && violations > limit;
  const status = auto || cheated ? 'auto_submitted' : 'submitted';

  const { data: updated, error: upErr } = await updateInProgressAttempt(supabase, {
    vendorId,
    attemptId,
    userEmail: email,
    patch: {
      status,
      submitted_at: now.toISOString(),
      duration_taken: durationTaken,
      answers,
      marked_for_review: markedForReview,
      score: scored.score,
      max_score: scored.maxScore,
      percentage: scored.percentage,
      correct_count: scored.correctCount,
      incorrect_count: scored.incorrectCount,
      skipped_count: scored.skippedCount,
      last_saved_at: now.toISOString(),
      cheated,
      focus_violation_count: violations,
      final_stats: {
        ...stats,
        scoredAt: now.toISOString(),
        submitMode: status,
        cheated,
        focusViolationCount: violations,
        focusViolationLimit: limit,
        submitReason: cheated ? 'focus_violations' : auto ? 'timer' : 'student',
      },
    },
  });

  if (upErr) return { ok: false, status: 500, error: upErr.message };

  if (!updated) {
    const { attempt: again } = await loadOwnedAttempt(supabase, vendorId, attemptId, email);
    if (again && (again.status === 'submitted' || again.status === 'auto_submitted')) {
      return {
        ok: true,
        alreadySubmitted: true,
        attempt: summarizeAttempt(again, released),
      };
    }
    return {
      ok: false,
      status: 409,
      error: 'Could not submit attempt',
      attemptStatus: again?.status,
    };
  }

  const responseRows = scored.responses.map((r) => ({
    vendor_id: vendorId,
    attempt_id: attemptId,
    question_id: r.question_id,
    question_order: r.question_order,
    user_answer: r.user_answer,
    correct_answer: r.correct_answer,
    is_correct: r.is_correct,
    marks_awarded: r.marks_awarded,
    time_taken: r.time_taken,
    marked_for_review: r.marked_for_review,
    subject: r.subject,
    topic: r.topic,
    difficulty: r.difficulty,
  }));

  await supabase.from('vendor_attempt_responses').delete().eq('attempt_id', attemptId).eq('vendor_id', vendorId);

  if (responseRows.length) {
    const { error: respErr } = await supabase.from('vendor_attempt_responses').insert(responseRows);
    if (respErr) console.error('vendor_attempt_responses insert failed', respErr);
  }

  await recomputeVendorTestRanks(supabase, vendorId, attempt.test_id);

  const { attempt: ranked } = await loadOwnedAttempt(supabase, vendorId, attemptId, email);

  await writeVendorAuditLog(supabase, {
    vendorId,
    actorEmail: email,
    action: 'attempt.submitted',
    entityType: 'vendor_attempt',
    entityId: attemptId,
    details: {
      status,
      cheated,
      focusViolationCount: violations,
      score: scored.score,
      maxScore: scored.maxScore,
      percentage: scored.percentage,
    },
  });

  return {
    ok: true,
    alreadySubmitted: false,
    attempt: summarizeAttempt(ranked || updated, released),
  };
}
