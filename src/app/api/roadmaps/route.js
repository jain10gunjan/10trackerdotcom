import { NextResponse } from 'next/server';
import { fetchRoadmapCatalog } from '@/lib/roadmaps/fetchRoadmapCatalog';
import { ROADMAP_CATALOG_DISCLAIMER } from '@/lib/roadmaps/constants';
import { ROADMAPS_SETUP_HINT } from '@/lib/roadmaps/roadmapService';

export async function GET() {
  try {
    const { roadmaps, setupRequired } = await fetchRoadmapCatalog();
    if (setupRequired) {
      return NextResponse.json(
        {
          success: false,
          error: 'Roadmaps database not configured',
          setupHint: ROADMAPS_SETUP_HINT,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      roadmaps,
      disclaimer: ROADMAP_CATALOG_DISCLAIMER,
    });
  } catch (err) {
    console.error('GET /api/roadmaps', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load roadmaps' },
      { status: 500 }
    );
  }
}
