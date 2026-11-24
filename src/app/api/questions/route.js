import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client with connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'cattracker-questions' } }
  }
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const pagetopic = searchParams.get('pagetopic');

    if (!category || !pagetopic) {
      return NextResponse.json(
        { error: 'Missing required parameters: category and pagetopic' },
        { status: 400 }
      );
    }

    // Fetch counts and subjects in parallel
    const [countsResult, subjectsResult] = await Promise.all([
      // Get question counts by difficulty
      supabase
        .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
        .select('difficulty', { count: 'exact', head: true })
        .eq('topic', pagetopic)
        .eq('category', category.toUpperCase()),
      
      // Get unique subjects
      supabase
        .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
        .select('subject')
        .eq('topic', pagetopic)
        .eq('category', category.toUpperCase())
        .not('subject', 'is', null)
    ]);

    if (countsResult.error) throw countsResult.error;
    if (subjectsResult.error) throw subjectsResult.error;

    // Process counts
    const counts = { easy: 0, medium: 0, hard: 0 };
    countsResult.data?.forEach(item => {
      if (counts.hasOwnProperty(item.difficulty)) {
        counts[item.difficulty]++;
      }
    });

    // Process subjects
    const subjects = [...new Set(subjectsResult.data?.map(item => item.subject).filter(Boolean))];

    return NextResponse.json(
      { counts, subjects },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions data', details: error.message },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS preflight
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
