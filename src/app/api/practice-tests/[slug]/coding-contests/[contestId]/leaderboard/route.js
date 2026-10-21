import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { getCodingContestsDb } from '@/features/coding-contests/server/db';
import { sortLeaderboardRows } from '@/features/coding-contests/lib/scoring';

export async function GET(_request, { params }) {
  const { slug, contestId } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const supabase = getCodingContestsDb();
    const { data: contest } = await supabase
      .from('coding_contests')
      .select('id, title, scoring_mode, status')
      .eq('id', contestId)
      .eq('vendor_id', ctx.vendor.id)
      .maybeSingle();
    if (!contest) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const isStaff =
      ctx.role === 'vendor_staff' ||
      ctx.role === 'vendor_admin' ||
      ctx.isSuperAdmin;
    if (!isStaff && contest.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const { data: rows, error: dbErr } = await supabase
      .from('coding_leaderboard_entries')
      .select(
        'user_id, display_name, user_email, solved_count, penalty_minutes, score, last_accepted_at, updated_at'
      )
      .eq('contest_id', contestId);
    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }

    const sorted = sortLeaderboardRows(rows || [], contest.scoring_mode || 'icpc').map(
      (row, idx) => ({
        rank: idx + 1,
        user_id: row.user_id,
        display_name: row.display_name || row.user_email || 'Participant',
        solved_count: row.solved_count,
        penalty_minutes: row.penalty_minutes,
        score: row.score,
        last_accepted_at: row.last_accepted_at,
      })
    );

    return NextResponse.json(
      {
        success: true,
        contest: { id: contest.id, title: contest.title, scoring_mode: contest.scoring_mode },
        leaderboard: sorted,
      },
      {
        headers: {
          // Short cache to cut stampede from many open leaderboard tabs.
          'Cache-Control': 'private, max-age=2, stale-while-revalidate=5',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
