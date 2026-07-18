import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';
import { ensureMirroredGateImage } from '@/features/practice/lib/server/gateImageMirror';
import { logPracticeMetric } from '@/lib/practiceMetrics';

export async function POST(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  const limit = checkApiRateLimit(email, 'practice-mirror-image', {
    windowMs: 60_000,
    max: 30,
  });
  if (!limit.ok) {
    const r = rateLimitResponse(limit);
    return NextResponse.json(r.body, { status: r.status, headers: r.headers });
  }

  try {
    const body = await request.json();
    const url = body?.url;
    if (!url) {
      return NextResponse.json({ success: false, error: 'url required' }, { status: 400 });
    }
    const publicUrl = await ensureMirroredGateImage(url);
    if (!publicUrl) {
      logPracticeMetric('image_mirror_failed', { url });
      return NextResponse.json({ success: false, error: 'Mirror failed' }, { status: 502 });
    }
    logPracticeMetric('image_mirror_ok', {});
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Mirror failed' },
      { status: 500 }
    );
  }
}
