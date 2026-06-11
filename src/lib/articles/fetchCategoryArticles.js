import { createClient } from '@supabase/supabase-js';
import {
  ARTICLE_PAGE_SIZE,
  safeArticlePage,
  sanitizeSearchQuery,
} from '@/lib/articles/categoryMeta';

export const ARTICLES_LIST_PAGE_SIZE = 18;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const LISTING_COLUMNS =
  'id, slug, title, excerpt, category, created_at, view_count, is_featured, featured_image_url';

/**
 * Server-side fetch for /articles with pagination, optional category + search.
 */
export async function fetchArticlesList({
  page = 1,
  pageSize = ARTICLES_LIST_PAGE_SIZE,
  category = '',
  query = '',
} = {}) {
  const supabase = getSupabase();
  const safePage = safeArticlePage(page);
  const offset = (safePage - 1) * pageSize;
  const q = sanitizeSearchQuery(query);
  const cat = String(category || '').trim().toLowerCase();

  let dbQuery = supabase
    .from('published_articles')
    .select(LISTING_COLUMNS, { count: 'exact' })
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (cat) {
    dbQuery = dbQuery.eq('category', cat);
  }

  if (q) {
    const pattern = `%${q}%`;
    dbQuery = dbQuery.or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);
  }

  const { data, count, error } = await dbQuery.range(offset, offset + pageSize - 1);

  if (error) throw error;

  return {
    articles: data || [],
    totalCount: count ?? 0,
    page: safePage,
    pageSize,
    category: cat,
    query: q,
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

  let dbQuery = supabase
    .from('published_articles')
    .select(LISTING_COLUMNS, { count: 'exact' })
    .eq('category', category)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (q) {
    const pattern = `%${q}%`;
    dbQuery = dbQuery.or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);
  }

  const { data, count, error } = await dbQuery.range(offset, offset + pageSize - 1);

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
