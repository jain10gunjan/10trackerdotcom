import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { normalizeRollNo } from '@/features/vendor-tests/lib/vendorEnrollment';

/**
 * GET — list tests with attempt counts, or attempts for ?testId=
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_staff');
  if (error) return error;
  if (!ctx.permissions.viewResults) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    const { data: tests, error: tErr } = await ctx.supabase
      .from('vendor_tests')
      .select(
        'id, title, status, total_questions, duration_minutes, result_release, results_released, starts_at, ends_at, created_at'
      )
      .eq('vendor_id', ctx.vendor.id)
      .order('created_at', { ascending: false });

    if (tErr) {
      return NextResponse.json({ success: false, error: tErr.message }, { status: 500 });
    }

    const { data: attempts } = await ctx.supabase
      .from('vendor_attempts')
      .select('test_id, status')
      .eq('vendor_id', ctx.vendor.id);

    const counts = {};
    for (const a of attempts || []) {
      if (!counts[a.test_id]) {
        counts[a.test_id] = { total: 0, submitted: 0, in_progress: 0, frozen: 0 };
      }
      counts[a.test_id].total += 1;
      if (a.status === 'submitted' || a.status === 'auto_submitted') {
        counts[a.test_id].submitted += 1;
      } else if (a.status === 'in_progress') {
        counts[a.test_id].in_progress += 1;
      } else if (a.status === 'frozen_access_revoked') {
        counts[a.test_id].frozen += 1;
      }
    }

    return NextResponse.json({
      success: true,
      tests: (tests || []).map((t) => ({
        ...t,
        attemptCounts: counts[t.id] || {
          total: 0,
          submitted: 0,
          in_progress: 0,
          frozen: 0,
        },
      })),
    });
  }

  const { data: test, error: tErr } = await ctx.supabase
    .from('vendor_tests')
    .select('*')
    .eq('vendor_id', ctx.vendor.id)
    .eq('id', testId)
    .maybeSingle();

  if (tErr || !test) {
    return NextResponse.json(
      { success: false, error: tErr?.message || 'Test not found' },
      { status: tErr ? 500 : 404 }
    );
  }

  const { data: attempts, error: aErr } = await ctx.supabase
    .from('vendor_attempts')
    .select(
      'id, user_email, status, started_at, submitted_at, duration_taken, score, max_score, percentage, correct_count, incorrect_count, skipped_count, dense_rank, rank, anti_cheat_events, final_stats'
    )
    .eq('vendor_id', ctx.vendor.id)
    .eq('test_id', testId)
    .order('score', { ascending: false });

  if (aErr) {
    return NextResponse.json({ success: false, error: aErr.message }, { status: 500 });
  }

  const emails = [...new Set((attempts || []).map((a) => a.user_email))];
  let membersByEmail = {};
  if (emails.length) {
    const { data: members } = await ctx.supabase
      .from('vendor_members')
      .select('user_email, roll_no, display_name, branch, batch')
      .eq('vendor_id', ctx.vendor.id)
      .in('user_email', emails);
    membersByEmail = Object.fromEntries(
      (members || []).map((m) => [m.user_email, m])
    );
  }

  const rows = (attempts || []).map((a) => {
    const mem = membersByEmail[a.user_email] || {};
    const snap = a.final_stats?.enrollment || {};
    const events = Array.isArray(a.anti_cheat_events) ? a.anti_cheat_events : [];
    return {
      id: a.id,
      userEmail: a.user_email,
      enrollment: normalizeRollNo(snap.roll_no) || normalizeRollNo(mem.roll_no),
      displayName: snap.display_name || mem.display_name || null,
      branch: snap.branch || mem.branch || null,
      batch: snap.batch || mem.batch || null,
      status: a.status,
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
      durationTaken: a.duration_taken,
      score: a.score,
      maxScore: a.max_score,
      percentage: a.percentage,
      correctCount: a.correct_count,
      incorrectCount: a.incorrect_count,
      skippedCount: a.skipped_count,
      denseRank: a.dense_rank,
      rank: a.rank,
      antiCheatEventCount: events.length,
      antiCheatEvents: events.slice(0, 50),
    };
  });

  // Prefer dense_rank sort; fallback score
  rows.sort((a, b) => {
    if (a.denseRank != null && b.denseRank != null) return a.denseRank - b.denseRank;
    if (a.denseRank != null) return -1;
    if (b.denseRank != null) return 1;
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  });

  return NextResponse.json({
    success: true,
    test: {
      id: test.id,
      title: test.title,
      status: test.status,
      result_release: test.result_release,
      results_released: test.results_released,
      ends_at: test.ends_at,
      total_questions: test.total_questions,
    },
    attempts: rows,
  });
}
