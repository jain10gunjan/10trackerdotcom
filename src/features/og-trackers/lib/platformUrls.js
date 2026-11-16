/**
 * Deep links + meta helpers for on-platform OG Tracker resources.
 */

const DEFAULT_PRACTICE_COMPLETION_PERCENT = 70;

export function slugifyPathSegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizePracticeMeta(raw = {}) {
  const area = slugifyPathSegment(raw.area || raw.category || '');
  const subject = slugifyPathSegment(raw.subject || '');
  const chapter = slugifyPathSegment(raw.chapter || '');
  const threshold = Number(raw.completionPercent);
  return {
    area,
    subject,
    chapter,
    completionPercent:
      Number.isFinite(threshold) && threshold > 0 && threshold <= 100
        ? Math.floor(threshold)
        : DEFAULT_PRACTICE_COMPLETION_PERCENT,
  };
}

export function normalizeMockMeta(raw = {}) {
  const examCategory = slugifyPathSegment(raw.examCategory || raw.category || '');
  const testId = String(raw.testId || raw.test_id || '').trim();
  return { examCategory, testId };
}

export function buildPracticeChapterUrl(meta) {
  const m = normalizePracticeMeta(meta);
  if (!m.area || !m.subject || !m.chapter) return null;
  return `/${m.area}/${m.subject}/${m.chapter}/practice`;
}

export function buildMockTestUrl(meta) {
  const m = normalizeMockMeta(meta);
  if (!m.examCategory || !m.testId) return null;
  return `/mock-test/${m.examCategory}/attempt/${m.testId}`;
}

export function appendOgReturnParams(url, { pathSlug, resourceId } = {}) {
  if (!url) return null;
  try {
    const isAbsolute = /^https?:\/\//i.test(url);
    const u = isAbsolute
      ? new URL(url)
      : new URL(url, 'https://www.10tracker.com');
    u.searchParams.set('from', 'og');
    if (pathSlug) u.searchParams.set('path', pathSlug);
    if (resourceId) u.searchParams.set('rid', resourceId);
    if (isAbsolute) return u.toString();
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const join = url.includes('?') ? '&' : '?';
    const parts = ['from=og'];
    if (pathSlug) parts.push(`path=${encodeURIComponent(pathSlug)}`);
    if (resourceId) parts.push(`rid=${encodeURIComponent(resourceId)}`);
    return `${url}${join}${parts.join('&')}`;
  }
}

export function resolvePlatformExternal({ type, meta, externalUrl, externalSlug }) {
  const t = String(type || '').toUpperCase();
  if (t === 'PRACTICE_CHAPTER') {
    const normalized = normalizePracticeMeta(meta);
    const url = buildPracticeChapterUrl(normalized) || (externalUrl ? String(externalUrl).trim() : null);
    return {
      meta: normalized,
      externalUrl: url,
      externalSlug: externalSlug
        ? String(externalSlug).trim()
        : [normalized.area, normalized.subject, normalized.chapter].filter(Boolean).join('/') || null,
    };
  }
  if (t === 'MOCK_TEST') {
    const normalized = normalizeMockMeta(meta);
    const url = buildMockTestUrl(normalized) || (externalUrl ? String(externalUrl).trim() : null);
    return {
      meta: normalized,
      externalUrl: url,
      externalSlug: normalized.testId || (externalSlug ? String(externalSlug).trim() : null),
    };
  }
  return {
    meta: meta && typeof meta === 'object' ? meta : {},
    externalUrl: externalUrl ? String(externalUrl).trim() || null : null,
    externalSlug: externalSlug ? String(externalSlug).trim() || null : null,
  };
}

export function isPlatformResourceType(type) {
  const t = String(type || '').toUpperCase();
  return t === 'PRACTICE_CHAPTER' || t === 'MOCK_TEST';
}

export function isJudgeResourceType(type) {
  const t = String(type || '').toUpperCase();
  return (
    t === 'LEETCODE_PROBLEM' ||
    t === 'CODESTUDIO_PROBLEM' ||
    t === 'HACKERRANK_PROBLEM'
  );
}
