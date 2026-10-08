import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  normalizeClientAnswers,
  canReleaseResults,
} from '@/features/vendor-tests/lib/attemptQuestions';
import { scoreVendorAttempt } from '@/features/vendor-tests/lib/scoreVendorAttempt';
import {
  loadPublishedTest,
  loadTestPins,
  loadOwnedAttempt,
  loadVendorQuestionsByIds,
} from '@/features/vendor-tests/server/attemptService';
import { recomputeVendorTestRanks } from '@/features/vendor-tests/lib/vendorRanks';

/**
 * POST — submit attempt (server score). Idempotent if already submitted.
 * Body: { answers?, markedForReview?, auto?: boolean }
 */
export async function POST(request, { params }) {
  const { slug, attemptId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const body = (await request.json().catch(() => ({}))) || {};
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

    // Idempotent: already finished
    if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attempt: summarizeAttempt(attempt, released),
      });
    }

    if (attempt.status === 'frozen_access_revoked') {
      return NextResponse.json(
        {
          success: false,
          error: 'Attempt was frozen — it cannot be submitted as a scored attempt',
          status: attempt.status,
        },
        { status: 403 }
      );
    }

    const answers =
      body.answers !== undefined
        ? normalizeClientAnswers(body.answers, attempt.answers || {})
        : attempt.answers || {};
    const markedForReview =
      body.markedForReview !== undefined
        ? [...new Set((body.markedForReview || []).map(String))]
        : attempt.marked_for_review || [];

    const stats = attempt.final_stats || {};
    const answerKey = stats.answerKey || null;
    let pins = [];
    let questions = [];

    // Prefer snapshotted answerKey (fair + no bank hit). Else load bank.
    if (!answerKey || !Object.keys(answerKey).length) {
      const { pins: p, error: pinErr } = await loadTestPins(
        ctx.supabase,
        ctx.vendor.id,
        attempt.test_id
      );
      if (pinErr) {
        return NextResponse.json({ success: false, error: pinErr.message }, { status: 500 });
      }
      pins = p;
      const ids = pins.map((row) => row.question_id);
      const { questions: q, error: qErr } = await loadVendorQuestionsByIds(
        ctx.supabase,
        ctx.vendor.id,
        ids
      );
      if (qErr) {
        return NextResponse.json({ success: false, error: qErr.message }, { status: 500 });
      }
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
    const durationTaken = Math.max(
      0,
      Math.round((now.getTime() - started.getTime()) / 1000)
    );
    const status = body.auto ? 'auto_submitted' : 'submitted';

    const responseRows = scored.responses.map((r) => ({
      vendor_id: ctx.vendor.id,
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

    // Conditional update — double-submit safe
    const { data: updated, error: upErr } = await ctx.supabase
      .from('vendor_attempts')
      .update({
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
        updated_at: now.toISOString(),
        final_stats: {
          ...(attempt.final_stats || {}),
          scoredAt: now.toISOString(),
          submitMode: status,
        },
      })
      .eq('id', attemptId)
      .eq('vendor_id', ctx.vendor.id)
      .eq('user_email', ctx.email)
      .eq('status', 'in_progress')
      .select('*')
      .maybeSingle();

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    if (!updated) {
      // Race: another submit won — return that result
      const { attempt: again } = await loadOwnedAttempt(
        ctx.supabase,
        ctx.vendor.id,
        attemptId,
        ctx.email
      );
      if (again && (again.status === 'submitted' || again.status === 'auto_submitted')) {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          attempt: summarizeAttempt(again, released),
        });
      }
      return NextResponse.json(
        { success: false, error: 'Could not submit attempt', status: again?.status },
        { status: 409 }
      );
    }

    // Replace response rows (safe on retry of scoring path)
    await ctx.supabase
      .from('vendor_attempt_responses')
      .delete()
      .eq('attempt_id', attemptId)
      .eq('vendor_id', ctx.vendor.id);

    if (responseRows.length) {
      const { error: respErr } = await ctx.supabase
        .from('vendor_attempt_responses')
        .insert(responseRows);
      if (respErr) {
        console.error('vendor_attempt_responses insert failed', respErr);
      }
    }

    await recomputeVendorTestRanks(ctx.supabase, ctx.vendor.id, attempt.test_id);

    const { attempt: ranked } = await loadOwnedAttempt(
      ctx.supabase,
      ctx.vendor.id,
      attemptId,
      ctx.email
    );

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'attempt.submitted',
      entityType: 'vendor_attempt',
      entityId: attemptId,
      details: {
        status,
        score: scored.score,
        maxScore: scored.maxScore,
        percentage: scored.percentage,
      },
    });

    return NextResponse.json({
      success: true,
      alreadySubmitted: false,
      attempt: summarizeAttempt(ranked || updated, released),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function summarizeAttempt(attempt, released) {
  return {
    id: attempt.id,
    testId: attempt.test_id,
    status: attempt.status,
    submittedAt: attempt.submitted_at,
    durationTaken: attempt.duration_taken,
    resultsReleased: released,
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
