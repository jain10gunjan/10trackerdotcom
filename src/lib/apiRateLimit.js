/**
 * Generic in-memory sliding-window rate limit (per server instance).
 */

const buckets = new Map();

function pruneStale(now) {
  if (buckets.size < 800) return;
  for (const [key, entry] of buckets) {
    if (now - entry.windowStart > entry.windowMs * 2) buckets.delete(key);
  }
}

/**
 * @param {string} key - e.g. email or IP
 * @param {string} bucketName - e.g. 'practice-progress'
 * @param {{ windowMs?: number, max?: number }} [opts]
 */
export function checkApiRateLimit(key, bucketName, opts = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 60;
  const now = Date.now();
  pruneStale(now);

  const bucketKey = `${bucketName}:${key}`;
  let entry = buckets.get(bucketKey);
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { windowStart: now, count: 0, windowMs };
    buckets.set(bucketKey, entry);
  }
  entry.count += 1;

  if (entry.count > max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((entry.windowStart + windowMs - now) / 1000)
    );
    return { ok: false, retryAfterSec, remaining: 0, limit: max, windowMs };
  }

  return {
    ok: true,
    retryAfterSec: 0,
    remaining: max - entry.count,
    limit: max,
    windowMs,
  };
}

export function rateLimitResponse(limitResult) {
  return {
    status: 429,
    body: {
      success: false,
      error: 'Too many requests. Try again shortly.',
      retryAfterSec: limitResult.retryAfterSec,
    },
    headers: {
      'Retry-After': String(limitResult.retryAfterSec || 1),
      'X-RateLimit-Limit': String(limitResult.limit || 0),
      'X-RateLimit-Remaining': String(limitResult.remaining || 0),
    },
  };
}
