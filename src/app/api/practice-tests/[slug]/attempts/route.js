import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import {
  inTestWindow,
  canReleaseResults,
} from '@/features/vendor-tests/lib/attemptQuestions';
import {
  loadPublishedTest,
  buildClientAttemptPayload,
} from '@/features/vendor-tests/server/attemptService';
import {
  hasRollNo,
  normalizeRollNo,
  validateRollNo,
  enrollmentRulesFromSettings,
} from '@/features/vendor-tests/lib/vendorEnrollment';
import {
  getCachedVendorPaper,
  buildAttemptPaperSnapshot,
} from '@/features/vendor-tests/lib/vendorPaperCache';

/**
 * POST — start or resume an attempt
 * Body: { testId }
 */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const body = await request.json();
    const testId = String(body.testId || body.test_id || '').trim();
    if (!testId) {
      return NextResponse.json({ success: false, error: 'testId required' }, { status: 400 });
    }

    if (!hasRollNo(ctx.member)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enrollment / roll number is required before starting a test',
          code: 'enrollment_required',
        },
        { status: 400 }
      );
    }

    const enrollmentFormat = validateRollNo(
      ctx.member.roll_no,
      enrollmentRulesFromSettings(ctx.settings)
    );
    if (!enrollmentFormat.ok) {
      return NextResponse.json(
        {
          success: false,
          error: enrollmentFormat.error,
          code: 'enrollment_invalid',
        },
        { status: 400 }
      );
    }

    const { test, error: tErr } = await loadPublishedTest(
      ctx.supabase,
      ctx.vendor.id,
      testId
    );
    if (tErr) {
      return NextResponse.json({ success: false, error: tErr.message }, { status: 500 });
    }
    if (!test || test.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Test not available' }, { status: 404 });
    }
    if (!inTestWindow(test)) {
      return NextResponse.json(
        { success: false, error: 'Test is outside its schedule window' },
        { status: 403 }
      );
    }

    // Resume in-progress (prefer snapshot — no bank hit)
    const { data: existingOpen } = await ctx.supabase
      .from('vendor_attempts')
      .select('*')
      .eq('vendor_id', ctx.vendor.id)
      .eq('test_id', testId)
      .eq('user_email', ctx.email)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let paperBundle;
    try {
      paperBundle = await getCachedVendorPaper(
        ctx.vendor.id,
        testId,
        test.updated_at
      );
    } catch (cacheErr) {
      return NextResponse.json(
        { success: false, error: cacheErr.message || 'Failed to load test paper' },
        { status: 500 }
      );
    }

    const pins = paperBundle.pins || [];
    const questions = paperBundle.questions || [];
    if (!pins.length) {
      return NextResponse.json(
        { success: false, error: 'Test has no questions' },
        { status: 400 }
      );
    }

    if (existingOpen) {
      const payload = buildClientAttemptPayload({
        attempt: existingOpen,
        test,
        pins,
        questions,
      });
      return NextResponse.json({
        success: true,
        resumed: true,
        ...payload,
      });
    }

    const { count: usedCount } = await ctx.supabase
      .from('vendor_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', ctx.vendor.id)
      .eq('test_id', testId)
      .eq('user_email', ctx.email)
      .in('status', ['submitted', 'auto_submitted', 'frozen_access_revoked']);

    const maxAttempts = Math.max(1, Number(test.max_attempts) || 1);
    if ((usedCount || 0) >= maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum attempts (${maxAttempts}) reached for this test`,
        },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const enrollmentSnapshot = {
      roll_no: normalizeRollNo(ctx.member.roll_no),
      display_name: ctx.member.display_name || null,
      branch: ctx.member.branch || null,
      batch: ctx.member.batch || null,
    };

    const { data: created, error: createErr } = await ctx.supabase
      .from('vendor_attempts')
      .insert({
        vendor_id: ctx.vendor.id,
        test_id: testId,
        user_email: ctx.email,
        status: 'in_progress',
        started_at: now,
        answers: {},
        current_question_index: 0,
        marked_for_review: [],
        anti_cheat_events: [],
        final_stats: { enrollment: enrollmentSnapshot },
        last_saved_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (createErr || !created) {
      return NextResponse.json(
        { success: false, error: createErr?.message || 'Failed to start attempt' },
        { status: 500 }
      );
    }

    const snapshot = buildAttemptPaperSnapshot({
      attemptId: created.id,
      pins,
      questions,
      shuffleQuestions: !!test.shuffle_questions,
      shuffleOptions: !!test.shuffle_options,
      testUpdatedAt: test.updated_at,
    });

    const { data: attempt, error: upErr } = await ctx.supabase
      .from('vendor_attempts')
      .update({
        final_stats: {
          enrollment: enrollmentSnapshot,
          questionOrder: snapshot.questionOrder,
          optionOrders: snapshot.optionOrders,
          paper: snapshot.paper,
          answerKey: snapshot.answerKey,
          paperVersion: snapshot.paperVersion,
          paperCachedAt: snapshot.paperCachedAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', created.id)
      .eq('vendor_id', ctx.vendor.id)
      .select('*')
      .single();

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'attempt.started',
      entityType: 'vendor_attempt',
      entityId: attempt.id,
      details: { testId, paperVersion: snapshot.paperVersion },
    });

    const payload = buildClientAttemptPayload({
      attempt,
      test,
      pins,
      questions,
    });

    return NextResponse.json({
      success: true,
      resumed: false,
      ...payload,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET ?testId= — list my attempts for a test (status only)
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  if (!testId) {
    return NextResponse.json({ success: false, error: 'testId required' }, { status: 400 });
  }

  const { data, error: listErr } = await ctx.supabase
    .from('vendor_attempts')
    .select(
      'id, status, started_at, submitted_at, score, max_score, percentage, duration_taken'
    )
    .eq('vendor_id', ctx.vendor.id)
    .eq('test_id', testId)
    .eq('user_email', ctx.email)
    .order('started_at', { ascending: false });

  if (listErr) {
    return NextResponse.json({ success: false, error: listErr.message }, { status: 500 });
  }

  const { test } = await loadPublishedTest(ctx.supabase, ctx.vendor.id, testId);
  const released = canReleaseResults(test);

  const attempts = (data || []).map((a) => ({
    ...a,
    score: released ? a.score : null,
    max_score: released ? a.max_score : null,
    percentage: released ? a.percentage : null,
    resultsReleased: released,
  }));

  return NextResponse.json({ success: true, attempts });
}
