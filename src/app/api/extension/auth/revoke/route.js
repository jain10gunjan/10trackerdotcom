import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import {
  requireExtensionToken,
  revokeTokens,
} from '@/features/extension-auth/lib/tokenService';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Prefer Bearer (extension disconnect), fall back to web session (devices page)
    let email = null;
    let bearerRaw = null;

    const bearer = await requireExtensionToken(request);
    if (!bearer.error) {
      email = bearer.email;
      const header = request.headers.get('authorization') || '';
      bearerRaw = /^Bearer\s+(.+)$/i.exec(header)?.[1] || null;
    } else {
      const session = await requireSessionEmail();
      if (session.error) {
        return NextResponse.json(
          { success: false, error: session.error },
          { status: session.status }
        );
      }
      email = session.email;
    }

    const limit = checkApiRateLimit(email, 'extension-auth-revoke', {
      windowMs: 60_000,
      max: 30,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const result = await revokeTokens(email, {
      tokenId: body.tokenId || null,
      all: Boolean(body.all),
      bearerToken: !body.tokenId && !body.all ? bearerRaw : null,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('extension/auth/revoke', err);
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to revoke token' },
      { status }
    );
  }
}
