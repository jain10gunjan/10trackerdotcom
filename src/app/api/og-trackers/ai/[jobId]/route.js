import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { tickAiJob } from '@/features/og-trackers/lib/ai/aiPlaylistService';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function GET(_request, { params }) {
  try {
    const session = await requireSessionEmail();
    if (session.error) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }
    const limit = checkApiRateLimit(session.email, 'og-ai-tick', { windowMs: 60_000, max: 40 });
    if (!limit.ok) {
      const limited = rateLimitResponse(limit);
      return NextResponse.json(limited.body, { status: limited.status, headers: limited.headers });
    }
    const { jobId } = await params;
    const result = await tickAiJob(session.email, jobId);
    if (!result.ok && result.code === 'not_found') {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }
    return NextResponse.json({
      success: result.ok,
      job: result.job || null,
      error: result.error || null,
      code: result.code || null,
    });
  } catch (err) {
    console.error('og-trackers/ai/[jobId] GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to advance generation' },
      { status: 500 }
    );
  }
}
