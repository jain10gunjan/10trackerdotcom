/**
 * SSRF guards: only allow http(s) URLs to explicit host allowlists,
 * and reject private / link-local / metadata addresses.
 */

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^\[::1\]$/i,
];

/** RFC1918 172.16.0.0/12 */
function isPrivateIpv4(hostname) {
  const m = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
  return false;
}

export function isBlockedHostname(hostname) {
  if (!hostname) return true;
  const host = String(hostname).toLowerCase().replace(/^\[|\]$/g, '');
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(host))) return true;
  if (isPrivateIpv4(host)) return true;
  if (host === 'metadata.google.internal') return true;
  return false;
}

/**
 * @param {string} rawUrl
 * @param {string[]} allowedHosts - exact host or parent domain (e.g. "example.com" allows www.example.com)
 * @returns {{ ok: true, url: URL } | { ok: false, error: string }}
 */
export function assertAllowedFetchUrl(rawUrl, allowedHosts = []) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { ok: false, error: 'URL is required' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http(s) URLs are allowed' };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, error: 'URL host is not allowed' };
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = (allowedHosts || [])
    .map((h) => String(h).trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) {
    return { ok: false, error: 'No allowed hosts configured' };
  }

  const hostOk = allowed.some(
    (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)
  );
  if (!hostOk) {
    return { ok: false, error: 'URL host is not allowed' };
  }

  return { ok: true, url: parsed };
}
