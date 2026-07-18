import { NextResponse } from 'next/server';
import { fetchRoadmapCatalogPage } from '@/features/roadmaps/lib/fetchRoadmapCatalog';
import { ROADMAP_CATALOG_DISCLAIMER } from '@/features/roadmaps/lib/constants';
import { ROADMAPS_SETUP_HINT } from '@/features/roadmaps/lib/roadmapService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || undefined;
    const searchTerm = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    const sortBy = searchParams.get('sort') || 'featured';

    const { roadmaps, setupRequired, pagination, error } = await fetchRoadmapCatalogPage({
      page,
      limit,
      searchTerm,
      category,
      sortBy,
    });

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

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    const res = NextResponse.json({
      success: true,
      roadmaps,
      pagination,
      disclaimer: ROADMAP_CATALOG_DISCLAIMER,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return res;
  } catch (err) {
    console.error('GET /api/roadmaps', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load roadmaps' },
      { status: 500 }
    );
  }
}
