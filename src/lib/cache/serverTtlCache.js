/**
 * Process-local TTL cache for short-lived server data (e.g. shared leaderboards).
 * Note: In serverless each instance has its own cache; use Redis for cross-instance sharing.
 */

const store = new Map();
const DEFAULT_MAX_ENTRIES = 256;

function pruneIfNeeded(maxEntries) {
  if (store.size <= maxEntries) return;
  const oldestKey = store.keys().next().value;
  if (oldestKey) store.delete(oldestKey);
}

/**
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} factory
 * @param {{ maxEntries?: number }} [opts]
 * @returns {Promise<T>}
 * @template T
 */
export async function getOrSetCached(key, ttlMs, factory, opts = {}) {
  const maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const now = Date.now();
  const hit = store.get(key);

  if (hit && now - hit.at < ttlMs) {
    return hit.value;
  }

  if (hit?.pending) {
    return hit.pending;
  }

  const pending = Promise.resolve()
    .then(factory)
    .then((value) => {
      pruneIfNeeded(maxEntries);
      store.set(key, { value, at: Date.now(), pending: null });
      return value;
    })
    .catch((err) => {
      store.delete(key);
      throw err;
    });

  store.set(key, { value: hit?.value ?? null, at: hit?.at ?? 0, pending });
  return pending;
}

export function invalidateCached(key) {
  store.delete(key);
}

export function clearServerTtlCache() {
  store.clear();
}
