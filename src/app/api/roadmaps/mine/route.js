import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  listUserRoadmapSummaries,
  ROADMAPS_SETUP_HINT,
} from '@/features/roadmaps/lib/roadmapService';

export async function GET() {
  try {
    const session = await auth();
    const email = normalizeEmail(session?.user?.email);
    if (!email) {
      return NextResponse.json({ success: true, roadmaps: [], purchasedSlugs: [] });
    }

    const roadmaps = await listUserRoadmapSummaries(email);
    return NextResponse.json({
      success: true,
      roadmaps,
      purchasedSlugs: roadmaps.map((r) => r.slug),
    });
  } catch (err) {
    console.error('GET /api/roadmaps/mine', err);
    const setup = err?.code === '42P01';
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to load your roadmaps',
        setupHint: setup ? ROADMAPS_SETUP_HINT : undefined,
      },
      { status: setup ? 503 : 500 }
    );
  }
}
