import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Enqueue Reddit/SteinHQ delivery instead of fire-and-forget in-request posts.
 * @returns {Promise<{ ok: boolean, ids?: number[], error?: string }>}
 */
export async function enqueueRedditOutbox({
  articleId,
  title,
  slug,
  featuredImageUrl = null,
  selectedSubreddits = null,
}) {
  if (!articleId || !slug || !title) {
    return { ok: false, error: 'articleId, slug, and title are required' };
  }

  const link = `/articles/${slug}`;
  const rows = [];

  if (Array.isArray(selectedSubreddits) && selectedSubreddits.length > 0) {
    for (const subreddit of selectedSubreddits) {
      if (!subreddit?.name) continue;
      rows.push({
        article_id: articleId,
        payload: {
          title,
          link,
          subreddit: subreddit.name,
          flairID: subreddit.flairID || null,
          imageurl: featuredImageUrl || null,
        },
        status: 'pending',
        attempts: 0,
      });
    }
  } else {
    rows.push({
      article_id: articleId,
      payload: {
        title,
        link,
        subreddit: null,
        flairID: null,
        imageurl: featuredImageUrl || null,
      },
      status: 'pending',
      attempts: 0,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: 'No outbox rows to insert' };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('article_reddit_outbox')
      .insert(rows)
      .select('id');

    if (error) throw error;
    console.info('[articles] enqueued reddit outbox', {
      articleId,
      count: data?.length || rows.length,
    });
    return { ok: true, ids: (data || []).map((r) => r.id) };
  } catch (error) {
    console.error('[articles] enqueueRedditOutbox failed', error);
    return { ok: false, error: error?.message || 'Failed to enqueue outbox' };
  }
}
