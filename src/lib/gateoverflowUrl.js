/** Normalize and validate a GateOverflow discussion URL. */
export function normalizeGateOverflowUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://gateoverflow.in${url.startsWith('/') ? url : `/${url}`}`;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'gateoverflow.in' && !host.endsWith('.gateoverflow.in')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
