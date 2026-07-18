/**
 * Lightweight practice/product metrics — structured logs + optional beacon.
 */

export function logPracticeMetric(event, payload = {}) {
  const row = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };
  if (typeof console !== 'undefined') {
    console.info('[practice-metric]', JSON.stringify(row));
  }
  return row;
}

/** Client: fire-and-forget metric (never throws). */
export function trackPracticeClient(event, payload = {}) {
  if (typeof window === 'undefined') return;
  try {
    logPracticeMetric(event, payload);
    const body = JSON.stringify({ event, payload, ts: Date.now() });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/practice/metrics', blob);
    } else {
      fetch('/api/practice/metrics', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}
