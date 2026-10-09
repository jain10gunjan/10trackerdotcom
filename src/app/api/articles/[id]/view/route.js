import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const COOKIE = 'aviews';
const COOKIE_MAX_IDS = 60;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function parseArticleId(rawId) {
  const id = String(rawId ?? '').trim();
  if (!/^\d+$/.test(id)) return null;
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readSeenIds(request) {
  const raw = request.cookies.get(COOKIE)?.value || '';
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part));
}

function withSeenCookie(response, seenIds, articleId) {
  const next = [...seenIds.filter((id) => id !== String(articleId)), String(articleId)].slice(
    -COOKIE_MAX_IDS
  );
  response.cookies.set(COOKIE, next.join(','), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

async function incrementPublishedView(supabase, articleId) {
  const { data, error } = await supabase.rpc('increment_article_view', {
    p_article_id: articleId,
  });

  if (!error) {
    if (data == null) return null;
    const count = Number(data);
    return Number.isFinite(count) ? count : null;
  }

  const missingFn =
    error.code === 'PGRST202' ||
    /could not find the function|does not exist/i.test(error.message || '');
  if (!missingFn) throw error;

  const { data: row, error: readErr } = await supabase
    .from('articles')
    .select('id, view_count, status')
    .eq('id', articleId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!row || row.status !== 'published') return null;

  const next = (Number(row.view_count) || 0) + 1;
  const { error: upErr } = await supabase
    .from('articles')
    .update({ view_count: next })
    .eq('id', articleId)
    .eq('status', 'published');
  if (upErr) throw upErr;
  return next;
}

/** Record one page view for a published update. Same browser counts once per 12 hours. */
export async function POST(request, { params }) {
  try {
    const { id: rawId } = await params;
    const articleId = parseArticleId(rawId);
    if (!articleId) {
      return NextResponse.json({ success: false, error: 'Invalid article id' }, { status: 400 });
    }

    const seen = readSeenIds(request);
    if (seen.includes(String(articleId))) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('published_articles')
        .select('view_count')
        .eq('id', articleId)
        .maybeSingle();
      const viewCount = Number(data?.view_count);
      return NextResponse.json({
        success: true,
        counted: false,
        viewCount: Number.isFinite(viewCount) ? viewCount : null,
      });
    }

    const supabase = getSupabaseAdmin();
    const viewCount = await incrementPublishedView(supabase, articleId);
    if (viewCount == null) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      counted: true,
      viewCount,
    });
    return withSeenCookie(response, seen, articleId);
  } catch (error) {
    console.error('article page view', error);
    return NextResponse.json({ success: false, error: 'Could not record view' }, { status: 500 });
  }
}
