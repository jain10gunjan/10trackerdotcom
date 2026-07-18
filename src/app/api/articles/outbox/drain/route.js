import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { postToSteinHQ } from '@/lib/steinhq';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

const MAX_BATCH = 20;
const MAX_ATTEMPTS = 5;

/**
 * Drain pending Reddit/SteinHQ outbox rows.
 * Auth: admin session or x-automation-secret.
 * Optional cron: POST with secret header every few minutes.
 */
export async function POST(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }

  const supabase = getSupabaseAdmin();
  let limit = MAX_BATCH;

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.limit) {
      limit = Math.min(MAX_BATCH, Math.max(1, Number(body.limit) || MAX_BATCH));
    }
  } catch {
    // ignore body parse
  }

  const { data: rows, error } = await supabase
    .from('article_reddit_outbox')
    .select('id, article_id, payload, attempts')
    .eq('status', 'pending')
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[articles/outbox] fetch failed', error);
    return Response.json(
      { success: false, error: 'Failed to load outbox' },
      { status: 500 }
    );
  }

  const results = [];

  for (const row of rows || []) {
    const payload = row.payload || {};
    await supabase
      .from('article_reddit_outbox')
      .update({
        status: 'processing',
        attempts: (row.attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    try {
      const response = await postToSteinHQ(
        payload.title,
        payload.link,
        payload.subreddit || null,
        payload.flairID || null,
        payload.imageurl || null
      );

      if (response?.error) {
        throw new Error(response.error);
      }

      await supabase
        .from('article_reddit_outbox')
        .update({
          status: 'sent',
          last_error: null,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      results.push({ id: row.id, status: 'sent' });
    } catch (err) {
      const attempts = (row.attempts || 0) + 1;
      const failed = attempts >= MAX_ATTEMPTS;
      await supabase
        .from('article_reddit_outbox')
        .update({
          status: failed ? 'failed' : 'pending',
          last_error: err?.message || String(err),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      console.error('[articles/outbox] drain row failed', {
        id: row.id,
        error: err?.message,
      });
      results.push({
        id: row.id,
        status: failed ? 'failed' : 'retry',
        error: err?.message || String(err),
      });
    }
  }

  return Response.json({
    success: true,
    processed: results.length,
    results,
  });
}

export async function GET(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }

  const supabase = getSupabaseAdmin();
  const { count: pending } = await supabase
    .from('article_reddit_outbox')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: failed } = await supabase
    .from('article_reddit_outbox')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed');

  return Response.json({
    success: true,
    pending: pending ?? 0,
    failed: failed ?? 0,
    hint: 'POST this route (admin or x-automation-secret) to drain pending rows.',
  });
}
