import { NextResponse } from 'next/server';
import { listActiveRoadmaps, ROADMAPS_SETUP_HINT } from '@/lib/roadmaps/roadmapService';

export async function GET() {
  try {
    const { roadmaps, setupRequired, error } = await listActiveRoadmaps();
    if (setupRequired) {
      return NextResponse.json({
        success: false,
        error: 'Roadmaps database not configured',
        setupHint: ROADMAPS_SETUP_HINT,
      }, { status: 503 });
    }
    if (error) throw error;

    return NextResponse.json({
      success: true,
      roadmaps,
      disclaimer:
        'Unlimited plans cover practice & mock tests; roadmaps are separate one-time products. All sales are final — no refunds.',
    });
  } catch (err) {
    console.error('GET /api/roadmaps', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load roadmaps' },
      { status: 500 }
    );
  }
}
