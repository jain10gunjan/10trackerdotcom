import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { upsertProgress } from '@/features/og-trackers/lib/ogTrackerService';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const limit = checkApiRateLimit(email, 'og-progress', {
      windowMs: 60_000,
      max: 120,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const body = await request.json().catch(() => ({}));
    const resourceId = body.resourceId;
    const percentWatched = body.percentWatched;
    const progressStatus = body.status;

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'resourceId required' },
        { status: 400 }
      );
    }

    const row = await upsertProgress(email, {
      resourceId,
      percentWatched,
      status: progressStatus,
    });

    return NextResponse.json({ success: true, progress: row });
  } catch (err) {
    console.error('og-trackers/progress', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
