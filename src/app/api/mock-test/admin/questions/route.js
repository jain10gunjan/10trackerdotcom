import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseServer } from '@/lib/supabaseServer';

function normalizeCategory(param) {
  if (!param || typeof param !== 'string') return 'GATE-CSE';
  return param.trim().toUpperCase().replace(/_/g, '-');
}

function sanitizeSearchTerm(term) {
  return String(term).replace(/[%_(),."'\\]/g, '').trim().slice(0, 80);
}

export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServer(true);
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const category = normalizeCategory(categoryParam);
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const excludeIds = searchParams.get('excludeIds');

    let query = supabase
      .from('examtracker')
      .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject, chapter', { count: 'exact' })
      .eq('category', category);

    if (subject && subject !== 'all') query = query.eq('subject', subject);
    if (topic && topic !== 'all') query = query.eq('topic', topic);
    if (chapter && chapter.trim() !== '') query = query.eq('chapter', chapter.trim());
    if (difficulty && difficulty !== 'all') query = query.eq('difficulty', difficulty);
    if (search && search.trim()) {
      const safe = sanitizeSearchTerm(search);
      if (safe) query = query.or(`question.ilike.%${safe}%,topic.ilike.%${safe}%`);
    }
    if (excludeIds) {
      const excludeArray = excludeIds.split(',').filter((id) => id.trim());
      if (excludeArray.length > 0) query = query.not('_id', 'in', `(${excludeArray.join(',')})`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: questions, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      questions: questions || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const { action, examCategory } = await request.json();

    if (action === 'fetch-all-questions') {
      try {
        const supabase = getSupabaseServer(true);
        // Fetch questions from examtracker table
        let query = supabase
          .from('examtracker')
          .select('*')
          .order('year', { ascending: false });

        // If examCategory is specified, filter by it
        if (examCategory && examCategory !== 'all') {
          query = query.eq('category', examCategory.toUpperCase());
        }

        const { data: questions, error: fetchError } = await query;

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
          return NextResponse.json({ 
            success: false, 
            error: `Database fetch failed: ${fetchError.message}` 
          });
        }

        console.log(`Successfully fetched ${questions?.length || 0} questions from database`);
        
        return NextResponse.json({
          success: true,
          questions: questions || [],
          count: questions?.length || 0
        });

      } catch (dbError) {
        console.error('Database operation error:', dbError);
        return NextResponse.json({ 
          success: false, 
          error: `Database operation failed: ${dbError.message}` 
        });
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    });

  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
