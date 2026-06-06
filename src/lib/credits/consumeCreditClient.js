'use client';

import {
  applyServerDebit,
  mockTestIdempotencyKey,
  reserveCreditsLocally,
  rollbackLocalCharge,
} from '@/lib/credits/creditLocalStore';
import { scheduleCreditSync, flushCreditSync } from '@/lib/credits/creditSyncManager';
import { getProgressUserId } from '@/lib/progressIdentity';

async function consumeCreditOnServer(userId, { type, referenceId, idempotencyKey }) {
  const res = await fetch('/api/credits/consume', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, referenceId, idempotencyKey }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'invalid_response' };
  }

  if (!res.ok && !data?.allowed) {
    if (data?.needsSubscription && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('credits-paywall-required'));
    }
    return {
      ok: false,
      needsSubscription: Boolean(data?.needsSubscription),
      reason: data?.reason || data?.error || 'consume_failed',
      credits: data?.credits,
    };
  }

  if (data.unlimited) {
    applyServerDebit(userId, {
      idempotencyKey,
      serverCredits: typeof data.credits === 'number' ? data.credits : undefined,
      cost: data.cost,
    });
    return {
      ok: true,
      data: { allowed: true, unlimited: true, credits: data.credits, duplicate: data.duplicate },
    };
  }

  if (typeof data.credits === 'number') {
    applyServerDebit(userId, {
      idempotencyKey,
      serverCredits: data.credits,
      cost: data.cost,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('credits-balance-updated', { detail: { credits: data.credits } })
      );
    }
  }

  return {
    ok: true,
    data: {
      allowed: true,
      credits: data.credits,
      duplicate: data.duplicate,
      cost: data.cost,
    },
  };
}

/**
 * Mock test start: charge server-first so DB balance updates before attempt row is created.
 * Practice questions: local reserve + batched sync.
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

  if (type === 'mock_test') {
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

    const server = await consumeCreditOnServer(userId, {
      type,
      referenceId,
      idempotencyKey: key,
    });

    if (!server.ok) {
      const balance = rollbackLocalCharge(userId, key, local.cost);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('credits-balance-updated', { detail: { credits: balance } })
        );
      }
      return server;
    }

    return server;
  }

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

  return {
    ok: true,
    data: { allowed: true, credits: local.balance },
  };
}
