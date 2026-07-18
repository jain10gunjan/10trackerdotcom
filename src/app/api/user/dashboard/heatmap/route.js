import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getHeatmapForUser } from '@/features/dashboard/lib/dashboardService';

export async function GET(request) {
  try {
    const session = await auth();
    const userEmail = normalizeEmail(session?.user?.email);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const heatmapRange = searchParams.get('range') === '90d' ? '90d' : '12mo';

    const { heatmap, streak } = await getHeatmapForUser({
      userEmail,
      userId: session.user?.id,
      heatmapRange,
    });

    return NextResponse.json({ success: true, heatmap, streak });
  } catch (err) {
    console.error('user/dashboard/heatmap', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load activity heatmap' },
      { status: 500 }
    );
  }
}
