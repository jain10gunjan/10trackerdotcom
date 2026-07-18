import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { consumeCredits } from '@/features/credits/lib/walletService';
import { getPricingConfig } from '@/features/credits/lib/pricingService';

export async function POST(request) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const pricing = await getPricingConfig();
    const validTypes = Object.keys(pricing.costs || {});

    const body = await request.json();
    const type = body?.type;
    const referenceId = body?.referenceId ? String(body.referenceId) : null;
    const idempotencyKey = body?.idempotencyKey ? String(body.idempotencyKey) : null;

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Use: ${validTypes.join(', ')}` },
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
