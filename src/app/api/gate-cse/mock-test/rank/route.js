import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSupabaseServer } from '@/lib/supabaseServer';

/**
 * GET ?testId=<uuid> — percentile vs other completed attempts on this test.
 */
export async function GET(request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    if (!testId) {
      return NextResponse.json({ error: 'testId query param is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: attempts, error } = await supabase
      .from('user_test_attempts')
      .select('user_email, percentage, score')
      .eq('test_id', testId)
      .eq('is_completed', true);

    if (error) throw error;
    if (!attempts?.length) {
      return NextResponse.json({
        success: true,
        percentile: null,
        message: 'No completed attempts yet for this test',
        totalAttempts: 0,
      });
    }

    const userAttempts = attempts.filter((a) => a.user_email === userEmail);
    if (userAttempts.length === 0) {
      return NextResponse.json({
        success: true,
        percentile: null,
        message: 'You have not completed this test yet',
        totalAttempts: attempts.length,
      });
    }

    const bestUserScore = Math.max(
      ...userAttempts.map((a) => Number(a.percentage ?? a.score) || 0)
    );

    const scores = attempts.map((a) => Number(a.percentage ?? a.score) || 0);
    const below = scores.filter((s) => s < bestUserScore).length;
    const percentile =
      scores.length > 1 ? Math.round((below / scores.length) * 10000) / 100 : 100;

    return NextResponse.json({
      success: true,
      percentile,
      yourBestPercentage: bestUserScore,
      totalAttempts: scores.length,
      uniqueStudents: new Set(attempts.map((a) => a.user_email)).size,
    });
  } catch (error) {
    console.error('Rank error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
