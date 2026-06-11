import { createClient } from '@supabase/supabase-js';
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
  computeStreakStats,
} from '@/lib/activityHeatmap';
import {
  buildRecentPractice,
  buildRecentMockAttempts,
  buildRecentAllActivity,
} from '@/lib/dashboardActivity';
import {
  buildOverallLeaderboard,
  findUserRank,
  filterAttemptsByPeriod,
} from '@/lib/mockTestLeaderboard';
import { fetchLeaderboardData } from '@/lib/mockTestLeaderboardFetch';
import { formatExamSlug } from '@/lib/platformExams';
import { listUserPurchasedRoadmaps } from '@/lib/roadmaps/roadmapService';
import { getOrSetCached } from '@/lib/cache/serverTtlCache';

const LEADERBOARD_CACHE_TTL_MS = 90 * 1000;
const MAX_LEADERBOARD_EXAMS = 6;
const PROGRESS_ROW_LIMIT = 500;
const MOCK_ATTEMPT_LIMIT = 120;

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

/** Single user_progress query reused across dashboard sections */
async function fetchUserProgressRows(progressUserId) {
  const supabase = practiceSupabase();
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      'area, topic, completedquestions, correctanswers, points, updated_at, created_at'
    )
    .or(`user_id.eq.${progressUserId},email.eq.${progressUserId}`)
    .not('area', 'is', null)
    .limit(PROGRESS_ROW_LIMIT);

  if (error) {
    if (error.code === 'PGRST204' || error.code === '42703') {
      const fallback = await supabase
        .from('user_progress')
        .select('area, topic, completedquestions, correctanswers, points')
        .or(`user_id.eq.${progressUserId},email.eq.${progressUserId}`)
        .not('area', 'is', null)
        .limit(PROGRESS_ROW_LIMIT);
      return fallback.data || [];
    }
    throw error;
  }
  return data || [];
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
    .limit(MOCK_ATTEMPT_LIMIT);

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

const EMPTY_LEADERBOARD = { entries: [], yourRank: null, examCategory: null };

async function fetchLeaderboardShared(examSlug) {
  const supabase = getSupabaseServer(isValidServiceRoleKey());
  const { testIds, attempts } = await fetchLeaderboardData(supabase, examSlug, {
    scope: 'overall',
  });
  const filtered = filterAttemptsByPeriod(attempts, 'all');
  const emails = [...new Set(filtered.map((a) => a.user_email).filter(Boolean))];

  let profilesMap = {};
  if (emails.length) {
    const topEmails = emails.slice(0, 50);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_email, display_name, avatar_url')
      .in('user_email', topEmails);
    profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_email, p]));
  }

  const entries = buildOverallLeaderboard(filtered, testIds, profilesMap, 10);

  return {
    entries: entries.slice(0, 10),
    examCategory: examSlug,
    totalParticipants: filtered.length,
    filtered,
    testIds,
    profilesMap,
  };
}

async function resolveYourRank(userEmail, shared) {
  if (!userEmail) return null;

  let yourRank = findUserRank(shared.entries, userEmail);
  if (yourRank) return yourRank;

  const full = buildOverallLeaderboard(
    shared.filtered,
    shared.testIds,
    shared.profilesMap,
    5000
  );
  const fullRank = findUserRank(full, userEmail);
  if (!fullRank) return null;
  return fullRank.rank > 10 ? { ...fullRank, outsideTop: true } : fullRank;
}

async function fetchLeaderboardSnippetCached(userEmail, examSlug) {
  if (!examSlug) return { ...EMPTY_LEADERBOARD };

  try {
    const shared = await getOrSetCached(`lb:${examSlug}`, LEADERBOARD_CACHE_TTL_MS, () =>
      fetchLeaderboardShared(examSlug)
    );
    const yourRank = await resolveYourRank(userEmail, shared);

    return {
      entries: shared.entries,
      yourRank,
      examCategory: examSlug,
      totalParticipants: shared.totalParticipants,
    };
  } catch (e) {
    console.error('dashboard leaderboard', examSlug, e);
    return { ...EMPTY_LEADERBOARD, examCategory: examSlug };
  }
}

export async function getLeaderboardForExam(userEmail, examSlug) {
  return fetchLeaderboardSnippetCached(userEmail, examSlug);
}

function buildProfilePayload(profile) {
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

  return {
    primarySlug,
    targetExams,
    examsPreparing,
    profilePayload: profile
      ? {
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url || null,
          bio: profile.bio || null,
          city: profile.city || null,
          state: profile.state || null,
          country: profile.country || null,
          target_exam: primarySlug,
          target_exams: targetExams,
        }
      : null,
    primaryExam: primarySlug
      ? { slug: primarySlug, name: formatExamSlug(primarySlug) }
      : null,
  };
}

function buildActivityFromRows(progressRows, mockTests, heatmapRange) {
  const activityEvents = mergeActivityEvents(
    datesFromMockAttempts(mockTests.allAttempts),
    datesFromPracticeRows(progressRows)
  );
  const heatmap = buildHeatmapGrid(activityEvents, heatmapRange);
  const streak = computeStreakStats(activityEvents);
  const recentPractice = buildRecentPractice(progressRows);
  const recentMock = buildRecentMockAttempts(mockTests.attempts);
  const recentAll = buildRecentAllActivity(recentPractice, recentMock);

  return {
    mockTests,
    activityEvents,
    heatmap: { range: heatmapRange, ...heatmap },
    streak,
    recentActivity: {
      practice: recentPractice,
      mock: recentMock,
      all: recentAll,
    },
  };
}

function settledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function getHeatmapForUser({ userEmail, userId, heatmapRange = '12mo' }) {
  const range = heatmapRange === '90d' ? '90d' : '12mo';
  const progressUserId = getProgressUserId({ email: userEmail, id: userId });

  const [progressRows, mockTests] = await Promise.all([
    fetchUserProgressRows(progressUserId),
    fetchMockTestSummary(userEmail),
  ]);

  const activityEvents = mergeActivityEvents(
    datesFromMockAttempts(mockTests.allAttempts),
    datesFromPracticeRows(progressRows)
  );

  return {
    heatmap: { range, ...buildHeatmapGrid(activityEvents, range) },
    streak: computeStreakStats(activityEvents),
    activityEvents,
  };
}

export async function getDashboardForUser({ userEmail, userId, heatmapRange = '12mo' }) {
  const range = heatmapRange === '90d' ? '90d' : '12mo';
  const progressUserId = getProgressUserId({ email: userEmail, id: userId });
  const profileClient = getSupabaseServer(isValidServiceRoleKey());
  const errors = [];

  let profile = null;
  try {
    ({ profile } = await selectProfile(profileClient, userEmail));
  } catch (e) {
    console.error('dashboard profile', e);
    errors.push('profile');
  }

  const { primarySlug, examsPreparing, profilePayload, primaryExam } =
    buildProfilePayload(profile);

  const [progressResult, mockResult, walletResult, leaderboardResult, roadmapsResult] =
    await Promise.allSettled([
      fetchUserProgressRows(progressUserId),
      fetchMockTestSummary(userEmail),
      getWalletSummary(userEmail),
      primarySlug
        ? fetchLeaderboardSnippetCached(userEmail, primarySlug)
        : Promise.resolve({ ...EMPTY_LEADERBOARD }),
      listUserPurchasedRoadmaps(userEmail),
    ]);

  if (progressResult.status === 'rejected') {
    console.error('dashboard progress', progressResult.reason);
    errors.push('practice');
  }
  if (mockResult.status === 'rejected') {
    console.error('dashboard mocks', mockResult.reason);
    errors.push('mocks');
  }
  if (walletResult.status === 'rejected') {
    console.error('dashboard wallet', walletResult.reason);
    errors.push('wallet');
  }
  if (leaderboardResult.status === 'rejected') {
    console.error('dashboard leaderboard', leaderboardResult.reason);
    errors.push('leaderboard');
  }
  if (roadmapsResult.status === 'rejected') {
    console.error('dashboard roadmaps', roadmapsResult.reason);
    errors.push('roadmaps');
  }

  const progressRows = settledValue(progressResult, []);
  const mockTests = settledValue(mockResult, { attempts: [], stats: null, allAttempts: [] });
  const wallet = settledValue(walletResult, null);
  const primaryLeaderboard = settledValue(leaderboardResult, { ...EMPTY_LEADERBOARD });
  const myRoadmaps = settledValue(roadmapsResult, []);

  let practice = aggregatePractice(progressRows);
  practice = sortPracticeByPrimary(practice, primarySlug);

  const activity = buildActivityFromRows(progressRows, mockTests, range);

  const practiceTotals = practice.reduce(
    (acc, exam) => ({
      questions: acc.questions + exam.totalCompleted,
      correct: acc.correct + exam.totalCorrect,
      points: acc.points + exam.totalPoints,
      topics: acc.topics + exam.topicsCount,
    }),
    { questions: 0, correct: 0, points: 0, topics: 0 }
  );

  const leaderboards = primarySlug ? { [primarySlug]: primaryLeaderboard } : {};

  return {
    profile: profilePayload,
    examsPreparing: examsPreparing.slice(0, MAX_LEADERBOARD_EXAMS),
    primaryExam,
    practice,
    mockTests: {
      attempts: activity.mockTests.attempts,
      stats: activity.mockTests.stats,
    },
    wallet,
    heatmap: activity.heatmap,
    streak: activity.streak,
    activityEvents: activity.activityEvents,
    recentActivity: activity.recentActivity,
    leaderboard: primaryLeaderboard,
    leaderboards,
    myRoadmaps,
    partialErrors: errors,
    summary: {
      practiceExams: practice.length,
      practiceQuestions: practiceTotals.questions,
      practiceAccuracy:
        practiceTotals.questions > 0
          ? Math.round((practiceTotals.correct / practiceTotals.questions) * 100)
          : 0,
      practicePoints: practiceTotals.points,
      topicsPracticed: practiceTotals.topics,
      mockTestsCompleted: activity.mockTests.stats?.completedCount ?? 0,
      mockTestsInProgress: activity.mockTests.stats?.inProgressCount ?? 0,
      mockAverageScore: activity.mockTests.stats?.averageScore ?? 0,
    },
  };
}
