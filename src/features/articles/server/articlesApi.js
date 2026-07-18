import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { safeArticlePage, sanitizeSearchQuery } from '@/features/articles/lib/categoryMeta';
import { fetchArticlesList } from '@/features/articles/lib/fetchCategoryArticles';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { enqueueRedditOutbox } from '@/features/articles/lib/enqueueRedditOutbox';
import { revalidateArticlesCache } from '@/features/articles/lib/revalidateArticlesCache';

const MAX_API_LIMIT = 50;
const MAX_ADMIN_LIMIT = 200;
const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);

const ADMIN_LIST_COLUMNS =
  'id, slug, title, excerpt, category, tags, featured_image_url, status, is_featured, view_count, social_media_embeds, created_at, updated_at, author_email';

async function fetchAdminArticlesList({
  page = 1,
  pageSize = 50,
  category = '',
  query = '',
  status = '',
} = {}) {
  const supabase = getSupabaseAdmin();
  const safePage = safeArticlePage(page);
  const offset = (safePage - 1) * pageSize;
  const q = sanitizeSearchQuery(query);
  const cat = String(category || '').trim().toLowerCase();
  const statusFilter = String(status || '').trim().toLowerCase();

  let dbQuery = supabase
    .from('articles')
    .select(ADMIN_LIST_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (cat) {
    dbQuery = dbQuery.eq('category', cat);
  }

  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  if (q) {
    dbQuery = dbQuery.textSearch('search_vector', q, {
      type: 'websearch',
      config: 'english',
    });
  }

  const { data, count, error } = await dbQuery.range(offset, offset + pageSize - 1);

  if (error) {
    // Fallback when search_vector column is not migrated yet
    if (q && (error.message?.includes('search_vector') || error.code === '42703')) {
      const pattern = `%${q}%`;
      let fallback = supabase
        .from('articles')
        .select(ADMIN_LIST_COLUMNS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);
      if (cat) fallback = fallback.eq('category', cat);
      if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
        fallback = fallback.eq('status', statusFilter);
      }
      const retry = await fallback.range(offset, offset + pageSize - 1);
      if (retry.error) throw retry.error;
      return {
        articles: retry.data || [],
        totalCount: retry.count ?? 0,
        page: safePage,
        pageSize,
      };
    }
    throw error;
  }

  return {
    articles: data || [],
    totalCount: count ?? 0,
    page: safePage,
    pageSize,
  };
}

// GET - Public published list, or full admin list when ?admin=1
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === '1';

    if (isAdminRequest) {
      const { isAdmin, error: authError } = await verifyAdminAuth();
      if (!isAdmin) {
        return Response.json(
          { success: false, error: authError || 'Admin access required' },
          { status: 403 }
        );
      }

      const category = searchParams.get('category') || '';
      const query = sanitizeSearchQuery(searchParams.get('q') || searchParams.get('query'));
      const status = searchParams.get('status') || '';
      const limit = Math.min(
        MAX_ADMIN_LIMIT,
        Math.max(1, Number.parseInt(searchParams.get('limit') || '50', 10) || 50)
      );
      const offset = Math.max(0, Number.parseInt(searchParams.get('offset') || '0', 10) || 0);
      const page = searchParams.has('page')
        ? safeArticlePage(searchParams.get('page'))
        : Math.floor(offset / limit) + 1;

      const { articles, totalCount, page: safePage, pageSize } = await fetchAdminArticlesList({
        page,
        pageSize: limit,
        category,
        query,
        status,
      });

      return Response.json({
        success: true,
        data: articles,
        pagination: {
          page: safePage,
          pageSize,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
          hasMore: safePage * pageSize < totalCount,
          limit: pageSize,
          offset: (safePage - 1) * pageSize,
        },
      });
    }

    const category = searchParams.get('category') || '';
    const query = sanitizeSearchQuery(searchParams.get('q') || searchParams.get('query'));
    const cursor = searchParams.get('cursor') || '';

    const limit = Math.min(
      MAX_API_LIMIT,
      Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10) || 10)
    );
    const offset = Math.max(0, Number.parseInt(searchParams.get('offset') || '0', 10) || 0);
    const page = searchParams.has('page')
      ? safeArticlePage(searchParams.get('page'))
      : Math.floor(offset / limit) + 1;

    const { articles, totalCount, page: safePage, pageSize, nextCursor } =
      await fetchArticlesList({
        page,
        pageSize: limit,
        category,
        query,
        cursor,
      });

    return Response.json({
      success: true,
      data: articles,
      pagination: {
        page: safePage,
        pageSize,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        hasMore: nextCursor
          ? true
          : safePage * pageSize < totalCount,
        limit: pageSize,
        offset: (safePage - 1) * pageSize,
        nextCursor: nextCursor || null,
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST - Create new article (admin only)
export async function POST(request) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth();

    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      excerpt,
      category,
      tags,
      featured_image_url,
      is_featured,
      social_media_embeds,
      status,
      selectedSubreddits,
    } = body || {};

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedCategory = typeof category === 'string' ? category.trim() : '';
    const contentValue = sanitizeArticleHtml(typeof content === 'string' ? content : '');

    if (!trimmedTitle || !contentValue.trim() || !trimmedCategory) {
      return Response.json(
        { success: false, error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    const normalizedStatus = String(status || 'draft').trim().toLowerCase();
    if (!ALLOWED_STATUSES.has(normalizedStatus)) {
      return Response.json(
        { success: false, error: 'Status must be draft, published, or archived' },
        { status: 400 }
      );
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string'
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const embeds = Array.isArray(social_media_embeds) ? social_media_embeds : [];
    const imageUrl =
      typeof featured_image_url === 'string' && featured_image_url.trim()
        ? featured_image_url.trim()
        : null;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: trimmedTitle,
        content: contentValue,
        excerpt:
          (typeof excerpt === 'string' && excerpt.trim()) ||
          `${contentValue.replace(/<[^>]+>/g, '').substring(0, 200)}...`,
        category: trimmedCategory,
        tags: normalizedTags,
        featured_image_url: imageUrl,
        is_featured: Boolean(is_featured),
        social_media_embeds: embeds,
        author_email: 'jain10gunjan@gmail.com',
        status: normalizedStatus,
      })
      .select()
      .single();

    if (error) throw error;

    if (data?.slug && normalizedStatus === 'published') {
      const outbox = await enqueueRedditOutbox({
        articleId: data.id,
        title: data.title,
        slug: data.slug,
        featuredImageUrl: data.featured_image_url || null,
        selectedSubreddits,
      });
      if (!outbox.ok) {
        console.error('[articles] publish outbox enqueue failed', outbox.error);
      }
    }

    revalidateArticlesCache({ slug: data?.slug });

    return Response.json({
      success: true,
      data,
      message: 'Article created successfully',
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to create article',
        message: error?.message || undefined,
      },
      { status: 500 }
    );
  }
}
