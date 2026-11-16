import { NextResponse } from 'next/server';
import { exchangeConnectCode } from '@/features/extension-auth/lib/tokenService';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = body.code;
    const label = body.label;

    if (!code) {
      return NextResponse.json({ success: false, error: 'code required' }, { status: 400 });
    }

    const limitKey = String(code).slice(0, 16);
    const limit = checkApiRateLimit(limitKey, 'extension-auth-exchange', {
      windowMs: 60_000,
      max: 20,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const issued = await exchangeConnectCode(code, { label });

    return NextResponse.json({
      success: true,
      token: issued.token,
      email: issued.email,
      expiresAt: issued.expiresAt,
      tokenId: issued.tokenId,
    });
  } catch (err) {
    console.error('extension/auth/exchange', err);
    const status = err.status || (/Invalid|expired|used/i.test(err.message || '') ? 401 : 500);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to exchange code' },
      { status }
    );
  }
}
