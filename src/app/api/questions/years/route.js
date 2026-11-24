import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'cattracker-years' } }
  }
);

// Cached function to get available years for a topic/category/difficulty
const getCachedYears = unstable_cache(
  async (category, pagetopic, difficulty) => {
    try {
      const { data, error } = await supabase
        .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
        .select('year')
        .eq('topic', pagetopic)
        .eq('category', category.toUpperCase())
        .eq('difficulty', difficulty)
        .not('year', 'is', null);

      if (error) throw error;

      // Extract unique years and sort them
      const uniqueYears = [...new Set(data?.map(item => item.year).filter(Boolean))];
      
      // Sort years: try to extract numeric year, otherwise string sort
      uniqueYears.sort((a, b) => {
        const yearA = String(a).match(/\d{4}/);
        const yearB = String(b).match(/\d{4}/);
        
        if (yearA && yearB) {
          return parseInt(yearB[0]) - parseInt(yearA[0]); // Descending (newest first)
        }
        return String(b).localeCompare(String(a)); // Fallback to string comparison
      });

      return uniqueYears;
    } catch (error) {
      console.error('Error fetching years:', error);
      return [];
    }
  },
  ['question-years'], // Cache key prefix
  {
    tags: ['examtracker'],
    revalidate: 300, // Cache for 5 minutes
  }
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const pagetopic = searchParams.get('pagetopic');
    const difficulty = searchParams.get('difficulty');

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

    const years = await getCachedYears(category, pagetopic, difficulty);

    return NextResponse.json(
      { years },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error in years API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch years' },
      { status: 500 }
    );
  }
}


