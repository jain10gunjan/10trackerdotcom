import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { toLegacyGateTestShape } from '@/lib/mockTestQueries';

export async function GET(request, { params }) {
  try {
    const { testId } = await params;
    const supabase = getSupabaseServer();

    const { data: test, error } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .eq('is_active', true)
      .single();

    if (error || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const { count } = await supabase
      .from('user_test_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', testId)
      .eq('is_completed', true);

    const shaped = toLegacyGateTestShape({
      id: test.id,
      name: test.name,
      description: test.description,
      totalQuestions: test.total_questions,
      duration: test.duration,
      difficulty: test.difficulty,
      createdAt: test.created_at,
      questionCount: test.total_questions,
      attemptCount: count || 0,
      isActive: test.is_active,
    });

    return NextResponse.json({ success: true, test: shaped });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
