/**
 * Normalize featured_image_url from Supabase for the current environment.
 * Automation images are always loaded from AUTOMATION_API_URL/api/images/{uuid}.
 */

const IMAGE_ID_RE = /\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function extractAutomationImageId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.trim().match(IMAGE_ID_RE);
  return match?.[1] || null;
}

/** Base URL from env — works server + client (NEXT_PUBLIC_* required in browser). */
export function getAutomationApiBase() {
  return (
    process.env.NEXT_PUBLIC_AUTOMATION_API_URL ||
    process.env.AUTOMATION_API_URL ||
    'http://localhost:3003'
  ).replace(/\/$/, '');
}

export function buildAutomationImageUrl(imageId) {
  const id = String(imageId || '').trim();
  if (!id) return null;
  return `${getAutomationApiBase()}/api/images/${id}`;
}

/**
 * @param {string | null | undefined} raw
 * @param {{ absoluteBase?: string }} [options] — for non-automation relative paths only
 * @returns {string | null}
 */
export function resolveFeaturedImageUrl(raw, options = {}) {
  if (!raw || typeof raw !== 'string') return null;

  let url = raw.trim();
  if (!url) return null;

  if (url.includes('AUTOMATION_API_URL')) {
    url = url.replace(/AUTOMATION_API_URL/g, getAutomationApiBase());
  }

  const imageId = extractAutomationImageId(url);
  if (imageId) {
    return buildAutomationImageUrl(imageId);
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    const base = options.absoluteBase || process.env.NEXT_PUBLIC_SITE_URL || '';
    return base ? `${String(base).replace(/\/$/, '')}${url}` : url;
  }

  return url;
}

export function isAutomationImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  return Boolean(extractAutomationImageId(src));
}
