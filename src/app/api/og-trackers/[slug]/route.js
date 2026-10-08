import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import {
  getPathBySlug,
  signBeaconPayload,
  OG_TRACKERS_SETUP_HINT,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const session = await requireSessionEmail();
    const email = session.error ? null : session.email;

    const result = await getPathBySlug(slug, email);
    if (result.setupRequired) {
      return NextResponse.json({
        success: false,
        setupRequired: true,
        setupHint: OG_TRACKERS_SETUP_HINT,
      });
    }
    if (!result.path) {
      return NextResponse.json({ success: false, error: 'Path not found' }, { status: 404 });
    }

    let beaconTokens = {};
    if (email) {
      for (const r of result.resources || []) {
        if (r.type === 'VIDEO' && !r.locked && r.youtubeVideoId) {
          beaconTokens[r.id] = signBeaconPayload({
            email,
            resourceId: r.id,
            percentWatched: r.progress?.percentWatched || 0,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      beaconTokens,
    });
  } catch (err) {
    console.error('og-trackers/[slug] GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load path' },
      { status: 500 }
    );
  }
}
