import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { canReleaseResults } from '@/features/vendor-tests/lib/attemptQuestions';
import { percentileFromDenseRank } from '@/features/vendor-tests/lib/vendorRanks';
import {
  loadPublishedTest,
  loadOwnedAttempt,
  loadVendorQuestionsByIds,
  loadTestPins,
} from '@/features/vendor-tests/server/attemptService';
import { fromVendorQuestionRow } from '@/features/vendor-tests/lib/vendorQuestionNormalize';

/**
 * GET — detailed analysis for own attempt (keys only when results released)
 */
export async function GET(_request, { params }) {
  const { slug, attemptId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  const { attempt, error: aErr } = await loadOwnedAttempt(
    ctx.supabase,
    ctx.vendor.id,
    attemptId,
    ctx.email
  );
  if (aErr) {
    return NextResponse.json({ success: false, error: aErr.message }, { status: 500 });
  }
  if (!attempt) {
    return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
  }

  const { test, error: tErr } = await loadPublishedTest(
    ctx.supabase,
    ctx.vendor.id,
    attempt.test_id
  );
  if (tErr || !test) {
    return NextResponse.json(
      { success: false, error: tErr?.message || 'Test not found' },
      { status: tErr ? 500 : 404 }
    );
  }

  const released = canReleaseResults(test);
  const finished = ['submitted', 'auto_submitted'].includes(attempt.status);

  const summary = {
    id: attempt.id,
    testId: attempt.test_id,
    status: attempt.status,
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,
    durationTaken: attempt.duration_taken,
    resultsReleased: released,
    enrollment: attempt.final_stats?.enrollment || null,
    score: finished && released ? attempt.score : null,
    maxScore: finished && released ? attempt.max_score : null,
    percentage: finished && released ? attempt.percentage : null,
    correctCount: finished && released ? attempt.correct_count : null,
    incorrectCount: finished && released ? attempt.incorrect_count : null,
    skippedCount: finished && released ? attempt.skipped_count : null,
    denseRank: finished && released ? attempt.dense_rank : null,
    rank: finished && released ? attempt.rank : null,
    percentile: null,
  };

  if (!finished) {
    return NextResponse.json({
      success: true,
      analysis: null,
      summary,
      message: 'Attempt still in progress',
    });
  }

  if (!released) {
    return NextResponse.json({
      success: true,
      analysis: null,
      summary,
      message: 'Results not released yet',
    });
  }

  const { count: cohortCount } = await ctx.supabase
    .from('vendor_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', ctx.vendor.id)
    .eq('test_id', attempt.test_id)
    .in('status', ['submitted', 'auto_submitted']);

  summary.percentile = percentileFromDenseRank(
    attempt.dense_rank,
    cohortCount || 0
  );
  summary.cohortSize = cohortCount || 0;

  const { data: responses, error: rErr } = await ctx.supabase
    .from('vendor_attempt_responses')
    .select('*')
    .eq('vendor_id', ctx.vendor.id)
    .eq('attempt_id', attemptId)
    .order('question_order', { ascending: true });

  if (rErr) {
    return NextResponse.json({ success: false, error: rErr.message }, { status: 500 });
  }

  const { pins } = await loadTestPins(ctx.supabase, ctx.vendor.id, attempt.test_id);
  const qids = (pins || []).map((p) => p.question_id);
  const { questions } = await loadVendorQuestionsByIds(
    ctx.supabase,
    ctx.vendor.id,
    qids
  );
  const qById = Object.fromEntries(
    (questions || []).map((q) => [q._id, fromVendorQuestionRow(q)])
  );

  const questionReviews = (responses || []).map((r) => {
    const q = qById[r.question_id];
    return {
      questionId: r.question_id,
      questionOrder: r.question_order,
      question: q?.question || null,
      directionhtml: q?.directionhtml || q?.directionHTML || null,
      options: {
        A: q?.options_A ?? q?.options_a ?? null,
        B: q?.options_B ?? q?.options_b ?? null,
        C: q?.options_C ?? q?.options_c ?? null,
        D: q?.options_D ?? q?.options_d ?? null,
      },
      userAnswer: r.user_answer,
      correctAnswer: r.correct_answer,
      isCorrect: r.is_correct,
      marksAwarded: r.marks_awarded,
      timeTaken: r.time_taken,
      markedForReview: r.marked_for_review,
      subject: r.subject || q?.subject || null,
      topic: r.topic || q?.topic || null,
      difficulty: r.difficulty || q?.difficulty || null,
      solution: q?.solution || null,
      solutiontext: q?.solutiontext || null,
    };
  });

  const bySubject = {};
  const byTopic = {};
  for (const r of questionReviews) {
    const subj = r.subject || 'General';
    const topic = r.topic || 'General';
    if (!bySubject[subj]) bySubject[subj] = { correct: 0, incorrect: 0, skipped: 0, marks: 0 };
    if (!byTopic[topic]) byTopic[topic] = { correct: 0, incorrect: 0, skipped: 0, marks: 0 };
    const bucketS = bySubject[subj];
    const bucketT = byTopic[topic];
    if (r.isCorrect === true) {
      bucketS.correct += 1;
      bucketT.correct += 1;
    } else if (r.isCorrect === false) {
      bucketS.incorrect += 1;
      bucketT.incorrect += 1;
    } else {
      bucketS.skipped += 1;
      bucketT.skipped += 1;
    }
    bucketS.marks += Number(r.marksAwarded) || 0;
    bucketT.marks += Number(r.marksAwarded) || 0;
  }

  return NextResponse.json({
    success: true,
    summary,
    analysis: {
      questions: questionReviews,
      bySubject,
      byTopic,
      antiCheatEventCount: Array.isArray(attempt.anti_cheat_events)
        ? attempt.anti_cheat_events.length
        : 0,
    },
    test: {
      id: test.id,
      title: test.title,
      resultRelease: test.result_release,
    },
  });
}
