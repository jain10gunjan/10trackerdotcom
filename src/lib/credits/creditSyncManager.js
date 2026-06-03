'use client';

import {
  getPendingSyncItems,
  initCreditStoreFromServer,
  loadCreditStore,
  removePendingByKeys,
  reconcileAfterSync,
  rollbackLocalCharge,
  SYNC_DEBOUNCE_MS,
  shouldFlushNow,
} from '@/lib/credits/creditLocalStore';

let flushTimer = null;
let flushInFlight = null;
let activeUserId = null;

function dispatchBalance(credits) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('credits-balance-updated', { detail: { credits } })
  );
}

/**
 * Push pending local debits to the server (batched).
 */
export async function flushCreditSync(userId, { force = false } = {}) {
  if (!userId || typeof window === 'undefined') return { ok: true, skipped: true };

  const pending = getPendingSyncItems(userId);
  if (!pending.length) return { ok: true, synced: 0 };

  if (!force && !shouldFlushNow(userId)) {
    return { ok: true, deferred: true };
  }

  if (flushInFlight) return flushInFlight;

  const store = loadCreditStore(userId);
  if (store.unlimited) {
    const keys = pending.map((p) => p.idempotencyKey);
    removePendingByKeys(userId, keys);
    dispatchBalance(store.balance);
    return { ok: true, synced: 0, unlimited: true };
  }

  flushInFlight = (async () => {
    try {
      const res = await fetch('/api/credits/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: pending.map((p) => ({
            type: p.type,
            referenceId: p.referenceId,
            idempotencyKey: p.idempotencyKey,
          })),
        }),
      });

      const data = await res.json();

      if (data.unlimited) {
        removePendingByKeys(
          userId,
          pending.map((p) => p.idempotencyKey)
        );
        dispatchBalance(data.credits ?? loadCreditStore(userId).balance);
        return { ok: true, unlimited: true };
      }

      if (!data.success) {
        return { ok: false, error: data.error };
      }

      const syncedKeys = data.syncedKeys || [];

      if (Array.isArray(data.failed)) {
        for (const fail of data.failed) {
          if (fail.idempotencyKey && fail.cost) {
            rollbackLocalCharge(userId, fail.idempotencyKey, fail.cost);
          }
        }
      }

      const balance =
        typeof data.credits === 'number'
          ? reconcileAfterSync(userId, data.credits, syncedKeys)
          : loadCreditStore(userId).balance;

      dispatchBalance(balance);

      if (data.needsSubscription && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credits-paywall-required'));
      }

      return {
        ok: true,
        synced: syncedKeys.length,
        credits: balance,
        needsSubscription: Boolean(data.needsSubscription),
      };
    } catch (err) {
      return { ok: false, error: err?.message || 'sync_failed' };
    } finally {
      flushInFlight = null;
    }
  })();

  return flushInFlight;
}

export function scheduleCreditSync(userId) {
  if (!userId) return;
  activeUserId = userId;

  if (shouldFlushNow(userId)) {
    flushCreditSync(userId, { force: true });
    return;
  }

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushCreditSync(userId, { force: true });
  }, SYNC_DEBOUNCE_MS);
}

export function registerCreditSyncLifecycle(userId) {
  if (typeof window === 'undefined' || !userId) return () => {};

  activeUserId = userId;

  const onHide = () => {
    flushCreditSync(userId, { force: true });
  };

  const onVisible = () => {
    if (getPendingSyncItems(userId).length) {
      flushCreditSync(userId, { force: true });
    }
  };

  window.addEventListener('pagehide', onHide);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
    else onVisible();
  });

  return () => {
    window.removeEventListener('pagehide', onHide);
    if (flushTimer) clearTimeout(flushTimer);
  };
}

export async function hydrateCreditsFromServer(userId, walletPayload) {
  if (!userId) return null;

  await flushCreditSync(userId, { force: true });

  const store = initCreditStoreFromServer(userId, {
    credits: walletPayload.credits,
    unlimited: walletPayload.unlimited,
  });

  dispatchBalance(store.balance);
  return store;
}
