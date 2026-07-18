import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeArticleHtml } from '@/features/articles/lib/sanitizeArticleHtml';
import { enqueueRedditOutbox } from '@/features/articles/lib/enqueueRedditOutbox';
import { revalidateArticlesCache } from '@/features/articles/lib/revalidateArticlesCache';

const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);

/**
 * Shared insert path for admin + automation save pipelines.
 */
export async function savePublishedArticle({
  title,
  content,
  excerpt = null,
  category,
  tags = [],
  featured_image_url = null,
  is_featured = false,
  social_media_embeds = [],
  status = 'published',
  author_email = 'jain10gunjan@gmail.com',
  selectedSubreddits = null,
  enqueueReddit = true,
}) {
  const trimmedTitle = String(title || '').trim();
  const trimmedCategory = String(category || '').trim();
  const sanitizedContent = sanitizeArticleHtml(content || '');
  const normalizedStatus = String(status || 'published').trim().toLowerCase();

  if (!trimmedTitle || !sanitizedContent.trim() || !trimmedCategory) {
    return { ok: false, error: 'Title, content, and category are required' };
  }
  if (!ALLOWED_STATUSES.has(normalizedStatus)) {
    return { ok: false, error: 'Invalid status' };
  }

  const normalizedTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean)
    : typeof tags === 'string'
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const plainExcerpt =
    (typeof excerpt === 'string' && excerpt.trim()) ||
    `${sanitizedContent.replace(/<[^>]+>/g, '').substring(0, 200)}...`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('articles')
    .insert({
      title: trimmedTitle,
      content: sanitizedContent,
      excerpt: plainExcerpt,
      category: trimmedCategory,
      tags: normalizedTags,
      featured_image_url: featured_image_url || null,
      is_featured: Boolean(is_featured),
      social_media_embeds: Array.isArray(social_media_embeds) ? social_media_embeds : [],
      author_email,
      status: normalizedStatus,
    })
    .select()
    .single();

  if (error) {
    console.error('[articles] savePublishedArticle insert failed', error);
    return { ok: false, error: error.message || 'Insert failed' };
  }

  if (enqueueReddit && data?.slug && normalizedStatus === 'published') {
    const outbox = await enqueueRedditOutbox({
      articleId: data.id,
      title: data.title,
      slug: data.slug,
      featuredImageUrl: data.featured_image_url || null,
      selectedSubreddits,
    });
    if (!outbox.ok) {
      console.error('[articles] savePublishedArticle outbox failed', outbox.error);
    }
  }

  revalidateArticlesCache({ slug: data?.slug });

  return { ok: true, data };
}
