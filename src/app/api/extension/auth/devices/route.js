import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { listTokensForEmail } from '@/features/extension-auth/lib/tokenService';

export async function GET() {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const tokens = await listTokensForEmail(email);
    return NextResponse.json({
      success: true,
      devices: tokens.map((t) => ({
        id: t.id,
        label: t.label,
        createdAt: t.created_at,
        lastUsedAt: t.last_used_at,
        expiresAt: t.expires_at,
        revoked: Boolean(t.revoked_at),
        active: !t.revoked_at && new Date(t.expires_at).getTime() > Date.now(),
      })),
    });
  } catch (err) {
    console.error('extension/auth/devices', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list devices' },
      { status: 500 }
    );
  }
}
