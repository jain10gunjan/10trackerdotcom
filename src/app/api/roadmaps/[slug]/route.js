import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { ROADMAP_PURCHASE_NOTICE, ROADMAP_DAYS_PAGE_SIZE } from '@/lib/roadmaps/constants';
import {
  buildRoadmapViewerPayload,
  normalizeSlug,
  ROADMAPS_SETUP_HINT,
} from '@/lib/roadmaps/roadmapService';

function parseDayQuery(searchParams) {
  const dayOffset = Math.max(0, Number(searchParams.get('dayOffset')) || 0);
  const dayLimit = Math.min(
    50,
    Math.max(1, Number(searchParams.get('dayLimit')) || ROADMAP_DAYS_PAGE_SIZE)
  );
  const focusArea = searchParams.get('focus')?.trim() || null;
  const search = searchParams.get('search')?.trim() || null;
  return { dayOffset, dayLimit, focusArea, search };
}

export async function GET(request, { params }) {
  try {
    const { slug: slugParam } = await params;
    const slug = normalizeSlug(slugParam);
    const session = await auth();
    const email = normalizeEmail(session?.user?.email);

    const { searchParams } = new URL(request.url);
    const { dayOffset, dayLimit, focusArea, search } = parseDayQuery(searchParams);

    const detail = await buildRoadmapViewerPayload(slug, email, {
      dayOffset,
      dayLimit,
      focusArea,
      search,
    });

    if (!detail) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    if (!detail.roadmap.is_active && !detail.purchased) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    const res = NextResponse.json({
      success: true,
      ...detail,
      isAuthenticated: Boolean(email),
      noRefundsNotice: ROADMAP_PURCHASE_NOTICE,
    });

    res.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    return res;
  } catch (err) {
    console.error('GET /api/roadmaps/[slug]', err);
    const setup = err?.code === '42P01';
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to load roadmap',
        setupHint: setup ? ROADMAPS_SETUP_HINT : undefined,
      },
      { status: setup ? 503 : 500 }
    );
  }
}
