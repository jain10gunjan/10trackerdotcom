import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { syncTrackerProblems } from '@/features/og-trackers/lib/judgeSync';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  const limit = checkApiRateLimit(email, 'og-sync-me', {
    windowMs: 60_000,
    max: 4,
  });
  if (!limit.ok) {
    const r = rateLimitResponse(limit);
    return NextResponse.json(
      { ...r.body, error: 'Please wait before refreshing again' },
      { status: r.status, headers: r.headers }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const pathId = body.pathId || null;

    const result = await syncTrackerProblems(email, { pathId });
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 400 }
      );
    }
    return NextResponse.json({
      success: true,
      updated: result.updated,
      checked: result.checked,
      details: result.details,
    });
  } catch (err) {
    console.error('og-trackers/sync/me', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
