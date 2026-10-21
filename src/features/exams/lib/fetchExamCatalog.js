import { unstable_cache } from 'next/cache';
import { getStaticExamCatalog } from '@/lib/platformExams';
import { getSupabaseServer } from '@/lib/supabaseServer';
import {
  EXAM_CATALOG_CACHE_TAG,
  EXAM_CATALOG_REVALIDATE_SECONDS,
  EXAM_QUESTION_COUNTS_CACHE_TAG,
  EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS,
} from '@/features/exams/lib/examCatalogCache';

const PLATFORM_EXAM_COLUMNS =
  'slug, name, description, category, image_url, icon, color_gradient, sort_order, is_active';

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

/**
 * Map a platform_exams (or static) row into the public catalog shape.
 * @param {Record<string, unknown>} row
 * @param {Map<string, number> | Record<string, number>} [countsBySlug]
 */
export function mapExamCatalogRow(row, countsBySlug) {
  const slug = normalizeSlug(row.slug);
  const countMap =
    countsBySlug instanceof Map
      ? countsBySlug
      : countsBySlug && typeof countsBySlug === 'object'
        ? new Map(Object.entries(countsBySlug))
        : null;
  const count = countMap?.get(slug) ?? 0;

  return {
    slug,
    name: row.name,
    image: row.image_url || row.image || null,
    icon: row.icon || '📚',
    description: row.description || 'Topic-wise practice with solutions',
    category: row.category || 'General',
    color: row.color_gradient || row.color || null,
    count,
    question_count: count,
    sortOrder: row.sort_order ?? row.sortOrder ?? 999,
    active: row.is_active !== false,
    is_active: row.is_active !== false,
  };
}

async function loadQuestionCountsUncached() {
  try {
    const supabase = getSupabaseServer(false);
    const { data, error } = await supabase.rpc('examtracker_counts_by_slug');

    if (error) {
      // Function missing / not migrated yet — treat as empty, not fatal.
      if (
        error.code === '42883' ||
        error.code === 'PGRST202' ||
        /examtracker_counts_by_slug/i.test(error.message || '')
      ) {
        return {};
      }
      throw error;
    }

    const map = {};
    for (const row of data || []) {
      const slug = normalizeSlug(row.slug);
      if (!slug) continue;
      map[slug] = Number(row.question_count) || 0;
    }
    return map;
  } catch (err) {
    console.error('fetchQuestionCountsBySlug', err);
    return {};
  }
}

/** Cached map of normalized exam slug → question count from examtracker. */
export async function fetchQuestionCountsBySlug() {
  const cached = unstable_cache(
    () => loadQuestionCountsUncached(),
    ['examtracker-counts-by-slug'],
    {
      revalidate: EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS,
      tags: [EXAM_QUESTION_COUNTS_CACHE_TAG],
    }
  );
  return cached();
}

async function loadPlatformExamRows(activeOnly) {
  try {
    const supabase = getSupabaseServer(false);
    let query = supabase
      .from('platform_exams')
      .select(PLATFORM_EXAM_COLUMNS)
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return null;
      }
      throw error;
    }

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('loadPlatformExamRows', err);
    return null;
  }
}

function staticRows(activeOnly) {
  const rows = getStaticExamCatalog();
  return activeOnly ? rows.filter((e) => e.is_active !== false) : rows;
}

/**
 * Platform exam catalog with live question counts.
 * @param {{ activeOnly?: boolean }} [options]
 */
export async function fetchExamCatalog({ activeOnly = false } = {}) {
  const cached = unstable_cache(
    async () => {
      // Load counts directly (no nested unstable_cache) so one cache entry
      // holds both platform_exams rows and question totals.
      const [rowsOrNull, counts] = await Promise.all([
        loadPlatformExamRows(activeOnly),
        loadQuestionCountsUncached(),
      ]);

      const rows = rowsOrNull == null ? staticRows(activeOnly) : rowsOrNull;
      const countMap = new Map(Object.entries(counts));

      return rows.map((row) => mapExamCatalogRow(row, countMap));
    },
    ['exam-catalog', activeOnly ? 'active' : 'all'],
    {
      revalidate: EXAM_CATALOG_REVALIDATE_SECONDS,
      tags: [EXAM_CATALOG_CACHE_TAG, EXAM_QUESTION_COUNTS_CACHE_TAG],
    }
  );

  return cached();
}

/** Public homepage / exams list — active exams only. */
export async function fetchActiveExamCatalog() {
  return fetchExamCatalog({ activeOnly: true });
}
