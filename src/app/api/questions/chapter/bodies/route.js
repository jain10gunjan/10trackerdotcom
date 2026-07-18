import { NextResponse } from 'next/server';
import { fetchChapterQuestionBodiesServer } from '@/features/practice/lib/server/chapterQuestions';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
  'Content-Type': 'application/json',
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || '';
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

    const ip = request.headers.get('x-forwarded-for') || 'anon';
    const limit = checkApiRateLimit(ip, 'chapter-bodies', { windowMs: 60_000, max: 60 });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    if (!ids.length) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }

    const result = await fetchChapterQuestionBodiesServer(ids);
    return NextResponse.json(result, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Chapter bodies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question bodies', details: error.message, questions: [] },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
