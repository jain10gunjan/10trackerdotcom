import { NextResponse } from 'next/server';
import { fetchChapterCountsServer } from '@/features/practice/lib/server/chapterQuestions';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
  'Content-Type': 'application/json',
};

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anon';
    const limit = checkApiRateLimit(ip, 'chapter-counts', { windowMs: 60_000, max: 120 });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const chapter = searchParams.get('chapter');

    if (!category || !chapter) {
      return NextResponse.json(
        { error: 'Missing required parameters: category and chapter' },
        { status: 400 }
      );
    }

    const result = await fetchChapterCountsServer(category, chapter);
    return NextResponse.json(result, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Chapter counts API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch counts',
        details: error.message,
        counts: { easy: 0, medium: 0, hard: 0 },
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
      },
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
