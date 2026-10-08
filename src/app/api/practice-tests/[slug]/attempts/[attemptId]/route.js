import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import {
  normalizeClientAnswers,
} from '@/features/vendor-tests/lib/attemptQuestions';
import {
  loadPublishedTest,
  loadTestPins,
  loadOwnedAttempt,
  loadVendorQuestionsByIds,
  buildClientAttemptPayload,
} from '@/features/vendor-tests/server/attemptService';

/**
 * GET — load attempt + sanitized questions (resume)
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

  if (attempt.status === 'frozen_access_revoked') {
    return NextResponse.json(
      {
        success: false,
        error: 'This attempt was frozen because access was revoked',
        attempt: { id: attempt.id, status: attempt.status },
      },
      { status: 403 }
    );
  }

  // Prefer snapshotted paper — skip bank load on resume
  const hasSnapshot = Array.isArray(attempt.final_stats?.paper)
    && attempt.final_stats.paper.length > 0;

  let pins = [];
  let questions = [];
  if (!hasSnapshot) {
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

  const payload = buildClientAttemptPayload({
    attempt,
    test,
    pins,
    questions,
  });

  return NextResponse.json({ success: true, ...payload });
}

/**
 * PATCH — autosave answers / index / marked_for_review
 * Body: { answers?, currentQuestionIndex?, markedForReview?, merge?: true }
 */
export async function PATCH(request, { params }) {
  const { slug, attemptId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const body = await request.json();
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
    if (attempt.status === 'frozen_access_revoked') {
      return NextResponse.json(
        { success: false, error: 'Attempt frozen — answers can no longer be saved' },
        { status: 403 }
      );
    }
    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, error: 'Attempt already submitted', status: attempt.status },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const patch = {
      last_saved_at: now,
      updated_at: now,
    };

    if (body.answers !== undefined) {
      const merge = body.merge !== false;
      patch.answers = merge
        ? normalizeClientAnswers(body.answers, attempt.answers || {})
        : normalizeClientAnswers(body.answers, {});
    }

    if (body.currentQuestionIndex !== undefined) {
      const idx = Number(body.currentQuestionIndex);
      if (Number.isFinite(idx) && idx >= 0) {
        patch.current_question_index = Math.floor(idx);
      }
    }

    if (body.markedForReview !== undefined) {
      const list = Array.isArray(body.markedForReview)
        ? body.markedForReview.map(String)
        : [];
      patch.marked_for_review = [...new Set(list)];
    }

    const { data, error: upErr } = await ctx.supabase
      .from('vendor_attempts')
      .update(patch)
      .eq('id', attemptId)
      .eq('vendor_id', ctx.vendor.id)
      .eq('user_email', ctx.email)
      .eq('status', 'in_progress')
      .select('id, last_saved_at, current_question_index, marked_for_review, answers')
      .maybeSingle();

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Attempt is no longer in progress' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      lastSavedAt: data.last_saved_at,
      currentQuestionIndex: data.current_question_index,
      markedForReview: data.marked_for_review,
      answers: data.answers,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
