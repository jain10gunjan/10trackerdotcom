import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { syncSingleResource } from '@/features/og-trackers/lib/judgeSync';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  const limit = checkApiRateLimit(email, 'og-sync-resource', {
    windowMs: 60_000,
    max: 30,
  });
  if (!limit.ok) {
    const r = rateLimitResponse(limit);
    return NextResponse.json(r.body, { status: r.status, headers: r.headers });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (!body.resourceId) {
      return NextResponse.json(
        { success: false, error: 'resourceId required' },
        { status: 400 }
      );
    }

    const result = await syncSingleResource(email, body.resourceId);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 400 }
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('og-trackers/sync/resource', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
