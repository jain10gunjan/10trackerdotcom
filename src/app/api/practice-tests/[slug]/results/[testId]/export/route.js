import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { normalizeRollNo } from '@/features/vendor-tests/lib/vendorEnrollment';

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET — CSV export for a test's attempts
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
    .select('id, title')
    .eq('vendor_id', ctx.vendor.id)
    .eq('id', testId)
    .maybeSingle();

  if (!test) {
    return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
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

  const header = [
    'dense_rank',
    'enrollment',
    'display_name',
    'email',
    'branch',
    'batch',
    'status',
    'score',
    'max_score',
    'percentage',
    'correct',
    'incorrect',
    'skipped',
    'duration_seconds',
    'anti_cheat_events',
    'cheated',
    'focus_violations',
    'submitted_at',
    'attempt_id',
  ];

  const lines = [header.join(',')];
  const sorted = [...(attempts || [])].sort((a, b) => {
    if (a.dense_rank != null && b.dense_rank != null) return a.dense_rank - b.dense_rank;
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  });

  for (const a of sorted) {
    const mem = membersByEmail[a.user_email] || {};
    const snap = a.final_stats?.enrollment || {};
    const events = Array.isArray(a.anti_cheat_events) ? a.anti_cheat_events.length : 0;
    lines.push(
      [
        a.dense_rank,
        normalizeRollNo(snap.roll_no) || normalizeRollNo(mem.roll_no),
        snap.display_name || mem.display_name,
        a.user_email,
        snap.branch || mem.branch,
        snap.batch || mem.batch,
        a.status,
        a.score,
        a.max_score,
        a.percentage,
        a.correct_count,
        a.incorrect_count,
        a.skipped_count,
        a.duration_taken,
        events,
        a.final_stats?.cheated ? 'yes' : 'no',
        a.final_stats?.focusViolationCount ??
          (Array.isArray(a.anti_cheat_events)
            ? a.anti_cheat_events.filter((event) => event?.type === 'focus_violation').length
            : 0),
        a.submitted_at,
        a.id,
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  const filename = `${(test.title || 'test').replace(/[^\w.-]+/g, '_')}_results.csv`;
  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
