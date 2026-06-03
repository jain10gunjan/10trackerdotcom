import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  buildPerTestLeaderboard,
  buildOverallLeaderboard,
  filterAttemptsByPeriod,
  findUserRank,
} from '@/lib/mockTestLeaderboard';
import { fetchLeaderboardData } from '@/lib/mockTestLeaderboardFetch';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email || null;

    const { searchParams } = new URL(request.url);
    const examCategory = searchParams.get('examCategory') || searchParams.get('category');
    const scope = searchParams.get('scope') || 'overall';
    const testId = searchParams.get('testId');
    const period = searchParams.get('period') || 'all';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    if (!examCategory) {
      return NextResponse.json({ success: false, error: 'examCategory is required' }, { status: 400 });
    }

    if (scope === 'test' && !testId) {
      return NextResponse.json({ success: false, error: 'testId is required for scope=test' }, { status: 400 });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());

    const { tests, testIds, testNameById, attempts, meta } = await fetchLeaderboardData(
      supabase,
      examCategory,
      { testId, scope }
    );

    const filtered = filterAttemptsByPeriod(attempts, period);
    const emails = [...new Set(filtered.map((a) => a.user_email).filter(Boolean))];

    let profilesMap = {};
    if (emails.length) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_email, display_name, avatar_url')
        .in('user_email', emails);
      profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_email, p]));
    }

    let entries;
    if (scope === 'test') {
      entries = buildPerTestLeaderboard(filtered, profilesMap, limit);
    } else {
      entries = buildOverallLeaderboard(filtered, testIds, profilesMap, limit);
    }

    const yourRank = userEmail ? findUserRank(entries, userEmail) : null;

    if (userEmail && !yourRank) {
      const full =
        scope === 'test'
          ? buildPerTestLeaderboard(filtered, profilesMap, 5000)
          : buildOverallLeaderboard(filtered, testIds, profilesMap, 5000);
      const fullRank = findUserRank(full, userEmail);
      if (fullRank) {
        return NextResponse.json({
          success: true,
          scope,
          period,
          testId: testId || null,
          testName: testId ? testNameById[testId] : null,
          entries,
          yourRank: fullRank.rank > limit ? { ...fullRank, outsideTop: true } : fullRank,
          totalParticipants: full.length,
          tests,
          meta: { ...meta, periodAttempts: filtered.length },
        });
      }
    }

    return NextResponse.json({
      success: true,
      scope,
      period,
      testId: testId || null,
      testName: testId ? testNameById[testId] : null,
      entries,
      yourRank,
      totalParticipants:
        scope === 'test'
          ? new Set(filtered.map((a) => a.user_email)).size
          : entries.length,
      tests,
      meta: { ...meta, periodAttempts: filtered.length },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
