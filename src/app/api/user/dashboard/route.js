import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getProgressUserId } from '@/lib/progressIdentity';
import { getWalletSummary } from '@/lib/credits/walletService';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { selectProfile } from '@/lib/userProfileDb';
import { parseTargetExams, sortPracticeByPrimary } from '@/lib/examProfile';
import {
  buildHeatmapGrid,
  datesFromMockAttempts,
  datesFromPracticeRows,
  mergeActivityEvents,
} from '@/lib/activityHeatmap';
import {
  buildOverallLeaderboard,
  findUserRank,
  filterAttemptsByPeriod,
} from '@/lib/mockTestLeaderboard';
import { fetchLeaderboardData } from '@/lib/mockTestLeaderboardFetch';
import { formatExamSlug } from '@/lib/platformExams';

function practiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function aggregatePractice(rows) {
  const progressByArea = {};

  (rows || []).forEach((item) => {
    const area = item.area?.toLowerCase();
    if (!area) return;

    if (!progressByArea[area]) {
      progressByArea[area] = {
        area,
        topics: {},
        totalCompleted: 0,
        totalCorrect: 0,
        totalPoints: 0,
        topicsCount: 0,
      };
    }

    const completedCount = Array.isArray(item.completedquestions)
      ? item.completedquestions.length
      : 0;
    const correctCount = Array.isArray(item.correctanswers)
      ? item.correctanswers.length
      : 0;
    const points = item.points || 0;

    progressByArea[area].topics[item.topic] = {
      topic: item.topic,
      completedQuestions: completedCount,
      correctAnswers: correctCount,
      points,
      accuracy:
        completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0,
    };

    progressByArea[area].totalCompleted += completedCount;
    progressByArea[area].totalCorrect += correctCount;
    progressByArea[area].totalPoints += points;
    progressByArea[area].topicsCount += 1;
  });

  return Object.values(progressByArea).map((areaData) => ({
    ...areaData,
    topics: Object.values(areaData.topics).sort(
      (a, b) => b.completedQuestions - a.completedQuestions
    ),
    overallAccuracy:
      areaData.totalCompleted > 0
        ? Math.round((areaData.totalCorrect / areaData.totalCompleted) * 100)
        : 0,
  }));
}

async function fetchMockTestSummary(userEmail) {
  const supabase = getSupabaseServer(isValidServiceRoleKey());

  const { data: attempts, error } = await supabase
    .from('user_test_attempts')
    .select(
      'id, test_id, examcategory, is_completed, status, score, percentage, total_questions, correct_answers, started_at, submitted_at, created_at'
    )
    .eq('user_email', userEmail)
    .order('started_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('dashboard mock attempts', error);
    return { attempts: [], stats: null, allAttempts: [] };
  }

  const rows = attempts || [];
  const testIds = [...new Set(rows.map((a) => a.test_id).filter(Boolean))];
  let testNames = {};

  if (testIds.length) {
    const { data: tests } = await supabase
      .from('mock_tests')
      .select('id, name, category, total_questions')
      .in('id', testIds);
    testNames = (tests || []).reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});
  }

  const completed = rows.filter((a) => a.is_completed);
  const inProgress = rows.filter((a) => !a.is_completed && a.status === 'in_progress');
  const scores = completed
    .map((a) => (typeof a.percentage === 'number' ? a.percentage : null))
    .filter((n) => n != null);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
      : 0;

  const byCategory = {};
  completed.forEach((a) => {
    const cat = (a.examcategory || 'unknown').toLowerCase();
    if (!byCategory[cat]) {
      byCategory[cat] = { category: cat, completed: 0, inProgress: 0, bestScore: 0 };
    }
    byCategory[cat].completed += 1;
    const pct = a.percentage ?? 0;
    if (pct > byCategory[cat].bestScore) byCategory[cat].bestScore = Math.round(pct);
  });

  inProgress.forEach((a) => {
    const cat = (a.examcategory || 'unknown').toLowerCase();
    if (!byCategory[cat]) {
      byCategory[cat] = { category: cat, completed: 0, inProgress: 0, bestScore: 0 };
    }
    byCategory[cat].inProgress += 1;
  });

  return {
    attempts: rows.slice(0, 30).map((a) => ({
      id: a.id,
      testId: a.test_id,
      testName: testNames[a.test_id]?.name || 'Mock Test',
      category: a.examcategory || testNames[a.test_id]?.category,
      isCompleted: a.is_completed,
      status: a.status,
      score: a.score,
      percentage: a.percentage,
      totalQuestions: a.total_questions,
      correctAnswers: a.correct_answers,
      startedAt: a.started_at,
      completedAt: a.submitted_at || a.created_at || null,
    })),
    allAttempts: rows,
    stats: {
      totalAttempts: rows.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      averageScore: avgScore,
      byCategory: Object.values(byCategory),
    },
  };
}

async function fetchPracticeActivityRows(progressUserId) {
  const supabase = practiceSupabase();
  const { data, error } = await supabase
    .from('user_progress')
    .select('area, topic, updated_at, created_at')
    .or(`user_id.eq.${progressUserId},email.eq.${progressUserId}`)
    .not('area', 'is', null)
    .limit(500);

  if (error) {
    if (error.code === 'PGRST204' || error.code === '42703') {
      const fallback = await supabase
        .from('user_progress')
        .select('area, topic')
        .or(`user_id.eq.${progressUserId},email.eq.${progressUserId}`)
        .not('area', 'is', null)
        .limit(500);
      return fallback.data || [];
    }
    return [];
  }
  return data || [];
}

async function fetchLeaderboardSnippet(userEmail, primarySlug) {
  if (!primarySlug) return { entries: [], yourRank: null, examCategory: null };

  try {
    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { testIds, attempts } = await fetchLeaderboardData(supabase, primarySlug, {
      scope: 'overall',
    });
    const filtered = filterAttemptsByPeriod(attempts, 'all');
    const emails = [...new Set(filtered.map((a) => a.user_email).filter(Boolean))];

    let profilesMap = {};
    if (emails.length) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_email, display_name, avatar_url')
        .in('user_email', emails);
      profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_email, p]));
    }

    const entries = buildOverallLeaderboard(filtered, testIds, profilesMap, 10);
    let yourRank = findUserRank(entries, userEmail);

    if (!yourRank) {
      const full = buildOverallLeaderboard(filtered, testIds, profilesMap, 5000);
      const fullRank = findUserRank(full, userEmail);
      if (fullRank) {
        yourRank = fullRank.rank > 10 ? { ...fullRank, outsideTop: true } : fullRank;
      }
    }

    return {
      entries: entries.slice(0, 10),
      yourRank,
      examCategory: primarySlug,
      totalParticipants: filtered.length,
    };
  } catch (e) {
    console.error('dashboard leaderboard', e);
    return { entries: [], yourRank: null, examCategory: primarySlug };
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    const userEmail = normalizeEmail(session?.user?.email);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const heatmapRange = searchParams.get('heatmapRange') === '12mo' ? '12mo' : '90d';

    const progressUserId = getProgressUserId({ email: userEmail, id: session.user?.id });
    const profileClient = getSupabaseServer(isValidServiceRoleKey());
    const { profile } = await selectProfile(profileClient, userEmail);

    const primarySlug = String(profile?.target_exam || '').trim().toLowerCase();
    const targetExams = parseTargetExams(profile?.target_exams);
    const examsPreparing = targetExams.length
      ? targetExams.map((slug) => ({
          slug,
          name: formatExamSlug(slug),
          isPrimary: slug === primarySlug,
        }))
      : primarySlug
        ? [{ slug: primarySlug, name: formatExamSlug(primarySlug), isPrimary: true }]
        : [];

    const supabase = practiceSupabase();
    const { data: practiceRows, error: practiceError } = await supabase
      .from('user_progress')
      .select('area, topic, completedquestions, correctanswers, points')
      .or(`user_id.eq.${progressUserId},email.eq.${progressUserId}`)
      .not('area', 'is', null);

    if (practiceError) throw practiceError;

    let practice = aggregatePractice(practiceRows);
    practice = sortPracticeByPrimary(practice, primarySlug);

    const mockTests = await fetchMockTestSummary(userEmail);
    const wallet = await getWalletSummary(userEmail);
    const activityRows = await fetchPracticeActivityRows(progressUserId);
    const activityEvents = mergeActivityEvents(
      datesFromMockAttempts(mockTests.allAttempts),
      datesFromPracticeRows(activityRows)
    );
    const heatmap = buildHeatmapGrid(activityEvents, heatmapRange);
    const leaderboard = await fetchLeaderboardSnippet(userEmail, primarySlug);

    const practiceTotals = practice.reduce(
      (acc, exam) => ({
        questions: acc.questions + exam.totalCompleted,
        correct: acc.correct + exam.totalCorrect,
        points: acc.points + exam.totalPoints,
        topics: acc.topics + exam.topicsCount,
      }),
      { questions: 0, correct: 0, points: 0, topics: 0 }
    );

    return NextResponse.json({
      success: true,
      profile: profile
        ? {
            displayName: profile.display_name,
            target_exam: primarySlug,
            target_exams: targetExams,
          }
        : null,
      examsPreparing,
      primaryExam: primarySlug
        ? { slug: primarySlug, name: formatExamSlug(primarySlug) }
        : null,
      practice,
      mockTests: {
        attempts: mockTests.attempts,
        stats: mockTests.stats,
      },
      wallet,
      heatmap: { range: heatmapRange, ...heatmap },
      leaderboard,
      summary: {
        practiceExams: practice.length,
        practiceQuestions: practiceTotals.questions,
        practiceAccuracy:
          practiceTotals.questions > 0
            ? Math.round((practiceTotals.correct / practiceTotals.questions) * 100)
            : 0,
        practicePoints: practiceTotals.points,
        mockTestsCompleted: mockTests.stats?.completedCount ?? 0,
        mockTestsInProgress: mockTests.stats?.inProgressCount ?? 0,
        mockAverageScore: mockTests.stats?.averageScore ?? 0,
      },
    });
  } catch (err) {
    console.error('user/dashboard', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
