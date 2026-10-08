import { NextResponse } from 'next/server';
import {
  upsertProgress,
  verifyBeaconToken,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function POST(request) {
  try {
    let token = null;
    let percentWatched = null;
    let resourceId = null;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      token = body.token;
      percentWatched = body.percentWatched;
      resourceId = body.resourceId;
    } else {
      const text = await request.text();
      try {
        const body = JSON.parse(text);
        token = body.token;
        percentWatched = body.percentWatched;
        resourceId = body.resourceId;
      } catch {
        const params = new URLSearchParams(text);
        token = params.get('token');
        percentWatched = params.get('percentWatched');
        resourceId = params.get('resourceId');
      }
    }

    const payload = token ? verifyBeaconToken(token) : null;
    if (!payload?.email || !payload?.resourceId) {
      return NextResponse.json({ success: false, error: 'Invalid beacon token' }, { status: 401 });
    }

    const rid = resourceId || payload.resourceId;
    const pct =
      percentWatched != null
        ? Number(percentWatched)
        : Number(payload.percentWatched) || 0;

    await upsertProgress(payload.email, {
      resourceId: rid,
      percentWatched: pct,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('og-trackers/progress/beacon', err);
    return NextResponse.json({ success: false, error: 'Beacon failed' }, { status: 500 });
  }
}
