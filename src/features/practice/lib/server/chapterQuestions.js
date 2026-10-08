import { createClient } from '@supabase/supabase-js';
import {
  getChapterCandidates,
  getSubjectCandidates,
  normalizeChapterName,
  chapterNamesMatch,
  sanitizePracticeParam,
  normalizeCategoryKey,
  QUESTIONS_PER_PAGE,
  DIFFICULTIES,
} from '@/features/practice/lib/chapterPracticeUtils';
import { canonicalizeQuestionRow } from '@/features/practice/lib/canonicalizeQuestionContent';
import { rewriteGateImagesInQuestion } from '@/features/practice/lib/server/gateImageMirror';
import { logPracticeMetric } from '@/lib/practiceMetrics';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const QUESTION_SELECT =
  '_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, difficulty, year, subject, chapter, topic, chapter_slug';

const QUESTION_SELECT_LEGACY =
  '_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, difficulty, year, subject, chapter, topic';

function isMissingChapterSlugError(error) {
  const msg = String(error?.message || '');
  return (
    error?.code === '42703' ||
    /chapter_slug/i.test(msg) ||
    /column .* does not exist/i.test(msg)
  );
}

export function slugifyChapter(chapter) {
  return normalizeChapterName(chapter)
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '');
}

/**
 * Validate + normalize practice query inputs.
 * Works for every exam category on /[category]/[subject]/[chapter]/practice.
 */
export function parseChapterPracticeScope({ category, subject, chapter } = {}) {
  const categoryKey = normalizeCategoryKey(category);
  const chapterRaw = sanitizePracticeParam(chapter);
  const subjectRaw = sanitizePracticeParam(subject);

  if (!categoryKey || !chapterRaw) {
    return { ok: false, error: 'Invalid category or chapter' };
  }

  return {
    ok: true,
    categoryKey,
    chapterRaw,
    subjectRaw: subjectRaw || null,
    chapterSlug: slugifyChapter(chapterRaw),
    chapterCandidates: getChapterCandidates(chapterRaw),
    subjectCandidates: getSubjectCandidates(subjectRaw),
  };
}

function applySubjectFilter(query, subjectCandidates = []) {
  if (!subjectCandidates?.length) return query;
  return query.in('subject', subjectCandidates);
}

function applyChapterFilter(query, matchedChapter, chapterCandidates = []) {
  const candidates = matchedChapter
    ? getChapterCandidates(matchedChapter)
    : chapterCandidates;
  const unique = [...new Set(candidates.filter(Boolean))];
  if (!unique.length) return query.eq('chapter', matchedChapter || '');
  if (unique.length === 1) return query.eq('chapter', unique[0]);
  return query.in('chapter', unique);
}

/**
 * Resolve the canonical `chapter` column value.
 * IMPORTANT: do not filter by chapter_slug — that column is often topic-polluted.
 */
async function resolveMatchedChapter(supabase, scope) {
  const { categoryKey, chapterCandidates, subjectCandidates, chapterRaw } = scope;
  const normalizedInput = normalizeChapterName(chapterRaw);

  for (const candidate of chapterCandidates) {
    let q = supabase
      .from('examtracker')
      .select('_id', { count: 'exact', head: true })
      .eq('category', categoryKey)
      .eq('chapter', candidate);
    q = applySubjectFilter(q, subjectCandidates);
    const { count, error } = await q;
    if (error) throw error;
    if ((count ?? 0) > 0) return candidate;
  }

  // Fallback: scan distinct chapters for this category (+ subject) and fuzzy-match.
  let listQuery = supabase
    .from('examtracker')
    .select('chapter')
    .eq('category', categoryKey)
    .not('chapter', 'is', null)
    .limit(5000);
  listQuery = applySubjectFilter(listQuery, subjectCandidates);

  const { data: chaptersData, error: chaptersError } = await listQuery;
  if (chaptersError) throw chaptersError;

  const resolved = [...new Set((chaptersData ?? []).map((r) => r?.chapter).filter(Boolean))].find(
    (ch) => chapterNamesMatch(ch, normalizedInput)
  );

  return resolved ?? null;
}

async function headCount(supabase, scope, matchedChapter, difficulty) {
  let q = supabase
    .from('examtracker')
    .select('_id', { count: 'exact', head: true })
    .eq('category', scope.categoryKey);

  q = applyChapterFilter(q, matchedChapter, scope.chapterCandidates);
  q = applySubjectFilter(q, scope.subjectCandidates);

  if (difficulty && DIFFICULTIES.includes(difficulty)) {
    q = q.eq('difficulty', difficulty);
  }

  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

async function enrichQuestions(questions, { mirrorImages = false } = {}) {
  let rows = (questions ?? []).map(canonicalizeQuestionRow);
  if (mirrorImages && process.env.PRACTICE_MIRROR_IMAGES !== '0') {
    rows = await Promise.all(
      rows.map((q) => rewriteGateImagesInQuestion(q).catch(() => q))
    );
  }
  return rows;
}

function emptyCounts(scope) {
  return {
    matchedChapter: null,
    matchedSlug: scope?.chapterSlug || null,
    matchedSubject: scope?.subjectRaw || null,
    counts: { easy: 0, medium: 0, hard: 0 },
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  };
}

export async function fetchChapterCountsServer(category, chapter, subject) {
  const scope = parseChapterPracticeScope({ category, subject, chapter });
  if (!scope.ok) {
    logPracticeMetric('chapter_invalid_scope', { category, chapter, subject });
    return emptyCounts(null);
  }

  const supabase = getSupabase();
  const matchedChapter = await resolveMatchedChapter(supabase, scope);

  if (!matchedChapter) {
    logPracticeMetric('chapter_empty', {
      category: scope.categoryKey,
      chapter: scope.chapterRaw,
      subject: scope.subjectRaw,
    });
    return emptyCounts(scope);
  }

  const [easy, medium, hard, total] = await Promise.all([
    headCount(supabase, scope, matchedChapter, 'easy'),
    headCount(supabase, scope, matchedChapter, 'medium'),
    headCount(supabase, scope, matchedChapter, 'hard'),
    headCount(supabase, scope, matchedChapter, null),
  ]);

  return {
    matchedChapter,
    matchedSlug: scope.chapterSlug,
    matchedSubject: scope.subjectRaw,
    counts: { easy, medium, hard },
    total,
    easy,
    medium,
    hard,
  };
}

async function runChapterSelect({
  scope,
  matchedChapter,
  difficulty,
  page,
  limit,
  selectCols,
}) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('examtracker')
    .select(selectCols, { count: 'exact' })
    .eq('category', scope.categoryKey)
    .order('_id', { ascending: true })
    .range(offset, offset + limit - 1);

  query = applyChapterFilter(query, matchedChapter || scope.chapterRaw, scope.chapterCandidates);
  query = applySubjectFilter(query, scope.subjectCandidates);

  if (difficulty && DIFFICULTIES.includes(difficulty)) {
    query = query.eq('difficulty', difficulty);
  }

  return query;
}

export async function fetchChapterQuestionsServer({
  category,
  chapter,
  subject,
  difficulty,
  page = 1,
  limit = QUESTIONS_PER_PAGE,
  mirrorImages = false,
}) {
  const scope = parseChapterPracticeScope({ category, subject, chapter });
  if (!scope.ok) {
    return {
      questions: [],
      hasMore: false,
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      matchedChapter: null,
      matchedSlug: null,
      matchedSubject: null,
      error: scope.error,
    };
  }

  const supabase = getSupabase();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || QUESTIONS_PER_PAGE));
  const matchedChapter = await resolveMatchedChapter(supabase, scope);

  let { data, count, error } = await runChapterSelect({
    scope,
    matchedChapter,
    difficulty,
    page: safePage,
    limit: safeLimit,
    selectCols: QUESTION_SELECT,
  });

  if (error && isMissingChapterSlugError(error)) {
    ({ data, count, error } = await runChapterSelect({
      scope,
      matchedChapter,
      difficulty,
      page: safePage,
      limit: safeLimit,
      selectCols: QUESTION_SELECT_LEGACY,
    }));
  }
  if (error) throw error;

  const questions = await enrichQuestions(data ?? [], { mirrorImages });
  if (!questions.length) {
    logPracticeMetric('chapter_page_empty', {
      category: scope.categoryKey,
      chapter: scope.chapterRaw,
      subject: scope.subjectRaw,
      difficulty,
      page: safePage,
    });
  }

  const offset = (safePage - 1) * safeLimit;
  return {
    questions,
    hasMore: offset + questions.length < (count ?? 0),
    totalCount: count ?? 0,
    currentPage: safePage,
    totalPages: Math.ceil((count ?? 0) / safeLimit),
    matchedChapter: questions[0]?.chapter ?? matchedChapter,
    matchedSlug: scope.chapterSlug,
    matchedSubject: scope.subjectRaw,
  };
}

export async function fetchChapterQuestionIdsServer({
  category,
  chapter,
  subject,
  difficulty,
}) {
  const scope = parseChapterPracticeScope({ category, subject, chapter });
  if (!scope.ok) {
    return {
      ids: [],
      matchedChapter: null,
      matchedSlug: null,
      matchedSubject: null,
      error: scope.error,
    };
  }

  const supabase = getSupabase();
  const matchedChapter = await resolveMatchedChapter(supabase, scope);

  const runIds = async (selectCols) => {
    let query = supabase
      .from('examtracker')
      .select(selectCols)
      .eq('category', scope.categoryKey)
      .order('_id', { ascending: true });

    query = applyChapterFilter(query, matchedChapter || scope.chapterRaw, scope.chapterCandidates);
    query = applySubjectFilter(query, scope.subjectCandidates);

    if (difficulty && DIFFICULTIES.includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }
    return query;
  };

  let { data, error } = await runIds('_id, chapter, chapter_slug');
  if (error && isMissingChapterSlugError(error)) {
    ({ data, error } = await runIds('_id, chapter'));
  }
  if (error) throw error;

  const rows = data ?? [];
  return {
    ids: rows.map((r) => String(r._id)).filter(Boolean),
    matchedChapter: rows[0]?.chapter ?? matchedChapter,
    matchedSlug: scope.chapterSlug,
    matchedSubject: scope.subjectRaw,
  };
}

export async function fetchChapterQuestionBodiesServer(ids) {
  const supabase = getSupabase();
  const unique = [...new Set((ids ?? []).map(String).filter(Boolean))].slice(0, 20);
  if (!unique.length) return { questions: [] };

  // Only allow opaque ids (uuid / numeric / alphanumeric) — no injection via ids list.
  const safeIds = unique.filter((id) => /^[a-zA-Z0-9_-]{1,64}$/.test(id)).slice(0, 20);
  if (!safeIds.length) return { questions: [] };

  let { data, error } = await supabase.from('examtracker').select(QUESTION_SELECT).in('_id', safeIds);
  if (error && isMissingChapterSlugError(error)) {
    ({ data, error } = await supabase
      .from('examtracker')
      .select(QUESTION_SELECT_LEGACY)
      .in('_id', safeIds));
  }
  if (error) throw error;

  const questions = await enrichQuestions(data ?? [], { mirrorImages: true });
  return { questions };
}

/** SSR bootstrap payload for chapter practice page. */
export async function fetchChapterPracticeInitialData({
  category,
  chapter,
  subject,
  difficulty = 'easy',
  page = 1,
  limit = QUESTIONS_PER_PAGE,
}) {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'easy';

  const [counts, pageData, idsData] = await Promise.all([
    fetchChapterCountsServer(category, chapter, subject),
    fetchChapterQuestionsServer({
      category,
      chapter,
      subject,
      difficulty: safeDifficulty,
      page,
      limit,
      mirrorImages: true,
    }),
    fetchChapterQuestionIdsServer({
      category,
      chapter,
      subject,
      difficulty: safeDifficulty,
    }),
  ]);

  return {
    counts: {
      easy: counts.easy ?? 0,
      medium: counts.medium ?? 0,
      hard: counts.hard ?? 0,
    },
    totalQ: counts.total ?? 0,
    matchedChapter: pageData.matchedChapter ?? counts.matchedChapter ?? idsData.matchedChapter,
    matchedSlug: pageData.matchedSlug ?? counts.matchedSlug ?? idsData.matchedSlug,
    matchedSubject: pageData.matchedSubject ?? counts.matchedSubject ?? idsData.matchedSubject,
    questions: pageData.questions,
    hasMore: pageData.hasMore,
    difficultyIds: idsData.ids,
    difficulty: safeDifficulty,
  };
}
