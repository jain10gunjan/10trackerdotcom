/** Client-safe fetchers for chapter practice (API routes are cached server-side). */

async function fetchWithRetry(url, { signal, retries = 2, backoffMs = 350 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        // Retry transient errors
        if (res.status >= 500 || res.status === 429) throw err;
        throw err;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (e?.name === 'AbortError') throw e;
      if (attempt >= retries) break;
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  throw lastErr || new Error('Request failed');
}

export async function fetchChapterCounts(category, chapter) {
  const res = await fetchWithRetry(
    `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(chapter)}`
  );
  const data = await res.json();
  return {
    easy: data.easy ?? 0,
    medium: data.medium ?? 0,
    hard: data.hard ?? 0,
    total: data.total ?? 0,
    matchedChapter: data.matchedChapter ?? null,
    matchedSlug: data.matchedSlug ?? null,
    chapterSlugSupported: Boolean(data.chapterSlugSupported),
  };
}

export async function fetchChapterQuestions({
  category,
  chapter,
  difficulty,
  page,
  limit,
  signal,
}) {
  const res = await fetchWithRetry(
    `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(chapter)}&difficulty=${difficulty}&page=${page}&limit=${limit}`,
    { signal }
  );
  const data = await res.json();
  return {
    questions: data.questions ?? [],
    hasMore: data.hasMore ?? false,
    matchedChapter: data.matchedChapter ?? null,
    matchedSlug: data.matchedSlug ?? null,
  };
}

export async function fetchChapterQuestionIds({ category, chapter, difficulty, signal }) {
  const res = await fetchWithRetry(
    `/api/questions/chapter/ids?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(chapter)}&difficulty=${encodeURIComponent(difficulty ?? '')}`,
    { signal }
  );
  const data = await res.json();
  return {
    ids: data.ids ?? [],
    matchedChapter: data.matchedChapter ?? null,
    matchedSlug: data.matchedSlug ?? null,
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
