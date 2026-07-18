import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getLeaderboardForExam } from '@/features/dashboard/lib/dashboardService';

export async function GET(request) {
  try {
    const session = await auth();
    const userEmail = normalizeEmail(session?.user?.email);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exam = String(searchParams.get('exam') || '').trim().toLowerCase();
    if (!exam) {
      return NextResponse.json({ success: false, error: 'exam is required' }, { status: 400 });
    }

    const leaderboard = await getLeaderboardForExam(userEmail, exam);

    return NextResponse.json({
      success: true,
      exam,
      leaderboard,
    });
  } catch (err) {
    console.error('user/dashboard/leaderboard', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
