import {
  answersToClientMap,
  buildAttemptQuestionMeta,
  canReleaseResults,
  sanitizeQuestionForAttempt,
} from '../lib/attemptQuestions';
import { fromVendorQuestionRow } from '../lib/vendorQuestionNormalize';
import { backfillMissingOptionsFromPlatform } from '../lib/backfillQuestionOptions';

function clientViolationCount(attempt) {
  if (attempt?.focus_violation_count != null && attempt.focus_violation_count !== '') {
    const n = Number(attempt.focus_violation_count);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const events = Array.isArray(attempt?.anti_cheat_events) ? attempt.anti_cheat_events : [];
  return events.filter((event) => event?.type === 'focus_violation').length;
}

export async function loadPublishedTest(supabase, vendorId, testId) {
  const { data, error } = await supabase
    .from('vendor_tests')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('id', testId)
    .maybeSingle();
  return { test: data, error };
}

export async function loadTestPins(supabase, vendorId, testId) {
  const { data, error } = await supabase
    .from('vendor_test_questions')
    .select('question_id, question_order, marks')
    .eq('vendor_id', vendorId)
    .eq('test_id', testId)
    .order('question_order', { ascending: true });
  return { pins: data || [], error };
}

export async function loadVendorQuestionsByIds(supabase, vendorId, ids) {
  if (!ids?.length) return { questions: [], error: null };
  const { data, error } = await supabase
    .from('vendor_questions')
    .select('*')
    .eq('vendor_id', vendorId)
    .in('_id', ids);
  if (error) return { questions: [], error };

  const mapped = (data || []).map(fromVendorQuestionRow);
  const questions = await backfillMissingOptionsFromPlatform(supabase, mapped);
  return { questions, error: null };
}

export async function loadOwnedAttempt(supabase, vendorId, attemptId, userEmail) {
  const { data, error } = await supabase
    .from('vendor_attempts')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('id', attemptId)
    .eq('user_email', userEmail)
    .maybeSingle();
  return { attempt: data, error };
}

/**
 * Client-safe attempt payload (no answer keys while in progress).
 * Prefers snapshotted paper on the attempt (no bank re-fetch).
 */
export function buildClientAttemptPayload({
  attempt,
  test,
  pins,
  questions,
  includeKeys = false,
}) {
  const stats = attempt.final_stats || {};
  let questionOrder = Array.isArray(stats.questionOrder)
    ? stats.questionOrder.map(String)
    : null;
  let optionOrders = stats.optionOrders || {};

  // Snapshot path — do not expose answerKey
  if (Array.isArray(stats.paper) && stats.paper.length) {
    const order = questionOrder?.length
      ? questionOrder
      : stats.paper.map((q) => String(q._id));
    const byId = Object.fromEntries(
      stats.paper.map((q) => [String(q._id), q])
    );
    const clientQuestions = order.map((qid) => byId[qid]).filter(Boolean);

    const released = canReleaseResults(test);
    const isOpen = attempt.status === 'in_progress';
    return {
      attempt: {
        id: attempt.id,
        testId: attempt.test_id,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        durationTaken: attempt.duration_taken,
        currentQuestionIndex: attempt.current_question_index || 0,
        markedForReview: Array.isArray(attempt.marked_for_review)
          ? attempt.marked_for_review
          : [],
        answers: answersToClientMap(attempt.answers),
        lastSavedAt: attempt.last_saved_at,
        antiCheatEnabled: test?.anti_cheat_enabled !== false,
        maxFocusViolations: Number(test?.max_focus_violations) || 4,
        focusViolationCount: clientViolationCount(attempt),
        cheated: Boolean(attempt.cheated || attempt.final_stats?.cheated),
        score: !isOpen && released ? attempt.score : null,
        maxScore: !isOpen && released ? attempt.max_score : null,
        percentage: !isOpen && released ? attempt.percentage : null,
        correctCount: !isOpen && released ? attempt.correct_count : null,
        incorrectCount: !isOpen && released ? attempt.incorrect_count : null,
        skippedCount: !isOpen && released ? attempt.skipped_count : null,
        resultsReleased: released,
        fromSnapshot: true,
      },
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        instructions: test.instructions,
        durationMinutes: test.duration_minutes,
        negativeMarking: test.negative_marking,
        antiCheatEnabled: test.anti_cheat_enabled !== false,
        maxFocusViolations: Number(test?.max_focus_violations) || 4,
        resultRelease: test.result_release,
        startsAt: test.starts_at,
        endsAt: test.ends_at,
        totalQuestions: test.total_questions,
      },
      questions: clientQuestions,
    };
  }

  if (!questionOrder?.length) {
    const meta = buildAttemptQuestionMeta({
      pins,
      attemptId: attempt.id,
      shuffleQuestions: false,
      shuffleOptions: false,
    });
    questionOrder = meta.questionOrder;
    optionOrders = meta.optionOrders;
  }

  const pinById = Object.fromEntries(
    (pins || []).map((p) => [String(p.question_id), p])
  );
  const qById = Object.fromEntries((questions || []).map((q) => [q._id, q]));

  const clientQuestions = questionOrder
    .map((qid) => {
      const q = qById[qid];
      const pin = pinById[qid];
      if (!q || !pin) return null;
      if (includeKeys) {
        return {
          ...sanitizeQuestionForAttempt(q, {
            marks: pin.marks,
            optionOrder: optionOrders[qid],
          }),
          correct_option: q.correct_option,
          solution: q.solution,
          isCorrect: undefined,
        };
      }
      return sanitizeQuestionForAttempt(q, {
        marks: pin.marks,
        optionOrder: optionOrders[qid],
      });
    })
    .filter(Boolean);

  const released = canReleaseResults(test);
  const isOpen = attempt.status === 'in_progress';

  return {
    attempt: {
      id: attempt.id,
      testId: attempt.test_id,
      status: attempt.status,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      durationTaken: attempt.duration_taken,
      currentQuestionIndex: attempt.current_question_index || 0,
      markedForReview: Array.isArray(attempt.marked_for_review)
        ? attempt.marked_for_review
        : [],
      answers: isOpen ? answersToClientMap(attempt.answers) : answersToClientMap(attempt.answers),
      lastSavedAt: attempt.last_saved_at,
      antiCheatEnabled: test?.anti_cheat_enabled !== false,
      maxFocusViolations: Number(test?.max_focus_violations) || 4,
      focusViolationCount: clientViolationCount(attempt),
      cheated: Boolean(attempt.cheated || attempt.final_stats?.cheated),
      score: !isOpen && released ? attempt.score : null,
      maxScore: !isOpen && released ? attempt.max_score : null,
      percentage: !isOpen && released ? attempt.percentage : null,
      correctCount: !isOpen && released ? attempt.correct_count : null,
      incorrectCount: !isOpen && released ? attempt.incorrect_count : null,
      skippedCount: !isOpen && released ? attempt.skipped_count : null,
      resultsReleased: released,
    },
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      instructions: test.instructions,
      durationMinutes: test.duration_minutes,
      negativeMarking: test.negative_marking,
      antiCheatEnabled: test.anti_cheat_enabled !== false,
      maxFocusViolations: Number(test?.max_focus_violations) || 4,
      resultRelease: test.result_release,
      startsAt: test.starts_at,
      endsAt: test.ends_at,
      totalQuestions: test.total_questions,
    },
    questions: clientQuestions,
  };
}
