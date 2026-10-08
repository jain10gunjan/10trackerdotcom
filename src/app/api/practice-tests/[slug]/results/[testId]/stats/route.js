import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * GET — aggregate + question difficulty stats for a test
 */
export async function GET(_request, { params }) {
  const { slug, testId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.viewResults) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { data: test } = await ctx.supabase
    .from('vendor_tests')
    .select('id, title, total_questions')
    .eq('vendor_id', ctx.vendor.id)
    .eq('id', testId)
    .maybeSingle();

  if (!test) {
    return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
  }

  const { data: attempts, error: aErr } = await ctx.supabase
    .from('vendor_attempts')
    .select('id, status, score, percentage, duration_taken, anti_cheat_events')
    .eq('vendor_id', ctx.vendor.id)
    .eq('test_id', testId);

  if (aErr) {
    return NextResponse.json({ success: false, error: aErr.message }, { status: 500 });
  }

  const finished = (attempts || []).filter((a) =>
    ['submitted', 'auto_submitted'].includes(a.status)
  );
  const scores = finished.map((a) => Number(a.score) || 0);
  const percentages = finished.map((a) => Number(a.percentage) || 0);
  const durations = finished
    .map((a) => Number(a.duration_taken))
    .filter((n) => Number.isFinite(n));

  let antiCheatAttempts = 0;
  let antiCheatEvents = 0;
  for (const a of attempts || []) {
    const n = Array.isArray(a.anti_cheat_events) ? a.anti_cheat_events.length : 0;
    if (n > 0) {
      antiCheatAttempts += 1;
      antiCheatEvents += n;
    }
  }

  const attemptIds = finished.map((a) => a.id);
  let questionStats = [];

  if (attemptIds.length) {
    const { data: responses } = await ctx.supabase
      .from('vendor_attempt_responses')
      .select('question_id, question_order, is_correct, subject, topic')
      .eq('vendor_id', ctx.vendor.id)
      .in('attempt_id', attemptIds);

    const byQ = {};
    for (const r of responses || []) {
      const id = r.question_id;
      if (!byQ[id]) {
        byQ[id] = {
          questionId: id,
          questionOrder: r.question_order,
          subject: r.subject,
          topic: r.topic,
          answered: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        };
      }
      const b = byQ[id];
      if (r.is_correct === true) {
        b.correct += 1;
        b.answered += 1;
      } else if (r.is_correct === false) {
        b.incorrect += 1;
        b.answered += 1;
      } else {
        b.skipped += 1;
      }
    }

    questionStats = Object.values(byQ)
      .map((b) => ({
        ...b,
        correctRate:
          b.answered > 0
            ? Math.round((b.correct / b.answered) * 10000) / 100
            : null,
      }))
      .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
  }

  const avg = (arr) =>
    arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 100) / 100 : null;

  return NextResponse.json({
    success: true,
    test: { id: test.id, title: test.title },
    aggregates: {
      totalAttempts: (attempts || []).length,
      submittedCount: finished.length,
      inProgressCount: (attempts || []).filter((a) => a.status === 'in_progress').length,
      frozenCount: (attempts || []).filter((a) => a.status === 'frozen_access_revoked')
        .length,
      avgScore: avg(scores),
      medianScore: median(scores),
      avgPercentage: avg(percentages),
      avgDurationSeconds: avg(durations),
      antiCheatAttempts,
      antiCheatEvents,
    },
    questionStats,
  });
}
