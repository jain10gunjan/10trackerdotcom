import {
  fetchUserProgressRowsForDashboard,
  resolveExamHubContinue,
} from '@/features/exam-hub/lib/examHubProgress';
import { getWalletSummary } from '@/features/credits/lib/walletService';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { selectProfile } from '@/lib/userProfileDb';
import {
  parseTargetExams,
  sortPracticeByPrimary,
  isValidExamSlug,
  practiceAreaMatchesSlug,
} from '@/lib/examProfile';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
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
  resolveContinueOptions,
  rowProgressStats,
} from '@/lib/dashboardActivity';
import {
  buildOverallLeaderboard,
  findUserRank,
  filterAttemptsByPeriod,
} from '@/features/mock-test/lib/mockTestLeaderboard';
import { fetchLeaderboardData } from '@/features/mock-test/lib/mockTestLeaderboardFetch';
import { formatExamSlug, mockTestHrefForSlug, practiceHrefForSlug } from '@/lib/platformExams';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import { resolveChapterPracticeHref } from '@/features/exam-hub/lib/examHubUtils';
import { listUserRoadmapSummaries } from '@/features/roadmaps/lib/roadmapService';
import { getOrSetCached } from '@/lib/cache/serverTtlCache';
import { fetchActiveMockTests } from '@/features/mock-test/lib/mockTestUtils';
import { fetchArticlesList } from '@/features/articles/lib/fetchCategoryArticles';
import { fetchActiveExamCatalog } from '@/features/exams/lib/fetchActiveExamCatalog';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  resolveMockOfTheDay,
  isMotdCreationMode,
} from '@/features/mock-test/lib/mockOfTheDay';
import { isTopicWiseCreationMode } from '@/features/mock-test/lib/topicWiseTest';
import { fetchExamCatalogStats } from '@/features/exam-hub/lib/fetchExamCatalogStats';

const LEADERBOARD_CACHE_TTL_MS = 90 * 1000;
const MAX_LEADERBOARD_EXAMS = 6;
const MOCK_ATTEMPT_LIMIT = 40;
const MOCK_ATTEMPT_RECENT_LIMIT = 20;
const PROGRESS_ROW_LIMIT = 60;

function mockCategoryVariants(examSlug) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return [];
  const variants = new Set([slug]);
  for (const v of getCategoryVariants(slug) || []) {
    if (v) variants.add(String(v).trim());
    const n = normalizeCategorySlug(v);
    if (n) variants.add(n);
  }
  return [...variants].filter(Boolean);
}

function filterMockAttemptsByExam(attempts, examSlug) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return attempts || [];
  return (attempts || []).filter((a) =>
    practiceAreaMatchesSlug(a.category || a.examcategory, slug)
  );
}

function aggregatePractice(rows) {
  const progressByArea = {};

  (rows || []).forEach((item) => {
    const area = normalizeCategorySlug(item.area);
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

    const { completedQuestions: completedCount, correctAnswers: correctCount } =
      rowProgressStats(item);
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

/** Delegates to shared exam-hub progress fetch (service role; exam-scoped on home). */
async function fetchUserProgressRows(user, examSlug = '') {
  return fetchUserProgressRowsForDashboard(user, {
    examSlug,
    limit: PROGRESS_ROW_LIMIT,
    serviceOnly: true,
  });
}

async function fetchMockTestSummary(userEmail, examSlug = '') {
  const supabase = getSupabaseServer(isValidServiceRoleKey());
  const categoryVariants = mockCategoryVariants(examSlug);

  let query = supabase
    .from('user_test_attempts')
    .select(
      'id, test_id, examcategory, is_completed, status, score, percentage, total_questions, correct_answers, started_at, submitted_at, created_at'
    )
    .eq('user_email', userEmail)
    .order('started_at', { ascending: false })
    .limit(MOCK_ATTEMPT_LIMIT);

  if (categoryVariants.length) {
    query = query.in('examcategory', categoryVariants);
  }

  const { data: attempts, error } = await query;

  if (error) {
    console.error('dashboard mock attempts', error);
    return { attempts: [], stats: null, allAttempts: [] };
  }

  let rows = attempts || [];
  // Safety net if DB category spellings differ from variants.
  if (examSlug && rows.length) {
    rows = filterMockAttemptsByExam(rows, examSlug);
  }

  const recentRows = rows.slice(0, MOCK_ATTEMPT_RECENT_LIMIT);
  const testIds = [...new Set(recentRows.map((a) => a.test_id).filter(Boolean))];
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

  return {
    attempts: rows.slice(0, 20).map((a) => ({
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
      byCategory: [],
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

function buildProfilePayload(profile, activeCatalog = null) {
  const targetExams = parseTargetExams(profile?.target_exams);
  let primarySlug = String(profile?.target_exam || '').trim().toLowerCase();
  if (!primarySlug && targetExams.length) {
    primarySlug = targetExams[0];
  }

  const catalogBySlug =
    Array.isArray(activeCatalog) && activeCatalog.length
      ? new Map(
          activeCatalog.map((e) => [String(e.slug || '').trim().toLowerCase(), e])
        )
      : null;

  // Homepage switcher: only exams the user selected that are still active.
  const preparingSlugs = catalogBySlug
    ? targetExams.filter((slug) => catalogBySlug.has(slug))
    : targetExams;

  if (primarySlug && catalogBySlug && !catalogBySlug.has(primarySlug)) {
    primarySlug = preparingSlugs[0] || '';
  } else if (primarySlug && preparingSlugs.length && !preparingSlugs.includes(primarySlug)) {
    primarySlug = preparingSlugs[0] || primarySlug;
  }

  const examsPreparing = preparingSlugs.length
    ? preparingSlugs.map((slug) => ({
        slug,
        name: catalogBySlug?.get(slug)?.name || formatExamSlug(slug),
        isPrimary: slug === primarySlug,
      }))
    : primarySlug
      ? [
          {
            slug: primarySlug,
            name: catalogBySlug?.get(primarySlug)?.name || formatExamSlug(primarySlug),
            isPrimary: true,
          },
        ]
      : [];

  return {
    primarySlug,
    targetExams: preparingSlugs.length ? preparingSlugs : targetExams,
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
          target_exams: preparingSlugs.length ? preparingSlugs : targetExams,
        }
      : null,
    primaryExam: primarySlug
      ? {
          slug: primarySlug,
          name: catalogBySlug?.get(primarySlug)?.name || formatExamSlug(primarySlug),
        }
      : null,
  };
}

function enrichPracticeWithChapterHrefs(practice, catalogsByArea = {}) {
  return (practice || []).map((exam) => {
    const catalog = catalogsByArea[exam.area] || [];
    const area = String(exam.area || '').trim().toLowerCase();
    return {
      ...exam,
      topics: (exam.topics || []).map((topic) => {
        const topicName = topic.topic;
        // Prefer chapter route when catalog is available; else topic practice (no full scan).
        const href =
          catalog.length > 0
            ? resolveChapterPracticeHref(area, topicName, catalog)
            : area && topicName
              ? `/${area}/practice/${encodeURIComponent(topicName)}`
              : area
                ? `/${area}`
                : '/exams';
        return { ...topic, href };
      }),
    };
  });
}

function buildActivityFromRows(progressRows, mockTests, heatmapRange, catalogsByArea = {}) {
  const activityEvents = mergeActivityEvents(
    datesFromMockAttempts(mockTests.allAttempts),
    datesFromPracticeRows(progressRows)
  );
  const heatmapsByRange = {
    '90d': { range: '90d', ...buildHeatmapGrid(activityEvents, '90d') },
    '12mo': { range: '12mo', ...buildHeatmapGrid(activityEvents, '12mo') },
  };
  const range = heatmapRange === '90d' ? '90d' : '12mo';
  const streak = computeStreakStats(activityEvents);
  const recentPractice = buildRecentPractice(progressRows, 15, catalogsByArea);
  const recentMock = buildRecentMockAttempts(mockTests.attempts);
  const recentAll = buildRecentAllActivity(recentPractice, recentMock);

  return {
    mockTests,
    heatmap: heatmapsByRange[range],
    heatmapsByRange,
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
  const progressUser = { email: userEmail, authId: userId };

  const [progressRows, mockTests] = await Promise.all([
    fetchUserProgressRows(progressUser),
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

function mapMockCard(test, examSlug) {
  return {
    id: test.id,
    name: test.name,
    description: test.description || '',
    duration: test.duration,
    totalQuestions: test.total_questions,
    difficulty: test.difficulty,
    creationMode: test.creation_mode || 'full',
    href: `/mock-test/${examSlug}/attempt/${test.id}`,
  };
}

function computeExamCountdown(row) {
  if (!row || row.exam_date_visible === false) {
    return { visible: false, status: 'hidden' };
  }

  const examDate = row.exam_date || null;
  const label = row.exam_date_label || null;
  if (!examDate) {
    return {
      visible: true,
      status: 'unset',
      examDate: null,
      label,
      daysLeft: null,
    };
  }

  const [y, m, d] = String(examDate).split('-').map(Number);
  if (!y || !m || !d) {
    return { visible: true, status: 'unset', examDate: null, label, daysLeft: null };
  }

  const exam = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((exam.getTime() - today.getTime()) / 86400000);
  const status = daysLeft > 0 ? 'upcoming' : daysLeft === 0 ? 'today' : 'past';

  return {
    visible: true,
    status,
    examDate,
    label,
    daysLeft,
  };
}

function mapFeedUpdate(article) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || '',
    category: article.category || '',
    createdAt: article.created_at,
    href: `/articles/${article.slug}`,
    isFeatured: Boolean(article.is_featured),
  };
}

/** Category matches first, then title/excerpt search. Duplicates dropped. */
function mergeFeedUpdates(groups, limit = 5) {
  const seen = new Set();
  const updates = [];
  for (const group of groups) {
    for (const article of group || []) {
      const key = article?.slug || article?.id;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      updates.push(mapFeedUpdate(article));
      if (updates.length >= limit) return updates;
    }
  }
  return updates;
}

const EXAM_HOME_FEED_TTL_MS = 60 * 1000;

async function buildExamHomeFeedUncached(slug) {
  const examName = formatExamSlug(slug);
  const practiceHref = practiceHrefForSlug(slug);
  const mockHref = mockTestHrefForSlug(slug);
  const dailyHref = `/${slug}/daily-practice`;

  const feed = {
    exam: { slug, name: examName },
    links: { practiceHref, mockHref, dailyHref },
    countdown: { visible: false, status: 'hidden' },
    catalogStats: {
      questionCount: 0,
      mockCount: 0,
      topicCount: 0,
      chapterCount: 0,
      subjectCount: 0,
    },
    mockOfTheDay: {
      status: 'coming_soon',
      title: 'Mock of the day',
      description:
        'A fresh daily mock curated for your exam — launching soon. Stay tuned.',
    },
    updates: [],
    updatesHref: `/article/${slug}`,
    fullMocks: [],
    topicMocks: [],
    topicMocksStatus: 'ready',
    fullMocksStatus: 'ready',
  };

  const supabase = getSupabaseAdmin();
  const [motdStatsSettled, countdownSettled, mocksSettled] = await Promise.allSettled([
    Promise.all([
      resolveMockOfTheDay(slug),
      fetchExamCatalogStats(slug, { includeSyllabusMeta: false }),
    ]),
    supabase
      .from('platform_exams')
      .select('slug, name, exam_date, exam_date_label, exam_date_visible')
      .eq('slug', slug)
      .maybeSingle(),
    fetchActiveMockTests(supabase, slug),
  ]);

  if (motdStatsSettled.status === 'fulfilled') {
    const [motd, catalogStats] = motdStatsSettled.value;
    feed.mockOfTheDay = motd;
    if (catalogStats) feed.catalogStats = catalogStats;
  } else {
    console.error('exam home feed motd/stats', slug, motdStatsSettled.reason);
  }

  if (countdownSettled.status === 'fulfilled') {
    const { data: examRow, error: examErr } = countdownSettled.value;
    if (
      examErr &&
      (examErr.code === 'PGRST204' || /exam_date/i.test(examErr.message || ''))
    ) {
      feed.countdown = { visible: false, status: 'hidden' };
    } else if (!examErr && examRow) {
      if (examRow.name) feed.exam.name = examRow.name;
      feed.countdown = computeExamCountdown(examRow);
    }
  } else {
    console.error('exam home feed countdown', slug, countdownSettled.reason);
  }

  if (mocksSettled.status === 'fulfilled') {
    const rows = mocksSettled.value?.data || [];
    const motdId = feed.mockOfTheDay?.mock?.id;
    const topicRows = rows.filter((t) =>
      isTopicWiseCreationMode(t.creation_mode, t.description, t.name)
    );
    const fullRows = rows.filter((t) => {
      if (isTopicWiseCreationMode(t.creation_mode, t.description, t.name)) return false;
      if (isMotdCreationMode(t.creation_mode, t.description, t.name)) return false;
      if (motdId && t.id === motdId) return false;
      return true;
    });
    feed.fullMocks = fullRows.slice(0, 4).map((t) => mapMockCard(t, slug));
    feed.topicMocks = topicRows.slice(0, 4).map((t) => mapMockCard(t, slug));
    feed.fullMocksStatus = feed.fullMocks.length ? 'ready' : 'coming_soon';
    feed.topicMocksStatus = feed.topicMocks.length ? 'ready' : 'coming_soon';
  } else {
    console.error('exam home feed mocks', slug, mocksSettled.reason);
    feed.fullMocksStatus = 'coming_soon';
    feed.topicMocksStatus = 'coming_soon';
  }

  try {
    // Category-only — skip search query to cut egress/latency on home.
    const categoryResult = await fetchArticlesList({
      page: 1,
      pageSize: 4,
      category: slug,
    }).catch((err) => {
      console.error('exam home feed category updates', slug, err);
      return { articles: [] };
    });
    const categoryArticles = categoryResult.articles || [];
    feed.updates = mergeFeedUpdates([categoryArticles]);
    feed.updatesHref = `/article/${slug}`;
  } catch (e) {
    console.error('exam home feed updates', slug, e);
    feed.updates = [];
  }

  return feed;
}

/**
 * Personalized home feed for one exam (mocks, updates, placeholders).
 * Short TTL cache — shared across dashboard requests for the same exam.
 */
export async function buildExamHomeFeed(examSlug) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug || !isValidExamSlug(slug)) {
    return null;
  }

  return getOrSetCached(`exam-home-feed:v2:${slug}`, EXAM_HOME_FEED_TTL_MS, () =>
    buildExamHomeFeedUncached(slug)
  );
}

export async function getDashboardForUser({
  userEmail,
  userId,
  heatmapRange = '12mo',
  focusExam = '',
}) {
  const range = heatmapRange === '90d' ? '90d' : '12mo';
  const progressUser = { email: userEmail, authId: userId };
  const profileClient = getSupabaseServer(isValidServiceRoleKey());
  const errors = [];
  const earlyFocus = normalizeCategorySlug(focusExam);

  // Wave 1: profile + catalog + wallet (+ feed prefetch for URL exam).
  const earlyFeedPromise = earlyFocus
    ? buildExamHomeFeed(earlyFocus).catch((err) => {
        console.error('dashboard early feed', earlyFocus, err);
        return null;
      })
    : null;

  const earlyProgressPromise = earlyFocus
    ? fetchUserProgressRows(progressUser, earlyFocus)
    : null;
  const earlyMocksPromise = earlyFocus
    ? fetchMockTestSummary(userEmail, earlyFocus)
    : null;

  const [profileResult, walletResult, catalogResult] = await Promise.allSettled([
    selectProfile(profileClient, userEmail).then((r) => r.profile),
    getWalletSummary(userEmail),
    fetchActiveExamCatalog(),
  ]);

  let profile = null;
  if (profileResult.status === 'fulfilled') {
    profile = profileResult.value;
  } else {
    console.error('dashboard profile', profileResult.reason);
    errors.push('profile');
  }

  const activeCatalog =
    catalogResult.status === 'fulfilled' ? catalogResult.value || [] : [];
  if (catalogResult.status === 'rejected') {
    console.error('dashboard exam catalog', catalogResult.reason);
  }

  const { primarySlug, examsPreparing, profilePayload, primaryExam } =
    buildProfilePayload(profile, activeCatalog);

  const requestedFocus = normalizeCategorySlug(focusExam);
  const allowedSlugs = new Set(examsPreparing.map((e) => e.slug));
  // Prefer URL exam even if profile list is empty/stale (still show that exam's data).
  const focusSlug =
    (requestedFocus &&
      (allowedSlugs.size === 0 || allowedSlugs.has(requestedFocus)) &&
      requestedFocus) ||
    primarySlug ||
    examsPreparing[0]?.slug ||
    '';
  const focusedExam = focusSlug
    ? {
        slug: focusSlug,
        name:
          examsPreparing.find((e) => e.slug === focusSlug)?.name ||
          formatExamSlug(focusSlug),
      }
    : null;
  const effectivePrimarySlug = focusSlug || primarySlug || '';

  // Wave 2: exam-scoped user data only (never load every preparing exam).
  const reuseEarly = Boolean(earlyFocus && earlyFocus === effectivePrimarySlug);
  const [progressResult, mockResult, roadmapsResult, examFeedSettled] =
    await Promise.allSettled([
      reuseEarly && earlyProgressPromise
        ? earlyProgressPromise
        : effectivePrimarySlug
          ? fetchUserProgressRows(progressUser, effectivePrimarySlug)
          : Promise.resolve([]),
      reuseEarly && earlyMocksPromise
        ? earlyMocksPromise
        : effectivePrimarySlug
          ? fetchMockTestSummary(userEmail, effectivePrimarySlug)
          : Promise.resolve({ attempts: [], stats: null, allAttempts: [] }),
      SHOW_OG_TRACKERS
        ? listUserRoadmapSummaries(userEmail)
        : Promise.resolve([]),
      reuseEarly && earlyFeedPromise
        ? earlyFeedPromise
        : effectivePrimarySlug
          ? buildExamHomeFeed(effectivePrimarySlug)
          : Promise.resolve(null),
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
  if (roadmapsResult.status === 'rejected') {
    console.error('dashboard roadmaps', roadmapsResult.reason);
    errors.push('roadmaps');
  }

  let progressRows = settledValue(progressResult, []);
  if (effectivePrimarySlug) {
    progressRows = progressRows.filter((row) =>
      practiceAreaMatchesSlug(row.area, effectivePrimarySlug)
    );
  }

  const mockTests = settledValue(mockResult, {
    attempts: [],
    stats: null,
    allAttempts: [],
  });
  const wallet = settledValue(walletResult, null);
  let myRoadmaps = settledValue(roadmapsResult, []);
  if (SHOW_OG_TRACKERS && effectivePrimarySlug && myRoadmaps.length) {
    myRoadmaps = myRoadmaps.filter((r) => {
      const exam = normalizeCategorySlug(r.exam_slug || r.examSlug || r.exam || '');
      return !exam || exam === effectivePrimarySlug;
    });
  } else if (!SHOW_OG_TRACKERS) {
    myRoadmaps = [];
  }

  let practice = aggregatePractice(progressRows);
  practice = sortPracticeByPrimary(practice, effectivePrimarySlug).filter((exam) =>
    effectivePrimarySlug
      ? practiceAreaMatchesSlug(exam.area, effectivePrimarySlug)
      : true
  );

  const catalogsByArea = {};
  practice = enrichPracticeWithChapterHrefs(practice, catalogsByArea);

  const activity = buildActivityFromRows(progressRows, mockTests, range, catalogsByArea);

  let examHubPractice = null;
  if (effectivePrimarySlug) {
    try {
      examHubPractice = resolveExamHubContinue(
        progressRows,
        effectivePrimarySlug,
        []
      );
    } catch (e) {
      console.error('dashboard exam hub continue', e);
    }
  }

  const continueOptions = resolveContinueOptions({
    examHubPractice,
    recentPractice: activity.recentActivity.practice,
    mockAttempts: activity.mockTests.attempts,
    primaryExam:
      focusedExam ||
      primaryExam ||
      (effectivePrimarySlug
        ? { slug: effectivePrimarySlug, name: formatExamSlug(effectivePrimarySlug) }
        : null),
  });

  let examFeed = null;
  if (examFeedSettled.status === 'fulfilled') {
    examFeed = examFeedSettled.value;
  } else {
    console.error('dashboard exam feed', examFeedSettled.reason);
    errors.push('examFeed');
  }

  const focusPractice = practice[0] || null;
  const practiceTotals = {
    questions: focusPractice?.totalCompleted || 0,
    correct: focusPractice?.totalCorrect || 0,
    points: focusPractice?.totalPoints || 0,
    topics: focusPractice?.topicsCount || 0,
  };

  return {
    profile: profilePayload,
    examsPreparing: examsPreparing.slice(0, MAX_LEADERBOARD_EXAMS),
    primaryExam,
    focusedExam,
    examFeed,
    practice,
    continueSession: examHubPractice,
    continueOptions,
    mockTests: {
      attempts: activity.mockTests.attempts,
      stats: activity.mockTests.stats,
    },
    wallet,
    heatmap: activity.heatmap,
    heatmapsByRange: activity.heatmapsByRange,
    streak: activity.streak,
    recentActivity: activity.recentActivity,
    leaderboard: { ...EMPTY_LEADERBOARD },
    leaderboards: {},
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
