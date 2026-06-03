'use client';

import {
  mockTestIdempotencyKey,
  reserveCreditsLocally,
} from '@/lib/credits/creditLocalStore';
import { scheduleCreditSync, flushCreditSync } from '@/lib/credits/creditSyncManager';
import { getProgressUserId } from '@/lib/progressIdentity';

/**
 * Mock test start: local reserve + batched sync (no per-click API).
 */
export async function consumeCreditOnClient(
  type,
  { referenceId, idempotencyKey, user } = {}
) {
  const userId = getProgressUserId(user);
  if (!userId) {
    return { ok: false, reason: 'not_authenticated' };
  }

  const key =
    idempotencyKey ||
    (type === 'mock_test'
      ? mockTestIdempotencyKey(userId, referenceId)
      : null);

  const local = reserveCreditsLocally(userId, {
    type,
    referenceId,
    idempotencyKey: key,
  });

  if (!local.ok) {
    if (local.reason === 'insufficient_credits' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits-paywall-required'));
    }
    return {
      ok: false,
      needsSubscription: local.reason === 'insufficient_credits',
      reason: local.reason,
      credits: local.balance,
    };
  }

  if (local.duplicate || local.unlimited) {
    return { ok: true, data: { allowed: true, credits: local.balance, duplicate: true } };
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('credits-balance-updated', { detail: { credits: local.balance } })
    );
  }

  scheduleCreditSync(userId);

  if (type === 'mock_test') {
    flushCreditSync(userId, { force: true });
  }

  return {
    ok: true,
    data: { allowed: true, credits: local.balance },
  };
}
