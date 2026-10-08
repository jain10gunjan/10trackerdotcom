/** Client-safe fetchers for chapter practice (API routes are cached server-side). */

async function fetchWithRetry(url, { signal, retries = 2, backoffMs = 350 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        if (res.status >= 500 || res.status === 429) throw err;
        throw err;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.name === 'AbortError') throw e;
      if (attempt >= retries) break;
    }
    await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
  }
  throw lastErr || new Error('Request failed');
}

function buildChapterQuery({ category, chapter, subject, difficulty, page, limit }) {
  const params = new URLSearchParams();
  params.set('category', category);
  params.set('chapter', chapter);
  if (subject) params.set('subject', subject);
  if (difficulty) params.set('difficulty', difficulty);
  if (page != null) params.set('page', String(page));
  if (limit != null) params.set('limit', String(limit));
  return params.toString();
}

export async function fetchChapterCounts(category, chapter, subject) {
  const qs = buildChapterQuery({ category, chapter, subject });
  const res = await fetchWithRetry(`/api/questions/chapter/counts?${qs}`);
  const data = await res.json();
  return {
    easy: data.easy ?? 0,
    medium: data.medium ?? 0,
    hard: data.hard ?? 0,
    total: data.total ?? 0,
    matchedChapter: data.matchedChapter ?? null,
    matchedSlug: data.matchedSlug ?? null,
    matchedSubject: data.matchedSubject ?? null,
  };
}

export async function fetchChapterQuestions({
  category,
  chapter,
  subject,
  difficulty,
  page,
  limit,
  signal,
}) {
  const qs = buildChapterQuery({ category, chapter, subject, difficulty, page, limit });
  const res = await fetchWithRetry(`/api/questions/chapter?${qs}`, { signal });
  const data = await res.json();
  return {
    questions: data.questions ?? [],
    hasMore: data.hasMore ?? false,
    matchedChapter: data.matchedChapter ?? null,
    matchedSlug: data.matchedSlug ?? null,
    matchedSubject: data.matchedSubject ?? null,
  };
}

export async function fetchChapterQuestionIds({
  category,
  chapter,
  subject,
  difficulty,
  signal,
}) {
  const qs = buildChapterQuery({ category, chapter, subject, difficulty });
  const res = await fetchWithRetry(`/api/questions/chapter/ids?${qs}`, { signal });
  const data = await res.json();
  return {
    ids: data.ids ?? [],
    matchedChapter: data.matchedChapter ?? null,
    matchedSlug: data.matchedSlug ?? null,
    matchedSubject: data.matchedSubject ?? null,
  };
}

export async function fetchChapterQuestionBodies(ids, { signal } = {}) {
  const list = (ids ?? []).map(String).filter(Boolean);
  if (!list.length) return { questions: [] };
  const res = await fetchWithRetry(
    `/api/questions/chapter/bodies?ids=${encodeURIComponent(list.join(','))}`,
    { signal }
  );
  const data = await res.json();
  return { questions: data.questions ?? [] };
}
