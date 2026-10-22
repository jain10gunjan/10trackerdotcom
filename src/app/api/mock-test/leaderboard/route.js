import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  buildPerTestLeaderboard,
  buildOverallLeaderboard,
  filterAttemptsByPeriod,
  findUserRank,
} from '@/features/mock-test/lib/mockTestLeaderboard';
import { fetchLeaderboardData } from '@/features/mock-test/lib/mockTestLeaderboardFetch';
import { mergeWithSyntheticRanks } from '@/features/mock-test/lib/syntheticLeaderboard';
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

    const realEntries =
      scope === 'test'
        ? buildPerTestLeaderboard(filtered, profilesMap, 5000)
        : buildOverallLeaderboard(filtered, testIds, profilesMap, 5000);

    const merged = mergeWithSyntheticRanks(realEntries, {
      scope,
      examCategory,
      testIds,
      testId,
      limit,
    });

    const found = userEmail ? findUserRank(merged.ranked, userEmail) : null;
    const yourRank = found && found.rank > limit ? { ...found, outsideTop: true } : found;

    return NextResponse.json({
      success: true,
      scope,
      period,
      testId: testId || null,
      testName: testId ? testNameById[testId] : null,
      entries: merged.entries,
      yourRank,
      totalParticipants: merged.totalParticipants,
      tests,
      meta: { ...meta, periodAttempts: filtered.length },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
