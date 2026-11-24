import { unstable_cache } from 'next/cache';
import { getStaticExamCatalog } from '@/lib/platformExams';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import {
  EXAM_CATALOG_CACHE_TAG,
  EXAM_CATALOG_REVALIDATE_SECONDS,
  EXAM_QUESTION_COUNTS_CACHE_TAG,
  EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS,
} from '@/features/exams/lib/examCatalogCache';

const PLATFORM_EXAM_COLUMNS =
  'slug, name, description, category, image_url, icon, color_gradient, sort_order, is_active';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_QUESTION_COUNT = 50_000_000;

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

/** Reject malformed RPC rows so a bad payload is never stored in cache. */
function parseQuestionCount(value) {
  const raw = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  return Math.min(Math.floor(raw), MAX_QUESTION_COUNT);
}

function parseQuestionCountRows(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('examtracker_counts_by_slug did not return an array');
  }
  const map = {};
  for (const row of rows) {
    const slug = normalizeSlug(row?.slug);
    const count = parseQuestionCount(row?.question_count);
    if (!SLUG_RE.test(slug) || count == null) continue;
    map[slug] = count;
  }
  return map;
}

function isMissingCountsRpc(error) {
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    error?.code === 'COUNTS_UNAVAILABLE' ||
    /examtracker_counts_by_slug/i.test(error?.message || '')
  );
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

/** Counts are public aggregates. Prefer the service role so RLS does not hide the bank. */
function countsClient() {
  return getSupabaseServer(isValidServiceRoleKey());
}

let fallbackWarned = false;

function warnMissingCountsRpc() {
  if (fallbackWarned) return;
  fallbackWarned = true;
  console.warn(
    '[exams] examtracker_counts_by_slug is not installed. Using one shared indexed refresh every 15 minutes. Run supabase/migrations/add_examtracker_counts_by_slug.sql to make that refresh a single grouped query.'
  );
}

async function loadGroupedQuestionCounts() {
  const supabase = countsClient();
  const { data, error } = await supabase.rpc('examtracker_counts_by_slug');
  if (error) {
    if (isMissingCountsRpc(error)) return null;
    throw error;
  }
  return parseQuestionCountRows(data || []);
}

const COUNT_BATCH_SIZE = 4;

async function loadPlatformSlugs() {
  const supabase = countsClient();
  const { data, error } = await supabase.from('platform_exams').select('slug');
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return [...new Set((data || []).map((row) => normalizeSlug(row.slug)).filter((slug) => SLUG_RE.test(slug)))];
}

async function countSlug(supabase, slug) {
  const variants = countCategoryVariants(slug);
  if (!variants.length) return 0;
  const { count, error } = await supabase
    .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
    .select('_id', { count: 'exact', head: true })
    .in('category', variants);
  if (error) throw error;
  return parseQuestionCount(count) || 0;
}

/** One indexed count per exam, a few at a time, only when the grouped function is missing. */
async function loadFallbackQuestionCounts() {
  warnMissingCountsRpc();
  const slugs = await loadPlatformSlugs();
  const supabase = countsClient();
  const map = {};
  for (let index = 0; index < slugs.length; index += COUNT_BATCH_SIZE) {
    const batch = slugs.slice(index, index + COUNT_BATCH_SIZE);
    const counts = await Promise.all(batch.map((slug) => countSlug(supabase, slug)));
    batch.forEach((slug, batchIndex) => {
      map[slug] = counts[batchIndex];
    });
  }
  return map;
}

async function loadQuestionCountMap() {
  const grouped = await loadGroupedQuestionCounts();
  if (grouped) return grouped;
  return loadFallbackQuestionCounts();
}

/**
 * One map for the whole site. Next caches it across requests; the process
 * cache below serves repeat reads without entering this function.
 */
const getCachedQuestionCountMap = unstable_cache(
  loadQuestionCountMap,
  ['exam-question-count-map-v1'],
  {
    revalidate: EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS,
    tags: [EXAM_QUESTION_COUNTS_CACHE_TAG],
  }
);

const countMapState = {
  value: null,
  at: 0,
  pending: null,
};

function refreshQuestionCountMap() {
  if (countMapState.pending) return countMapState.pending;
  countMapState.pending = getCachedQuestionCountMap()
    .then((map) => {
      countMapState.value = map && typeof map === 'object' ? map : {};
      countMapState.at = Date.now();
      countMapState.pending = null;
      return countMapState.value;
    })
    .catch((err) => {
      countMapState.pending = null;
      throw err;
    });
  return countMapState.pending;
}

/** Case and underscore spellings stored in examtracker.category (GATE-CSE, GATE_CSE). */
function countCategoryVariants(slug) {
  const hyphen = String(slug || '').trim().replace(/_/g, '-');
  if (!hyphen) return [];
  const underscored = hyphen.replace(/-/g, '_');
  const values = new Set();
  for (const form of [hyphen, underscored]) {
    values.add(form);
    values.add(form.toLowerCase());
    values.add(form.toUpperCase());
    const separator = form.includes('_') ? '_' : '-';
    values.add(
      form
        .toLowerCase()
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(separator)
    );
  }
  return [...values];
}

/**
 * Shared question totals for homepage, /exams, exam hubs, and admin.
 * A warm server answers from memory. The bank is recounted at most once
 * every EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS, not once per visitor.
 * @param {string[]} [_slugs] ignored; kept so existing callers stay valid
 */
export async function fetchQuestionCountsBySlug(_slugs) {
  void _slugs;
  const ttlMs = EXAM_QUESTION_COUNTS_REVALIDATE_SECONDS * 1000;
  const age = countMapState.value ? Date.now() - countMapState.at : Infinity;

  if (countMapState.value && age < ttlMs) {
    return countMapState.value;
  }

  if (countMapState.value && age < ttlMs * 2) {
    refreshQuestionCountMap().catch((err) => {
      console.error('fetchQuestionCountsBySlug', err?.message || err);
    });
    return countMapState.value;
  }

  try {
    return await refreshQuestionCountMap();
  } catch (err) {
    console.error('fetchQuestionCountsBySlug', err?.message || err);
    return countMapState.value || {};
  }
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

const getCachedActiveExamRows = unstable_cache(
  () => loadPlatformExamRows(true),
  ['platform-exam-rows', 'active'],
  {
    revalidate: EXAM_CATALOG_REVALIDATE_SECONDS,
    tags: [EXAM_CATALOG_CACHE_TAG],
  }
);

const getCachedAllExamRows = unstable_cache(
  () => loadPlatformExamRows(false),
  ['platform-exam-rows', 'all'],
  {
    revalidate: EXAM_CATALOG_REVALIDATE_SECONDS,
    tags: [EXAM_CATALOG_CACHE_TAG],
  }
);

/**
 * Platform exam catalog with validated question counts.
 * Exam rows and counts use separate TTLs so a count miss does not freeze zeros
 * into the catalog cache.
 * @param {{ activeOnly?: boolean }} [options]
 */
export async function fetchExamCatalog({ activeOnly = false } = {}) {
  const rowsOrNull = activeOnly ? await getCachedActiveExamRows() : await getCachedAllExamRows();
  const rows = rowsOrNull == null ? staticRows(activeOnly) : rowsOrNull;
  const counts = await fetchQuestionCountsBySlug(rows.map((row) => row.slug));
  const countMap = new Map(Object.entries(counts || {}));
  return rows.map((row) => mapExamCatalogRow(row, countMap));
}

export function sumQuestionCounts(exams) {
  return (exams || []).reduce((sum, exam) => {
    const count = parseQuestionCount(exam?.count ?? exam?.question_count);
    return sum + (count || 0);
  }, 0);
}

/** Public homepage / exams list — active exams only. */
export async function fetchActiveExamCatalog() {
  return fetchExamCatalog({ activeOnly: true });
}
