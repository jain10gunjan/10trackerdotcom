/**
 * In-memory sliding-window rate limits for admin rewrite API calls.
 * Per server instance; sufficient for admin-only traffic. Tune via env.
 */

const buckets = new Map();

function windowMsFor(mode) {
  if (mode === "rewrite-bulk") {
    const min = Number(process.env.REWRITE_BULK_RATE_WINDOW_MINUTES);
    if (Number.isFinite(min) && min > 0) return min * 60 * 1000;
    return 10 * 60 * 1000;
  }
  const min = Number(process.env.REWRITE_SINGLE_RATE_WINDOW_MINUTES);
  if (Number.isFinite(min) && min > 0) return min * 60 * 1000;
  return 10 * 60 * 1000;
}

function maxFor(mode) {
  if (mode === "rewrite-bulk") {
    const n = Number(process.env.REWRITE_BULK_RATE_LIMIT_MAX);
    return Number.isFinite(n) && n > 0 ? n : 12;
  }
  const n = Number(process.env.REWRITE_SINGLE_RATE_LIMIT_MAX);
  return Number.isFinite(n) && n > 0 ? n : 80;
}

function pruneStale(now) {
  if (buckets.size < 500) return;
  for (const [key, entry] of buckets) {
    if (now - entry.windowStart > entry.windowMs * 2) {
      buckets.delete(key);
    }
  }
}

/**
 * @param {string} key - e.g. admin email
 * @param {"rewrite-bulk"|"rewrite-question"|"rewrite-solution"} mode
 */
export function checkRewriteRateLimit(key, mode) {
  const windowMs = windowMsFor(mode);
  const max = maxFor(mode);
  const now = Date.now();
  pruneStale(now);

  const bucketKey = `${mode}:${key}`;
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

export const REWRITE_MODES = new Set([
  "rewrite-question",
  "rewrite-solution",
  "rewrite-bulk",
]);
