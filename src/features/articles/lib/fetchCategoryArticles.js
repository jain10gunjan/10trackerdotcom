import { createClient } from '@supabase/supabase-js';
import {
  ARTICLE_PAGE_SIZE,
  safeArticlePage,
  sanitizeSearchQuery,
} from '@/features/articles/lib/categoryMeta';

export const ARTICLES_LIST_PAGE_SIZE = 18;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const LISTING_COLUMNS =
  'id, slug, title, excerpt, category, created_at, view_count, is_featured, featured_image_url';

function parseCursor(cursor) {
  if (!cursor || typeof cursor !== 'string') return null;
  const [createdAt, idRaw] = cursor.split('|');
  const id = Number.parseInt(idRaw, 10);
  if (!createdAt || !Number.isFinite(id)) return null;
  return { createdAt, id };
}

function encodeCursor(article) {
  if (!article?.created_at || article?.id == null) return null;
  return `${article.created_at}|${article.id}`;
}

async function runWithSearchFallback(buildQuery, q, rangeStart, rangeEnd) {
  const primary = buildQuery(true);
  const { data, count, error } = await primary.range(rangeStart, rangeEnd);

  if (!error) {
    return { data, count, error: null };
  }

  const needsFallback =
    q &&
    (error.message?.includes('search_vector') ||
      error.code === '42703' ||
      error.message?.includes('textSearch'));

  if (!needsFallback) {
    return { data: null, count: null, error };
  }

  const pattern = `%${q}%`;
  const fallback = buildQuery(false).or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);
  return fallback.range(rangeStart, rangeEnd);
}

/**
 * Server-side fetch for /articles with pagination, optional category + search.
 * Supports offset pages (SEO) and optional keyset `cursor` (`created_at|id`).
 */
export async function fetchArticlesList({
  page = 1,
  pageSize = ARTICLES_LIST_PAGE_SIZE,
  category = '',
  query = '',
  cursor = '',
} = {}) {
  const supabase = getSupabase();
  const safePage = safeArticlePage(page);
  const offset = (safePage - 1) * pageSize;
  const q = sanitizeSearchQuery(query);
  const cat = String(category || '').trim().toLowerCase();
  const parsedCursor = parseCursor(cursor);

  const buildQuery = (useFts) => {
    let dbQuery = supabase
      .from('published_articles')
      .select(LISTING_COLUMNS, { count: parsedCursor ? 'estimated' : 'exact' })
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (cat) {
      dbQuery = dbQuery.eq('category', cat);
    }

    if (parsedCursor) {
      dbQuery = dbQuery.or(
        `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},id.lt.${parsedCursor.id})`
      );
    }

    if (q && useFts) {
      dbQuery = dbQuery.textSearch('search_vector', q, {
        type: 'websearch',
        config: 'english',
      });
    }

    return dbQuery;
  };

  const rangeStart = parsedCursor ? 0 : offset;
  const rangeEnd = parsedCursor ? pageSize - 1 : offset + pageSize - 1;

  const { data, count, error } = await runWithSearchFallback(
    buildQuery,
    q,
    rangeStart,
    rangeEnd
  );

  if (error) throw error;

  const articles = data || [];
  const nextCursor =
    articles.length === pageSize ? encodeCursor(articles[articles.length - 1]) : null;

  return {
    articles,
    totalCount: count ?? 0,
    page: safePage,
    pageSize,
    category: cat,
    query: q,
    nextCursor,
  };
}

/**
 * Server-side fetch for /article/[cate] with pagination + optional search.
 */
export async function fetchCategoryArticles({
  category,
  page = 1,
  pageSize = ARTICLE_PAGE_SIZE,
  query = '',
}) {
  const supabase = getSupabase();
  const offset = (page - 1) * pageSize;
  const q = sanitizeSearchQuery(query);

  const buildQuery = (useFts) => {
    let dbQuery = supabase
      .from('published_articles')
      .select(LISTING_COLUMNS, { count: 'exact' })
      .eq('category', category)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (q && useFts) {
      dbQuery = dbQuery.textSearch('search_vector', q, {
        type: 'websearch',
        config: 'english',
      });
    }

    return dbQuery;
  };

  const { data, count, error } = await runWithSearchFallback(
    buildQuery,
    q,
    offset,
    offset + pageSize - 1
  );

  if (error) throw error;

  return {
    articles: data || [],
    totalCount: count ?? 0,
    page,
    pageSize,
    query: q,
  };
}

export async function fetchAllCategories() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('article_categories')
    .select('name, slug, color')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchCategoryRow(slug) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('article_categories')
    .select('name, slug, color')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

/** True when slug is a registered category or has published articles. */
export async function isArticleCategorySlug(slug) {
  const normalized = String(slug || '').trim().toLowerCase();
  if (!normalized) return false;

  const row = await fetchCategoryRow(normalized);
  if (row?.slug) return true;

  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('published_articles')
    .select('id', { count: 'exact', head: true })
    .eq('category', normalized);

  if (error) return false;
  return (count ?? 0) > 0;
}
