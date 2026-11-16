import { getOrSetCached } from '@/lib/cache/serverTtlCache';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeCategorySlug, categorySlugToDbKey } from '@/features/exam-hub/lib/categoryKey';
import { fetchQuestionCountsBySlug } from '@/features/exams/lib/fetchExamCatalog';

/** Shared across homepage / hub — catalog inventory for one exam. */
export const EXAM_CATALOG_STATS_TTL_MS = 3 * 60 * 1000;
const DISTINCT_SOFT_TIMEOUT_MS = 4_000;

const EMPTY_STATS = Object.freeze({
  questionCount: 0,
  mockCount: 0,
  topicCount: 0,
  chapterCount: 0,
  subjectCount: 0,
});

function withSoftTimeout(promise, ms = DISTINCT_SOFT_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), ms);
    }),
  ]);
}

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
    console.error('countActiveMocks', examSlug, error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Distinct subject / topic / chapter via filter RPC (fast when indexed).
 * Soft-times out so home never waits on statement timeout 57014.
 */
async function loadDistinctSyllabusMeta(examSlug) {
  const supabase = getSupabaseAdmin();
  const dbCategory = categorySlugToDbKey(examSlug);
  const variants = getCategoryVariants(dbCategory) || [dbCategory];

  const tryField = async (field) => {
    for (const variant of variants) {
      const { data, error } = await supabase.rpc('examtracker_distinct_values', {
        p_field: field,
        p_category: variant,
        p_subject: null,
        p_chapter: null,
      });
      if (error) {
        const msg = String(error.message || '');
        const code = String(error.code || '');
        if (
          code === '57014' ||
          /examtracker_distinct_values|PGRST202|could not find|statement timeout|canceling statement/i.test(
            msg
          )
        ) {
          return null;
        }
        throw error;
      }
      if (data?.length) return data.map((r) => r.val).filter(Boolean);
    }
    return [];
  };

  try {
    const settled = await withSoftTimeout(
      Promise.all([tryField('subject'), tryField('topic'), tryField('chapter')])
    );

    if (!settled) {
      console.warn('loadDistinctSyllabusMeta soft-timeout', examSlug);
      return null;
    }

    const [subjects, topics, chapters] = settled;

    // null => RPC missing / timed out for that field
    if (subjects === null || topics === null || chapters === null) {
      return null;
    }

    return {
      subjectCount: subjects.length,
      topicCount: topics.length,
      chapterCount: chapters.length,
    };
  } catch (e) {
    console.error('loadDistinctSyllabusMeta', examSlug, e);
    return null;
  }
}

/**
 * Production catalog inventory for one exam slug.
 * Home should pass includeSyllabusMeta:false — distinct RPCs can take 8s+.
 */
export async function fetchExamCatalogStats(
  examSlug,
  { includeSyllabusMeta = true } = {}
) {
  const slug = normalizeCategorySlug(examSlug);
  if (!slug) return { ...EMPTY_STATS };

  const cacheKey = includeSyllabusMeta
    ? `exam-catalog-stats:v3:${slug}`
    : `exam-catalog-stats:v3-lite:${slug}`;

  return getOrSetCached(cacheKey, EXAM_CATALOG_STATS_TTL_MS, async () => {
    const [countMap, mockCount, meta] = await Promise.all([
      fetchQuestionCountsBySlug([slug]).catch(() => ({})),
      countActiveMocks(slug),
      includeSyllabusMeta ? loadDistinctSyllabusMeta(slug) : Promise.resolve(null),
    ]);

    return {
      questionCount: countMap?.[slug] || 0,
      mockCount,
      topicCount: meta?.topicCount || 0,
      chapterCount: meta?.chapterCount || 0,
      subjectCount: meta?.subjectCount || 0,
    };
  });
}
