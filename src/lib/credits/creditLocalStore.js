/**
 * Client-side credit ledger (localStorage).
 * UI reads/writes here instantly; server sync runs in batches.
 */

import { CREDIT_COST } from '@/lib/credits/constants';

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = 'cattracker_credits_v1';

export const SYNC_BATCH_SIZE = 10;
export const SYNC_DEBOUNCE_MS = 12_000;
const MAX_CHARGED_KEYS = 4000;

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${String(userId || '').toLowerCase()}`;
}

function defaultStore() {
  return {
    v: STORAGE_VERSION,
    balance: 0,
    unlimited: false,
    chargedKeys: [],
    pending: [],
    lastServerBalance: null,
    updatedAt: 0,
  };
}

export function loadCreditStore(userId) {
  if (typeof window === 'undefined' || !userId) return defaultStore();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);
    if (parsed?.v !== STORAGE_VERSION) return defaultStore();
    return {
      ...defaultStore(),
      ...parsed,
      chargedKeys: Array.isArray(parsed.chargedKeys) ? parsed.chargedKeys : [],
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    };
  } catch {
    return defaultStore();
  }
}

export function saveCreditStore(userId, store) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ ...store, updatedAt: Date.now() })
    );
  } catch {
    /* quota or private mode */
  }
}

export function practiceIdempotencyKey(userId, questionId) {
  return `practice:${String(userId).toLowerCase()}:${String(questionId)}`;
}

export function mockTestIdempotencyKey(userId, testId) {
  return `mock_test:${String(userId).toLowerCase()}:${String(testId)}`;
}

/** Already charged locally (synced or waiting in pending queue). */
export function isCreditAlreadyReserved(userId, idempotencyKey) {
  const store = loadCreditStore(userId);
  if (store.chargedKeys.includes(idempotencyKey)) return true;
  return (store.pending || []).some((p) => p.idempotencyKey === idempotencyKey);
}

export function initCreditStoreFromServer(userId, { credits, unlimited }) {
  const store = loadCreditStore(userId);
  const serverCredits = typeof credits === 'number' ? credits : 0;

  if (unlimited) {
    const next = {
      ...store,
      balance: serverCredits,
      unlimited: true,
      lastServerBalance: serverCredits,
      pending: [],
    };
    saveCreditStore(userId, next);
    return next;
  }

  const pending = store.pending || [];
  const pendingCost = pending.reduce((sum, item) => sum + (item.cost || 0), 0);

  const next = {
    ...store,
    unlimited: false,
    lastServerBalance: serverCredits,
    balance:
      pending.length > 0
        ? Math.max(0, serverCredits - pendingCost)
        : serverCredits,
  };
  saveCreditStore(userId, next);
  return next;
}

export function getLocalCreditBalance(userId) {
  return loadCreditStore(userId).balance;
}

export function isLocalUnlimited(userId) {
  return Boolean(loadCreditStore(userId).unlimited);
}

export function canAffordPracticeQuestion(userId) {
  const store = loadCreditStore(userId);
  if (store.unlimited) return true;
  return store.balance >= CREDIT_COST.practice_question;
}

export function canAffordMockTest(userId) {
  const store = loadCreditStore(userId);
  if (store.unlimited) return true;
  return store.balance >= CREDIT_COST.mock_test;
}

/**
 * Reserve credits locally. Returns { ok, balance, idempotencyKey } or { ok: false, reason }.
 */
export function reserveCreditsLocally(userId, { type, referenceId, idempotencyKey }) {
  const cost = CREDIT_COST[type];
  if (!cost) return { ok: false, reason: 'invalid_type' };

  const key =
    idempotencyKey ||
    (type === 'practice_question'
      ? practiceIdempotencyKey(userId, referenceId)
      : mockTestIdempotencyKey(userId, referenceId));

  const store = loadCreditStore(userId);

  if (store.unlimited) {
    return { ok: true, unlimited: true, idempotencyKey: key, skipped: true };
  }

  if (isCreditAlreadyReserved(userId, key)) {
    return { ok: true, duplicate: true, idempotencyKey: key, balance: store.balance };
  }

  if (store.balance < cost) {
    return { ok: false, reason: 'insufficient_credits', balance: store.balance, cost };
  }

  let chargedKeys = [...store.chargedKeys, key];
  if (chargedKeys.length > MAX_CHARGED_KEYS) {
    const pendingKeys = new Set((store.pending || []).map((p) => p.idempotencyKey));
    chargedKeys = chargedKeys.filter((k) => pendingKeys.has(k) || k === key);
    if (!chargedKeys.includes(key)) chargedKeys.push(key);
    if (chargedKeys.length > MAX_CHARGED_KEYS) {
      chargedKeys = chargedKeys.slice(-MAX_CHARGED_KEYS);
    }
  }

  const next = {
    ...store,
    balance: store.balance - cost,
    chargedKeys,
    pending: [
      ...store.pending,
      {
        type,
        referenceId: String(referenceId),
        idempotencyKey: key,
        cost,
        createdAt: Date.now(),
      },
    ],
  };

  saveCreditStore(userId, next);

  return { ok: true, idempotencyKey: key, balance: next.balance, cost };
}

/** After server sync — server balance is source of truth for remaining pending. */
export function removePendingByKeys(userId, syncedKeys) {
  const store = loadCreditStore(userId);
  const keySet = new Set(syncedKeys || []);
  const next = {
    ...store,
    pending: (store.pending || []).filter((p) => !keySet.has(p.idempotencyKey)),
  };
  saveCreditStore(userId, next);
  return next;
}

export function reconcileAfterSync(userId, serverCredits, syncedKeys = []) {
  const store = loadCreditStore(userId);
  const synced = new Set(syncedKeys);
  const remainingPending = (store.pending || []).filter(
    (p) => !synced.has(p.idempotencyKey)
  );
  const remainingCost = remainingPending.reduce((s, p) => s + (p.cost || 0), 0);
  const balance =
    typeof serverCredits === 'number'
      ? Math.max(0, serverCredits - remainingCost)
      : store.balance;

  const next = {
    ...store,
    balance,
    lastServerBalance: serverCredits,
    pending: remainingPending,
  };
  saveCreditStore(userId, next);
  return balance;
}

export function rollbackLocalCharge(userId, idempotencyKey, cost) {
  const store = loadCreditStore(userId);
  const next = {
    ...store,
    balance: store.balance + cost,
    chargedKeys: store.chargedKeys.filter((k) => k !== idempotencyKey),
    pending: (store.pending || []).filter((p) => p.idempotencyKey !== idempotencyKey),
  };
  saveCreditStore(userId, next);
  return next.balance;
}

export function getPendingSyncItems(userId) {
  return loadCreditStore(userId).pending || [];
}

export function shouldFlushNow(userId) {
  return getPendingSyncItems(userId).length >= SYNC_BATCH_SIZE;
}
