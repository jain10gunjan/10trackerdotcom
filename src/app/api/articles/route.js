import { verifyAdminAuth } from '@/middleware/adminAuth';
import { postToSteinHQ } from '@/lib/steinhq';
import { createClient } from '@supabase/supabase-js';
import { safeArticlePage, sanitizeSearchQuery } from '@/lib/articles/categoryMeta';
import { fetchArticlesList } from '@/lib/articles/fetchCategoryArticles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_API_LIMIT = 50;

// GET - Fetch published articles (public, paginated)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const query = sanitizeSearchQuery(searchParams.get('q') || searchParams.get('query'));

    const limit = Math.min(
      MAX_API_LIMIT,
      Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10) || 10)
    );
    const offset = Math.max(0, Number.parseInt(searchParams.get('offset') || '0', 10) || 0);
    const page = searchParams.has('page')
      ? safeArticlePage(searchParams.get('page'))
      : Math.floor(offset / limit) + 1;

    const { articles, totalCount, page: safePage, pageSize } = await fetchArticlesList({
      page,
      pageSize: limit,
      category,
      query,
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
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, category, tags, featured_image_url, is_featured, social_media_embeds, status, selectedSubreddits } = body;

    if (!title || !content || !category) {
      return Response.json(
        { success: false, error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        tags: tags || [],
        featured_image_url,
        is_featured: is_featured || false,
        social_media_embeds: social_media_embeds || [],
        author_email: 'jain10gunjan@gmail.com',
        status: status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Post to SteinHQ after successful article creation (only if published)
    if (data && data.slug && status === 'published') {
      const articleLink = `/articles/${data.slug}`;
      
      // If subreddits are selected, post to each one
      if (selectedSubreddits && Array.isArray(selectedSubreddits) && selectedSubreddits.length > 0) {
        selectedSubreddits.forEach((subreddit) => {
          postToSteinHQ(
            data.title,
            articleLink,
            subreddit.name,
            subreddit.flairID,
            data.featured_image_url || null
          ).catch(err => {
            console.error(`Failed to post to SteinHQ for ${subreddit.name} (non-blocking):`, err);
          });
        });
      } else {
        // If no subreddits selected, post with null values (original behavior)
        postToSteinHQ(
          data.title,
          articleLink,
          null,
          null,
          data.featured_image_url || null
        ).catch(err => {
          console.error('Failed to post to SteinHQ (non-blocking):', err);
        });
      }
    }

    return Response.json({
      success: true,
      data,
      message: 'Article created successfully'
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return Response.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
