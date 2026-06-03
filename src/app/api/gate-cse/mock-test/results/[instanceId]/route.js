import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { instanceId } = await params;
    const supabase = getSupabaseServer();

    const { data: attempt, error } = await supabase
      .from('user_test_attempts')
      .select(`
        *,
        mock_tests ( id, name, description, duration, total_questions, difficulty, category )
      `)
      .eq('id', instanceId)
      .eq('user_email', userEmail)
      .eq('is_completed', true)
      .single();

    if (error || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      instance: attempt,
      test: attempt.mock_tests,
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
