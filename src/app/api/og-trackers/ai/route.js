import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { createAiJob, listAiHome } from '@/features/og-trackers/lib/ai/aiPlaylistService';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function GET() {
  try {
    const session = await requireSessionEmail();
    if (session.error) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }
    const home = await listAiHome(session.email);
    return NextResponse.json({ success: true, ...home });
  } catch (err) {
    console.error('og-trackers/ai GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load AI trackers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await requireSessionEmail();
    if (session.error) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }
    const limit = checkApiRateLimit(session.email, 'og-ai-create', { windowMs: 60_000, max: 10 });
    if (!limit.ok) {
      const limited = rateLimitResponse(limit);
      return NextResponse.json(limited.body, { status: limited.status, headers: limited.headers });
    }
    const body = await request.json().catch(() => ({}));
    const result = await createAiJob(session.email, body.playlistUrl || body.url || '');
    if (!result.ok) {
      const status = result.code === 'setup_required' ? 503 : 400;
      return NextResponse.json(
        { success: false, error: result.error, code: result.code, entitlement: result.entitlement || null },
        { status }
      );
    }
    return NextResponse.json({ success: true, job: result.job, entitlement: result.entitlement });
  } catch (err) {
    console.error('og-trackers/ai POST', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to start generation' },
      { status: 500 }
    );
  }
}
