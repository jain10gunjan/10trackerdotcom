/**
 * Shared helpers for mock-test category matching, scoring, and duration display.
 */

export function parseAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const admins = parseAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(String(email).trim().toLowerCase());
}

/** URL slug → DB category variants (e.g. gate-cse → GATE-CSE, GATE_CSE) */
export function getCategoryVariants(examcategory) {
  if (!examcategory) return [];
  const raw = String(examcategory).trim();
  const upper = raw.toUpperCase();
  const hyphen = upper.replace(/_/g, '-');
  const underscore = upper.replace(/-/g, '_');
  const spaced = hyphen.replace(/-/g, ' ');
  return [...new Set([upper, hyphen, underscore, spaced, raw])].filter(Boolean);
}

const MOCK_TEST_LIST_COLUMNS =
  'id, name, description, duration, total_questions, difficulty, category, created_at';
const MOCK_TEST_LIST_COLUMNS_WITH_MODE = `${MOCK_TEST_LIST_COLUMNS}, creation_mode`;

/**
 * Load active mock tests for an exam category slug (handles schema drift + category aliases).
 */
export async function fetchActiveMockTests(supabase, examcategory) {
  const variants = getCategoryVariants(examcategory);

  const runQuery = (columns) =>
    supabase
      .from('mock_tests')
      .select(columns)
      .eq('is_active', true)
      .in('category', variants)
      .order('created_at', { ascending: false });

  let response = await runQuery(MOCK_TEST_LIST_COLUMNS_WITH_MODE);

  if (
    response.error &&
    (response.error.code === 'PGRST204' ||
      /creation_mode/i.test(response.error.message || ''))
  ) {
    response = await runQuery(MOCK_TEST_LIST_COLUMNS);
  }

  if (response.error) {
    return { data: [], error: response.error };
  }

  let rows = response.data || [];

  if (rows.length === 0) {
    const fallback = await supabase
      .from('mock_tests')
      .select(MOCK_TEST_LIST_COLUMNS)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!fallback.error && fallback.data?.length) {
      rows = fallback.data.filter((t) => categoryMatches(t.category, examcategory));
    } else if (fallback.error && !response.error) {
      return { data: [], error: fallback.error };
    }
  }

  return { data: rows, error: null };
}

export function categoryMatches(dbCategory, examcategory) {
  if (!dbCategory || !examcategory) return false;
  const variants = getCategoryVariants(examcategory);
  const normalized = String(dbCategory).trim().toUpperCase();
  return variants.some(
    (v) =>
      normalized === v.toUpperCase() ||
      normalized.replace(/-/g, '_') === v.toUpperCase().replace(/-/g, '_')
  );
}

export {
  normalizeAnswerOption,
  isAnswerCorrect,
  isInlineAnswerQuestion,
  hasPopulatedOptions,
  formatAcceptedAnswers,
} from '@/lib/questionAnswerMode';

/** GATE / GATE-CSE style: +1 correct, −⅓ wrong, 0 unattempted */
export function usesGateMarking(examcategory) {
  const slug = String(examcategory || '').toLowerCase().replace(/_/g, '-');
  return slug === 'gate' || slug.startsWith('gate-');
}

/** JEE Main style: +4 correct, −1 wrong (MCQ and NVQ), 0 unattempted */
export function usesJeeMainMarking(examcategory) {
  const slug = String(examcategory || '').toLowerCase().replace(/_/g, '-');
  return slug === 'jee-main' || slug === 'jee' || slug === 'jeemain';
}

export function computeGateNetMarks(correct, incorrect) {
  const c = Number(correct) || 0;
  const w = Number(incorrect) || 0;
  return Math.round((c - w / 3) * 100) / 100;
}

/**
 * GATE weighted marks (1m/2m). MCQ wrong = −marks/3; NAT/MSQ wrong = 0.
 * @param {Array<{ isCorrect?: boolean, marks?: number, isMcq?: boolean, questionId?: string }>} answers
 * @param {Record<string, number>} [questionMarks]
 */
export function computeGateWeightedNetMarks(answers = [], questionMarks = {}) {
  let net = 0;
  for (const a of answers) {
    const id = a?.questionId != null ? String(a.questionId) : '';
    const marks = Number(a?.marks ?? questionMarks[id] ?? 1) || 1;
    if (a?.isCorrect === true) {
      net += marks;
    } else if (a?.isCorrect === false && a?.isMcq !== false) {
      // isMcq false = NAT (no negative); unset = legacy MCQ-style −m/3
      net -= marks / 3;
    }
  }
  return Math.round(net * 100) / 100;
}

export function sumGateQuestionMarks(questionMarks = {}, fallbackTotal = 0) {
  const vals = Object.values(questionMarks || {}).map((n) => Number(n) || 0);
  if (!vals.length) return Math.max(0, Number(fallbackTotal) || 0);
  return vals.reduce((a, b) => a + b, 0);
}

export function computeJeeMainNetMarks(correct, incorrect) {
  const c = Number(correct) || 0;
  const w = Number(incorrect) || 0;
  return c * 4 - w * 1;
}

/**
 * Unified mock-test stats for submit UI and persistence.
 * @param {{ answerHistory: Array, totalQuestions: number, examcategory: string, markedForReview?: Array, timeData?: { totalTimeSpent?: number }, questionMarks?: Record<string, number>, maxMarksOverride?: number }} params
 */
export function calculateMockTestStats({
  answerHistory = [],
  totalQuestions = 0,
  examcategory = '',
  markedForReview = [],
  timeData = {},
  questionMarks = null,
  maxMarksOverride = null,
}) {
  const answers = Array.isArray(answerHistory) ? answerHistory : [];
  const marked = Array.isArray(markedForReview) ? markedForReview : [];
  const total = Math.max(0, Number(totalQuestions) || 0);
  const marksMap = questionMarks && typeof questionMarks === 'object' ? questionMarks : {};
  const hasWeightedGate =
    Object.keys(marksMap).length > 0 ||
    answers.some((a) => a?.marks === 1 || a?.marks === 2);

  const attempted = answers.length;
  const correct = answers.filter((a) => a?.isCorrect === true).length;
  const incorrect = answers.filter((a) => a?.isCorrect === false).length;
  const skipped = Math.max(0, total - attempted);
  const markedCount = marked.length;
  const gate = usesGateMarking(examcategory);
  const jee = !gate && usesJeeMainMarking(examcategory);

  let score;
  let percentage;
  let maxMarks = total;
  let netMarks = 0;

  if (gate) {
    if (hasWeightedGate) {
      maxMarks =
        maxMarksOverride != null
          ? Number(maxMarksOverride) || 100
          : sumGateQuestionMarks(marksMap, total);
      if (!maxMarks && answers.length) {
        maxMarks = answers.reduce(
          (s, a) => s + (Number(a?.marks) || 1),
          Math.max(0, total - answers.length)
        );
      }
      if (!maxMarks) maxMarks = 100;
      netMarks = computeGateWeightedNetMarks(answers, marksMap);
    } else {
      netMarks = computeGateNetMarks(correct, incorrect);
    }
    score = netMarks;
    percentage = maxMarks > 0 ? Math.round((netMarks / maxMarks) * 10000) / 100 : 0;
  } else if (jee) {
    maxMarks = total * 4;
    netMarks = computeJeeMainNetMarks(correct, incorrect);
    score = netMarks;
    percentage = maxMarks > 0 ? Math.round((netMarks / maxMarks) * 10000) / 100 : 0;
  } else {
    score = correct * 100;
    percentage = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
    netMarks = correct;
  }

  const attemptPercentage = total > 0 ? Math.round((attempted / total) * 10000) / 100 : 0;

  const subjectStats = {};
  answers.forEach((answer) => {
    if (!answer?.subject) return;
    const subject = answer.subject;
    if (!subjectStats[subject]) {
      subjectStats[subject] = {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        netMarks: 0,
      };
    }
    const s = subjectStats[subject];
    s.attempted++;
    if (answer.isCorrect) s.correct++;
    else s.incorrect++;
    s.totalTime += Number(answer.timeSpent) || 0;
    if (gate) {
      if (hasWeightedGate) {
        const id = answer.questionId != null ? String(answer.questionId) : '';
        const m = Number(answer.marks ?? marksMap[id] ?? 1) || 1;
        if (answer.isCorrect) s.netMarks += m;
        else if (answer.isMcq !== false) s.netMarks -= m / 3;
        s.netMarks = Math.round(s.netMarks * 100) / 100;
      } else {
        s.netMarks = computeGateNetMarks(s.correct, s.incorrect);
      }
    } else if (jee) {
      s.netMarks = computeJeeMainNetMarks(s.correct, s.incorrect);
    }
  });

  Object.keys(subjectStats).forEach((subject) => {
    const stats = subjectStats[subject];
    stats.percentage =
      stats.attempted > 0
        ? Math.round((stats.correct / stats.attempted) * 10000) / 100
        : 0;
    stats.avgTime =
      stats.attempted > 0 ? Math.round(stats.totalTime / stats.attempted) : 0;
  });

  const timeSpent = Number(timeData?.totalTimeSpent) || 0;

  return {
    totalQuestions: total,
    attempted,
    correct,
    incorrect,
    skipped,
    markedCount,
    score,
    percentage,
    attemptPercentage,
    subjectStats,
    timeSpent,
    avgTimePerQuestion: attempted > 0 ? Math.round(timeSpent / attempted) : 0,
    markingScheme: gate ? 'gate' : jee ? 'jee-main' : 'standard',
    maxMarks: gate || jee ? maxMarks : total,
    netMarks: gate || jee ? netMarks : correct,
  };
}

/**
 * duration_taken: new rows = seconds; legacy rows = minutes (values typically 1–300).
 */
export function durationTakenToSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n < 1000) return Math.round(n * 60);
  return Math.round(n);
}

export function formatDurationShort(seconds) {
  const total = durationTakenToSeconds(seconds);
  if (total <= 0) return '0m';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function formatDurationLong(seconds) {
  const total = durationTakenToSeconds(seconds);
  if (total <= 0) return '0 minutes';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
  if (s > 0 && h === 0) parts.push(`${s} second${s !== 1 ? 's' : ''}`);
  return parts.join(' ') || '0 minutes';
}

/** Consecutive calendar-day streak (most recent day = today or yesterday to count) */
export function computeConsecutiveDayStreak(isoDates) {
  if (!isoDates?.length) return 0;
  const days = [
    ...new Set(
      isoDates
        .filter(Boolean)
        .map((d) => {
          const dt = new Date(d);
          if (Number.isNaN(dt.getTime())) return null;
          return dt.toISOString().slice(0, 10);
        })
        .filter(Boolean)
    ),
  ].sort((a, b) => (a < b ? 1 : -1));

  if (days.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(days[0] + 'T00:00:00');
  const diffFromToday = Math.round((today - latest) / (24 * 60 * 60 * 1000));
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T00:00:00');
    const curr = new Date(days[i] + 'T00:00:00');
    const gap = Math.round((prev - curr) / (24 * 60 * 60 * 1000));
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

export function isAllowedExternalApiUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const allowlist = (process.env.MOCK_TEST_API_ALLOWLIST || '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    if (allowlist.length === 0) return false;
    const host = url.hostname.toLowerCase();
    return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}
