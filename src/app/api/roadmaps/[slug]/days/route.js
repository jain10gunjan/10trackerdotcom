import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { ROADMAP_DAYS_PAGE_SIZE } from '@/lib/roadmaps/constants';
import {
  fetchRoadmapDaysPage,
  normalizeSlug,
  ROADMAPS_SETUP_HINT,
} from '@/lib/roadmaps/roadmapService';

export async function GET(request, { params }) {
  try {
    const { slug: slugParam } = await params;
    const slug = normalizeSlug(slugParam);
    const session = await auth();
    const email = normalizeEmail(session?.user?.email);

    const { searchParams } = new URL(request.url);
    const dayOffset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const dayLimit = Math.min(
      50,
      Math.max(1, Number(searchParams.get('limit')) || ROADMAP_DAYS_PAGE_SIZE)
    );
    const focusArea = searchParams.get('focus')?.trim() || null;
    const search = searchParams.get('search')?.trim() || null;
    const dayNumber = searchParams.get('dayNumber');

    const result = await fetchRoadmapDaysPage(slug, email, {
      dayOffset,
      dayLimit,
      focusArea,
      search,
      dayNumber: dayNumber != null ? Number(dayNumber) : null,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    const res = NextResponse.json({ success: true, ...result });
    res.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    return res;
  } catch (err) {
    console.error('GET /api/roadmaps/[slug]/days', err);
    const setup = err?.code === '42P01';
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to load days',
        setupHint: setup ? ROADMAPS_SETUP_HINT : undefined,
      },
      { status: setup ? 503 : 500 }
    );
  }
}
