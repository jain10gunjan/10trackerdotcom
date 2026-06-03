import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/lib/credits/requireSession';
import { consumeCredits } from '@/lib/credits/walletService';
import { CREDIT_COST } from '@/lib/credits/constants';

const VALID_TYPES = Object.keys(CREDIT_COST);

export async function POST(request) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const body = await request.json();
    const type = body?.type;
    const referenceId = body?.referenceId ? String(body.referenceId) : null;
    const idempotencyKey = body?.idempotencyKey ? String(body.idempotencyKey) : null;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Use: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await consumeCredits(email, type, { referenceId, idempotencyKey });

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          reason: result.reason,
          credits: result.credits ?? 0,
          cost: result.cost,
          needsSubscription: result.reason === 'insufficient_credits',
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      unlimited: result.unlimited,
      credits: result.credits,
      cost: result.cost,
      duplicate: result.duplicate,
    });
  } catch (err) {
    console.error('credits/consume', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to consume credits' },
      { status: 500 }
    );
  }
}
