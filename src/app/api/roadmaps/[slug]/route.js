import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  buildRoadmapDetail,
  normalizeSlug,
  ROADMAPS_SETUP_HINT,
} from '@/lib/roadmaps/roadmapService';

export async function GET(_request, { params }) {
  try {
    const { slug: slugParam } = await params;
    const slug = normalizeSlug(slugParam);
    const session = await auth();
    const email = normalizeEmail(session?.user?.email);

    const detail = await buildRoadmapDetail(slug, email);
    if (!detail) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    if (!detail.roadmap.is_active && !detail.purchased) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...detail,
      isAuthenticated: Boolean(email),
      noRefundsNotice:
        'One-time purchase — lifetime access while 10Tracker operates. All sales are final; no refunds.',
    });
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
