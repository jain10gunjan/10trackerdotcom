import { getOrSetCached } from '@/lib/cache/serverTtlCache';
import { fetchExamSubjects } from '@/features/exam-hub/lib/fetchExamSubjects';
import { getHubAggregateStats } from '@/features/exam-hub/lib/examHubUtils';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';

/** Shared across homepage / hub — catalog inventory for one exam. */
export const EXAM_CATALOG_STATS_TTL_MS = 2 * 60 * 1000;

const EMPTY_STATS = Object.freeze({
  questionCount: 0,
  mockCount: 0,
  topicCount: 0,
  chapterCount: 0,
  subjectCount: 0,
});

function countDistinctChapters(subjects = []) {
  const chapters = new Set();
  for (const sub of subjects) {
    for (const topic of sub?.subtopics || []) {
      const chapter = String(topic?.chapter || '').trim();
      if (!chapter) continue;
      chapters.add(`${sub.subject}::${chapter}`);
    }
  }
  return chapters.size;
}

/**
 * Active published mocks for an exam (full + topic + MOTD).
 * Uses HEAD count — O(1) network payload.
 */
async function countActiveMocks(examSlug) {
  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(examSlug);
  if (!variants.length) return 0;

  const { count, error } = await supabase
    .from('mock_tests')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .in('category', variants);

  if (error) {
    // Fallback: category stored under a single canonical form only.
    console.error('countActiveMocks', examSlug, error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Syllabus + bank stats from examtracker (via cached fetchExamSubjects).
 */
async function loadSyllabusStats(examSlug) {
  const subjects = await fetchExamSubjects(examSlug);
  const agg = getHubAggregateStats(subjects || []);
  return {
    questionCount: agg.questions || 0,
    topicCount: agg.topics || 0,
    subjectCount: agg.subjects || 0,
    chapterCount: countDistinctChapters(subjects),
  };
}

/**
 * Production catalog inventory for one exam slug.
 * Cached in-process (TTL) + reuses Next unstable_cache inside fetchExamSubjects.
 *
 * @returns {Promise<{
 *   questionCount: number,
 *   mockCount: number,
 *   topicCount: number,
 *   chapterCount: number,
 *   subjectCount: number,
 * }>}
 */
export async function fetchExamCatalogStats(examSlug) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return { ...EMPTY_STATS };

  return getOrSetCached(
    `exam-catalog-stats:v1:${slug}`,
    EXAM_CATALOG_STATS_TTL_MS,
    async () => {
      const [syllabus, mockCount] = await Promise.all([
        loadSyllabusStats(slug),
        countActiveMocks(slug),
      ]);

      return {
        questionCount: syllabus.questionCount,
        mockCount,
        topicCount: syllabus.topicCount,
        chapterCount: syllabus.chapterCount,
        subjectCount: syllabus.subjectCount,
      };
    }
  );
}
