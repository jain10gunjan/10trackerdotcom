import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { canReleaseResults } from '@/features/vendor-tests/lib/attemptQuestions';
import {
  loadPublishedTest,
  loadOwnedAttempt,
} from '@/features/vendor-tests/server/attemptService';
import {
  finalizeVendorAttempt,
  summarizeAttempt,
} from '@/features/vendor-tests/server/finalizeVendorAttempt';

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
    if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attempt: summarizeAttempt(attempt, released),
      });
    }

    const result = await finalizeVendorAttempt({
      supabase: ctx.supabase,
      vendorId: ctx.vendor.id,
      email: ctx.email,
      attemptId,
      attempt,
      test,
      answers: body.answers,
      markedForReview: body.markedForReview,
      auto: !!body.auto,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, status: result.attemptStatus },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadySubmitted: !!result.alreadySubmitted,
      attempt: result.attempt,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
