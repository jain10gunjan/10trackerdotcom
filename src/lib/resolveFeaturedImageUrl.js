/**
 * Normalize featured_image_url from Supabase for the current environment.
 * Browser-facing automation images use the same-origin proxy (/api/images/:id).
 * Server-side automationFetch calls AUTOMATION_API_URL directly.
 */

const IMAGE_ID_RE = /\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function extractAutomationImageId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.trim().match(IMAGE_ID_RE);
  return match?.[1] || null;
}

/**
 * Same-origin image proxy — safe for browser, SSR, and OG tags (no localhost / LNA).
 * @param {string} imageId
 * @param {{ absoluteBase?: string }} [options]
 */
export function buildAutomationImageUrl(imageId, options = {}) {
  const id = String(imageId || '').trim();
  if (!id) return null;
  const path = `/api/images/${id}`;
  const base = options.absoluteBase ? String(options.absoluteBase).replace(/\/$/, '') : '';
  return base ? `${base}${path}` : path;
}

/** Server-only automation API host (not for browser img/fetch URLs). */
export function getAutomationApiBase() {
  const fromEnv = process.env.AUTOMATION_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3003';
  return '';
}

/**
 * @param {string | null | undefined} raw
 * @param {{ absoluteBase?: string }} [options] — prefix for absolute URLs (OG, JSON-LD)
 * @returns {string | null}
 */
export function resolveFeaturedImageUrl(raw, options = {}) {
  if (!raw || typeof raw !== 'string') return null;

  let url = raw.trim();
  if (!url) return null;

  if (url.includes('AUTOMATION_API_URL')) {
    url = url.replace(/AUTOMATION_API_URL/g, '');
  }

  const imageId = extractAutomationImageId(url);
  if (imageId) {
    return buildAutomationImageUrl(imageId, options);
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    const base = options.absoluteBase ? String(options.absoluteBase).replace(/\/$/, '') : '';
    return base ? `${base}${url}` : url;
  }

  return url;
}

export function isAutomationImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  return Boolean(extractAutomationImageId(src));
}
