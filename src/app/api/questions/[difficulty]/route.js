import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client with connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'cattracker-difficulty' } }
  }
);

export async function GET(request, { params }) {
  try {
    const { difficulty } = params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const pagetopic = searchParams.get('pagetopic');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!category || !pagetopic || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required parameters: category, pagetopic, and difficulty' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch questions with pagination
    const { data: questions, error, count } = await supabase
      .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
      .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, difficulty, subject, year, category, created_at', { count: 'exact' })
      .eq('topic', pagetopic)
      .eq('category', category.toUpperCase())
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const hasMore = (questions?.length || 0) === limit;
    const totalCount = count || 0;

    return NextResponse.json(
      { 
        questions: questions || [], 
        hasMore, 
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Difficulty questions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: error.message },
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
