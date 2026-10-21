import { NextResponse } from 'next/server';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { handleJudge0Webhook } from '@/features/coding-contests/lib/webhookHandler';
import { logContest } from '@/features/coding-contests/lib/logger';
import { getClientIp } from '@/features/coding-contests/lib/security';
import { RATE_LIMITS, checkRateLimit } from '@/features/coding-contests/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getDb() {
  if (!isValidServiceRoleKey()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for Judge0 webhook');
  }
  return getSupabaseServer(true);
}

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const supabase = getDb();
    const ip = getClientIp(request);
    const rl = await checkRateLimit(
      supabase,
      `webhook:ip:${ip}`,
      RATE_LIMITS.WEBHOOK_PER_IP_PER_MIN,
      60
    );
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const result = await handleJudge0Webhook(supabase, request, body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logContest('error', 'webhook_error', { error: err.message });
    return NextResponse.json({ success: false, error: 'Webhook failed' }, { status: 500 });
  }
}

/** Some Judge0 setups may GET the callback URL for health checks. */
export async function GET(request) {
  const { verifyWebhookSecret } = await import(
    '@/features/coding-contests/lib/webhookHandler'
  );
  const auth = verifyWebhookSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ success: true, ok: true });
}
