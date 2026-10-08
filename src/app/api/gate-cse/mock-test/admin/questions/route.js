import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const excludeIds = searchParams.get('excludeIds');

    let query = supabase
      .from('examtracker')
      .select(
        '_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject',
        { count: 'exact' }
      )
      .eq('category', 'GATE-CSE');

    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    if (topic && topic !== 'all') {
      query = query.eq('topic', topic);
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    if (search && search.trim()) {
      query = query.or(`question.ilike.%${search}%,topic.ilike.%${search}%`);
    }

    if (excludeIds) {
      const excludeArray = excludeIds.split(',').filter((id) => id.trim());
      if (excludeArray.length > 0) {
        query = query.not('_id', 'in', `(${excludeArray.join(',')})`);
      }
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
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { testId, questions } = body;

    if (!testId || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Missing required fields: testId and questions array' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const testQuestions = questions.map((q, index) => ({
      test_id: testId,
      question_id: q._id,
      question_order: index + 1,
      subject: q.subject || 'Unknown',
      topic: q.topic || '',
      difficulty: q.difficulty || 'medium',
    }));

    const { error: questionsError } = await supabase
      .from('mock_test_questions')
      .insert(testQuestions);

    if (questionsError) {
      console.error('Error saving questions:', questionsError);
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Questions saved successfully',
      count: questions.length,
    });
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
