/**
 * Parse judge problem URLs → canonical slug for sync matching.
 * Accepts raw slug or full URL from admin paste.
 */

export function normalizeJudgeSlug(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  // Already a slug (no URL scheme / path noise)
  if (!/[/:?]/.test(raw) && /^[a-z0-9][a-z0-9_-]{0,120}$/i.test(raw)) {
    return raw.toLowerCase();
  }

  const fromUrl = extractSlugFromUrl(raw);
  if (fromUrl) return fromUrl;

  // Fallback: last path segment if it looks like a slug
  const cleaned = raw
    .replace(/^https?:\/\//i, '')
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .pop();
  if (cleaned && /^[a-z0-9][a-z0-9_-]{0,120}$/i.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  return null;
}

function extractSlugFromUrl(raw) {
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);

    // leetcode.com/problems/two-sum[/description]
    if (host.includes('leetcode')) {
      const i = parts.findIndex((p) => p === 'problems');
      if (i >= 0 && parts[i + 1]) return parts[i + 1].toLowerCase();
    }

    // hackerrank.com/challenges/solve-me-first[/problem]
    if (host.includes('hackerrank')) {
      const i = parts.findIndex((p) => p === 'challenges');
      if (i >= 0 && parts[i + 1]) return parts[i + 1].toLowerCase();
    }

    // codingninjas.com / ninja.codingninjas.com CodeStudio-style
    if (host.includes('codingninjas') || host.includes('codestudio')) {
      const markers = ['problems', 'problem', 'challenges', 'codestudio'];
      for (let i = 0; i < parts.length - 1; i++) {
        if (markers.includes(parts[i].toLowerCase()) && parts[i + 1]) {
          return parts[i + 1].toLowerCase();
        }
      }
      if (parts.length) return parts[parts.length - 1].toLowerCase();
    }

    // geeksforgeeks.org/problems/xxx
    if (host.includes('geeksforgeeks') || host.includes('gfg')) {
      const i = parts.findIndex((p) => p === 'problems' || p === 'problem');
      if (i >= 0 && parts[i + 1]) return parts[i + 1].toLowerCase();
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * Infer platform from URL (optional helper for admin defaults).
 * @returns {'LEETCODE_PROBLEM'|'HACKERRANK_PROBLEM'|'CODESTUDIO_PROBLEM'|null}
 */
export function inferJudgeTypeFromUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const lower = raw.toLowerCase();
  if (lower.includes('leetcode')) return 'LEETCODE_PROBLEM';
  if (lower.includes('hackerrank')) return 'HACKERRANK_PROBLEM';
  if (lower.includes('codingninjas') || lower.includes('codestudio')) {
    return 'CODESTUDIO_PROBLEM';
  }
  return null;
}

/**
 * Resolve slug + optional canonical URL from admin input.
 * Prefer explicit slug; else parse from URL; keep URL if provided.
 */
export function resolveJudgeExternal({ type, externalSlug, externalUrl }) {
  const url = externalUrl ? String(externalUrl).trim() || null : null;
  const fromSlug = externalSlug ? normalizeJudgeSlug(String(externalSlug)) : null;
  const fromUrl = url ? normalizeJudgeSlug(url) : null;
  const slug = fromSlug || fromUrl || null;

  let resolvedType = type ? String(type).toUpperCase() : null;
  if (!resolvedType && url) {
    resolvedType = inferJudgeTypeFromUrl(url);
  }

  return {
    type: resolvedType,
    externalSlug: slug,
    externalUrl: url,
  };
}
