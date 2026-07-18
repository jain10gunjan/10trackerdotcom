import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { enqueueRedditOutbox } from '@/features/articles/lib/enqueueRedditOutbox';
import { revalidateArticlesCache } from '@/features/articles/lib/revalidateArticlesCache';

const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);

function parseArticleId(rawId) {
  const id = String(rawId ?? '').trim();
  if (!/^\d+$/.test(id)) return null;
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeTags(tags) {
  if (tags === undefined) return undefined;
  if (tags === null) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeEmbeds(embeds) {
  if (embeds === undefined) return undefined;
  if (embeds === null) return [];
  if (typeof embeds === 'string') {
    try {
      const parsed = JSON.parse(embeds);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(embeds) ? embeds : [];
}

function buildUpdateData(body) {
  const {
    title,
    content,
    excerpt,
    category,
    tags,
    featured_image_url,
    is_featured,
    status,
    social_media_embeds,
  } = body;

  const updateData = {};

  if (title !== undefined) {
    const trimmed = String(title).trim();
    if (!trimmed) {
      return { error: 'Title cannot be empty' };
    }
    updateData.title = trimmed;
  }

  if (content !== undefined) {
    const value = sanitizeArticleHtml(String(content));
    if (!value.trim()) {
      return { error: 'Content cannot be empty' };
    }
    updateData.content = value;
  }

  if (excerpt !== undefined) {
    updateData.excerpt = excerpt === null ? null : String(excerpt).trim() || null;
  }

  if (category !== undefined) {
    const trimmed = String(category).trim();
    if (!trimmed) {
      return { error: 'Category cannot be empty' };
    }
    updateData.category = trimmed;
  }

  if (tags !== undefined) {
    updateData.tags = normalizeTags(tags);
  }

  if (featured_image_url !== undefined) {
    const url = featured_image_url === null ? '' : String(featured_image_url).trim();
    updateData.featured_image_url = url || null;
  }

  if (typeof is_featured === 'boolean') {
    updateData.is_featured = is_featured;
  }

  if (status !== undefined) {
    const normalized = String(status).trim().toLowerCase();
    if (!ALLOWED_STATUSES.has(normalized)) {
      return { error: 'Status must be draft, published, or archived' };
    }
    updateData.status = normalized;
  }

  if (social_media_embeds !== undefined) {
    updateData.social_media_embeds = normalizeEmbeds(social_media_embeds);
  }

  if (Object.keys(updateData).length === 0) {
    return { error: 'No valid fields provided to update' };
  }

  return { updateData };
}

// GET - Fetch single article by ID or slug
// Admins can fetch any status. Public only gets published. No view_count writes.
export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params;
    const supabase = getSupabaseAdmin();
    const { isAdmin } = await verifyAdminAuth();
    const numericId = parseArticleId(rawId);
    const isNumeric = numericId !== null;

    if (isAdmin) {
      let query = supabase.from('articles').select('*');
      query = isNumeric ? query.eq('id', numericId) : query.eq('slug', rawId);
      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Response.json(
            { success: false, error: 'Article not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return Response.json({ success: true, data });
    }

    let query = supabase.from('published_articles').select('*');
    query = isNumeric ? query.eq('id', numericId) : query.eq('slug', rawId);
    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { success: false, error: 'Article not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return Response.json(
      { success: false, error: 'Article not found' },
      { status: 404 }
    );
  }
}

// PUT - Update article (admin only)
export async function PUT(request, { params }) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth();

    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: rawId } = await params;
    const articleId = parseArticleId(rawId);
    if (articleId === null) {
      return Response.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
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

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        { success: false, error: 'Request body must be an object' },
        { status: 400 }
      );
    }

    const built = buildUpdateData(body);
    if (built.error) {
      return Response.json({ success: false, error: built.error }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('id, status, slug, title, featured_image_url')
      .eq('id', articleId)
      .single();

    if (currentError || !currentArticle) {
      return Response.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('articles')
      .update(built.updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          {
            success: false,
            error:
              'Article could not be updated. It may be missing, or database RLS is blocking the write. Set a valid SUPABASE_SERVICE_ROLE_KEY (service_role JWT) in .env.local.',
          },
          { status: 403 }
        );
      }
      throw error;
    }
    if (!data) {
      return Response.json(
        { success: false, error: 'Article not found or update blocked' },
        { status: 404 }
      );
    }

    const previousStatus = currentArticle.status;
    const nextStatus = data.status;
    const isPublishingNow =
      nextStatus === 'published' && previousStatus !== 'published';

    if (isPublishingNow && data.slug) {
      const outbox = await enqueueRedditOutbox({
        articleId: data.id,
        title: data.title,
        slug: data.slug,
        featuredImageUrl: data.featured_image_url || null,
        selectedSubreddits: body.selectedSubreddits,
      });
      if (!outbox.ok) {
        console.error('[articles] publish outbox enqueue failed', outbox.error);
      }
    }

    revalidateArticlesCache({ slug: data.slug || currentArticle.slug });

    return Response.json({
      success: true,
      data,
      message: 'Article updated successfully',
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to update article',
        message: error?.message || undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete article (admin only)
export async function DELETE(request, { params }) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth();

    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: rawId } = await params;
    const articleId = parseArticleId(rawId);
    if (articleId === null) {
      return Response.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from('articles')
      .select('id, slug')
      .eq('id', articleId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      return Response.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase.from('articles').delete().eq('id', articleId);

    if (error) throw error;

    revalidateArticlesCache({ slug: existing.slug });

    return Response.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to delete article',
        message: error?.message || undefined,
      },
      { status: 500 }
    );
  }
}
