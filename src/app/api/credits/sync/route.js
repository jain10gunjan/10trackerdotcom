import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/lib/credits/requireSession';
import { consumeCredits, getWalletSummary } from '@/lib/credits/walletService';
import { getPricingConfig } from '@/lib/credits/pricingService';

export async function POST(request) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      const summary = await getWalletSummary(email);
      return NextResponse.json({
        success: true,
        credits: summary.credits,
        unlimited: summary.unlimited,
        syncedKeys: [],
        failed: [],
      });
    }

    const pricing = await getPricingConfig();
    const costs = pricing.costs;

    const syncedKeys = [];
    const failed = [];
    let needsSubscription = false;

    for (const item of items.slice(0, 50)) {
      const type = item?.type;
      const referenceId = item?.referenceId ? String(item.referenceId) : null;
      const idempotencyKey = item?.idempotencyKey
        ? String(item.idempotencyKey)
        : null;

      if (!type || !costs[type]) continue;

      const result = await consumeCredits(email, type, {
        referenceId,
        idempotencyKey,
      });

      if (result.allowed) {
        syncedKeys.push(idempotencyKey || `${type}:${referenceId}`);
        continue;
      }

      if (result.reason === 'insufficient_credits') {
        needsSubscription = true;
      }

      failed.push({
        type,
        referenceId,
        idempotencyKey,
        reason: result.reason,
        cost: costs[type],
      });

      break;
    }

    const summary = await getWalletSummary(email);

    return NextResponse.json({
      success: true,
      credits: summary.credits,
      unlimited: summary.unlimited,
      syncedKeys,
      failed,
      needsSubscription,
    });
  } catch (err) {
    console.error('credits/sync', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
