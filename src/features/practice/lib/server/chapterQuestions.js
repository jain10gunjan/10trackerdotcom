import { createClient } from '@supabase/supabase-js';
import {
  getChapterCandidates,
  normalizeChapterName,
  chapterNamesMatch,
  QUESTIONS_PER_PAGE,
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

let chapterSlugSupported = null; // null unknown, true/false

async function resolveMatchedChapter(supabase, categoryUpper, chapter) {
  const slug = slugifyChapter(chapter);
  const candidates = getChapterCandidates(chapter);
  const normalizedInput = normalizeChapterName(chapter);

  // Prefer chapter_slug when column exists (after you run scripts/add_examtracker_chapter_slug.sql)
  if (chapterSlugSupported !== false && slug) {
    try {
      const { data, error } = await supabase
        .from('examtracker')
        .select('chapter, chapter_slug')
        .eq('category', categoryUpper)
        .eq('chapter_slug', slug)
        .limit(1);
      if (error) {
        if (isMissingChapterSlugError(error)) {
          chapterSlugSupported = false;
        } else {
          throw error;
        }
      } else if (data?.[0]?.chapter) {
        chapterSlugSupported = true;
        return data[0].chapter;
      } else {
        chapterSlugSupported = true;
      }
    } catch (e) {
      if (isMissingChapterSlugError(e)) chapterSlugSupported = false;
      else throw e;
    }
  }

  for (const candidate of candidates) {
    const { count, error } = await supabase
      .from('examtracker')
      .select('_id', { count: 'exact', head: true })
      .eq('category', categoryUpper)
      .eq('chapter', candidate);
    if (error) throw error;
    if ((count ?? 0) > 0) return candidate;
  }

  const { data: chaptersData, error: chaptersError } = await supabase
    .from('examtracker')
    .select('chapter')
    .eq('category', categoryUpper)
    .limit(5000);
  if (chaptersError) throw chaptersError;

  const resolved = (chaptersData ?? [])
    .map((r) => r?.chapter)
    .filter(Boolean)
    .find((ch) => chapterNamesMatch(ch, normalizedInput));

  return resolved ?? null;
}

async function headCount(supabase, categoryUpper, chapterValue, difficulty, slug) {
  let q = supabase
    .from('examtracker')
    .select('_id', { count: 'exact', head: true })
    .eq('category', categoryUpper);

  if (chapterSlugSupported && slug) {
    q = q.eq('chapter_slug', slug);
  } else {
    q = q.eq('chapter', chapterValue);
  }
  if (difficulty) q = q.eq('difficulty', difficulty);
  const res = await q;
  if (res.error) {
    if (chapterSlugSupported && isMissingChapterSlugError(res.error)) {
      chapterSlugSupported = false;
      return headCount(supabase, categoryUpper, chapterValue, difficulty, null);
    }
    throw res.error;
  }
  return res.count || 0;
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

export async function fetchChapterCountsServer(category, chapter) {
  const supabase = getSupabase();
  const categoryUpper = String(category).toUpperCase();
  const matchedChapter = await resolveMatchedChapter(supabase, categoryUpper, chapter);
  const slug = slugifyChapter(chapter);

  if (!matchedChapter) {
    logPracticeMetric('chapter_empty', { category, chapter });
    return {
      matchedChapter: null,
      matchedSlug: slug,
      counts: { easy: 0, medium: 0, hard: 0 },
      total: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      chapterSlugSupported: chapterSlugSupported === true,
    };
  }

  const [easy, medium, hard, total] = await Promise.all([
    headCount(supabase, categoryUpper, matchedChapter, 'easy', slug),
    headCount(supabase, categoryUpper, matchedChapter, 'medium', slug),
    headCount(supabase, categoryUpper, matchedChapter, 'hard', slug),
    headCount(supabase, categoryUpper, matchedChapter, null, slug),
  ]);

  return {
    matchedChapter,
    matchedSlug: slug,
    counts: { easy, medium, hard },
    total,
    easy,
    medium,
    hard,
    chapterSlugSupported: chapterSlugSupported === true,
  };
}

function buildChapterFilter(query, categoryUpper, matchedChapter, slug) {
  let q = query.eq('category', categoryUpper);
  if (chapterSlugSupported && slug) {
    q = q.eq('chapter_slug', slug);
  } else {
    const candidates = getChapterCandidates(matchedChapter || slug);
    q = q.in('chapter', candidates);
  }
  return q;
}

export async function fetchChapterQuestionsServer({
  category,
  chapter,
  difficulty,
  page = 1,
  limit = QUESTIONS_PER_PAGE,
  mirrorImages = false,
}) {
  const supabase = getSupabase();
  const categoryUpper = String(category).toUpperCase();
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;
  const slug = slugifyChapter(chapter);
  const matchedChapter = await resolveMatchedChapter(supabase, categoryUpper, chapter);

  const selectCols = chapterSlugSupported === false ? QUESTION_SELECT_LEGACY : QUESTION_SELECT;

  let query = supabase
    .from('examtracker')
    .select(selectCols, { count: 'exact' })
    .order('_id', { ascending: true })
    .range(offset, offset + safeLimit - 1);

  query = buildChapterFilter(query, categoryUpper, matchedChapter || chapter, slug);

  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
    query = query.eq('difficulty', difficulty);
  }

  let { data, count, error } = await query;
  if (error && isMissingChapterSlugError(error)) {
    chapterSlugSupported = false;
    query = supabase
      .from('examtracker')
      .select(QUESTION_SELECT_LEGACY, { count: 'exact' })
      .eq('category', categoryUpper)
      .in('chapter', getChapterCandidates(matchedChapter || chapter))
      .order('_id', { ascending: true })
      .range(offset, offset + safeLimit - 1);
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }
    ({ data, count, error } = await query);
  }
  if (error) throw error;

  const questions = await enrichQuestions(data ?? [], { mirrorImages });
  if (!questions.length) {
    logPracticeMetric('chapter_page_empty', { category, chapter, difficulty, page: safePage });
  }

  return {
    questions,
    hasMore: offset + questions.length < (count ?? 0),
    totalCount: count ?? 0,
    currentPage: safePage,
    totalPages: Math.ceil((count ?? 0) / safeLimit),
    matchedChapter: questions[0]?.chapter ?? matchedChapter,
    matchedSlug: slug,
    chapterSlugSupported: chapterSlugSupported === true,
  };
}

export async function fetchChapterQuestionIdsServer({ category, chapter, difficulty }) {
  const supabase = getSupabase();
  const categoryUpper = String(category).toUpperCase();
  const slug = slugifyChapter(chapter);
  const matchedChapter = await resolveMatchedChapter(supabase, categoryUpper, chapter);

  let query = supabase
    .from('examtracker')
    .select(chapterSlugSupported === false ? '_id, chapter' : '_id, chapter, chapter_slug')
    .order('_id', { ascending: true });

  query = buildChapterFilter(query, categoryUpper, matchedChapter || chapter, slug);

  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
    query = query.eq('difficulty', difficulty);
  }

  let { data, error } = await query;
  if (error && isMissingChapterSlugError(error)) {
    chapterSlugSupported = false;
    query = supabase
      .from('examtracker')
      .select('_id, chapter')
      .eq('category', categoryUpper)
      .in('chapter', getChapterCandidates(matchedChapter || chapter))
      .order('_id', { ascending: true });
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }
    ({ data, error } = await query);
  }
  if (error) throw error;

  const rows = data ?? [];
  return {
    ids: rows.map((r) => String(r._id)).filter(Boolean),
    matchedChapter: rows[0]?.chapter ?? matchedChapter,
    matchedSlug: slug,
    chapterSlugSupported: chapterSlugSupported === true,
  };
}

export async function fetchChapterQuestionBodiesServer(ids) {
  const supabase = getSupabase();
  const unique = [...new Set((ids ?? []).map(String).filter(Boolean))].slice(0, 20);
  if (!unique.length) return { questions: [] };

  const selectCols = chapterSlugSupported === false ? QUESTION_SELECT_LEGACY : QUESTION_SELECT;
  let { data, error } = await supabase.from('examtracker').select(selectCols).in('_id', unique);
  if (error && isMissingChapterSlugError(error)) {
    chapterSlugSupported = false;
    ({ data, error } = await supabase.from('examtracker').select(QUESTION_SELECT_LEGACY).in('_id', unique));
  }
  if (error) throw error;

  const questions = await enrichQuestions(data ?? [], { mirrorImages: true });
  return { questions };
}

/** SSR bootstrap payload for chapter practice page. */
export async function fetchChapterPracticeInitialData({
  category,
  chapter,
  difficulty = 'easy',
  page = 1,
  limit = QUESTIONS_PER_PAGE,
}) {
  const [counts, pageData, idsData] = await Promise.all([
    fetchChapterCountsServer(category, chapter),
    fetchChapterQuestionsServer({
      category,
      chapter,
      difficulty,
      page,
      limit,
      mirrorImages: true,
    }),
    fetchChapterQuestionIdsServer({ category, chapter, difficulty }),
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
    chapterSlugSupported:
      pageData.chapterSlugSupported ||
      counts.chapterSlugSupported ||
      idsData.chapterSlugSupported ||
      false,
    questions: pageData.questions,
    hasMore: pageData.hasMore,
    difficultyIds: idsData.ids,
    difficulty,
  };
}
