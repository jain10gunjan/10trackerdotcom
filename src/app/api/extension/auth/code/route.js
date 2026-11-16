import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { createConnectCode } from '@/features/extension-auth/lib/tokenService';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const limit = checkApiRateLimit(email, 'extension-auth-code', {
      windowMs: 60_000,
      max: 10,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const body = await request.json().catch(() => ({}));
    const label = body.label || 'Chrome extension';

    const { code, expiresAt } = await createConnectCode(email, { label });

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      connectedPath: `/extension/connected?code=${encodeURIComponent(code)}`,
    });
  } catch (err) {
    console.error('extension/auth/code', err);
    const msg = err.message || 'Failed to create connect code';
    const status = /does not exist|not set up/i.test(msg) ? 503 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
