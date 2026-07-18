import { NextResponse } from 'next/server';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';
import { logPracticeMetric } from '@/lib/practiceMetrics';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';

export async function POST(request) {
  // Soft auth: prefer session key for rate limit; allow beacon without cookie using IP
  const session = await requireSessionEmail();
  const key = session.email || request.headers.get('x-forwarded-for') || 'anon';

  const limit = checkApiRateLimit(key, 'practice-metrics', {
    windowMs: 60_000,
    max: 120,
  });
  if (!limit.ok) {
    const r = rateLimitResponse(limit);
    return NextResponse.json(r.body, { status: r.status, headers: r.headers });
  }

  try {
    let body;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }
    logPracticeMetric(body.event || 'client_metric', {
      ...(body.payload || {}),
      clientTs: body.ts,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
