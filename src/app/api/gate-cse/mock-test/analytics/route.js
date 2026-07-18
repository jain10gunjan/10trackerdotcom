import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';

/**
 * GET ?testId= | ?examCategory=gate-cse — aggregate stats from user_test_attempts.
 */
export async function GET(request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const examCategory = searchParams.get('examCategory') || 'gate-cse';

    const supabase = getSupabaseServer();

    let query = supabase
      .from('user_test_attempts')
      .select(
        'id, test_id, user_email, percentage, score, correct_answers, wrong_answers, unanswered, duration_taken, submitted_at, examcategory'
      )
      .eq('is_completed', true);

    if (testId) {
      query = query.eq('test_id', testId);
    }

    const { data: attempts, error } = await query.limit(500);
    if (error) throw error;

    const variants = getCategoryVariants(examCategory);
    const filtered = (attempts || []).filter((a) => {
      if (testId) return true;
      if (!a.examcategory) return false;
      const ec = String(a.examcategory).toUpperCase();
      return variants.some((v) => ec === v.toUpperCase() || ec.replace(/-/g, '_') === v.replace(/-/g, '_'));
    });

    if (filtered.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalAttempts: 0,
          uniqueStudents: 0,
          averagePercentage: 0,
          averageScore: 0,
        },
      });
    }

    const percentages = filtered.map((a) => Number(a.percentage ?? a.score) || 0);
    const avgPct = percentages.reduce((s, p) => s + p, 0) / percentages.length;

    const userFiltered = userEmail
      ? filtered.filter((a) => a.user_email === userEmail)
      : [];

    return NextResponse.json({
      success: true,
      analytics: {
        totalAttempts: filtered.length,
        uniqueStudents: new Set(filtered.map((a) => a.user_email)).size,
        averagePercentage: Math.round(avgPct * 100) / 100,
        averageScore: Math.round(avgPct * 100) / 100,
        yourAttempts: userFiltered.length,
        yourAveragePercentage:
          userFiltered.length > 0
            ? Math.round(
                (userFiltered.reduce((s, a) => s + (Number(a.percentage ?? a.score) || 0), 0) /
                  userFiltered.length) *
                  100
              ) / 100
            : null,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
