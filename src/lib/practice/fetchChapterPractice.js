/** Client-safe fetchers for chapter practice (API routes are cached server-side). */

export async function fetchChapterCounts(category, chapter) {
  const res = await fetch(
    `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(chapter)}`
  );
  if (!res.ok) throw new Error('Failed to load counts');
  const data = await res.json();
  return {
    easy: data.easy ?? 0,
    medium: data.medium ?? 0,
    hard: data.hard ?? 0,
    total: data.total ?? 0,
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
  const res = await fetch(
    `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(chapter)}&difficulty=${difficulty}&page=${page}&limit=${limit}`,
    { signal }
  );
  if (!res.ok) throw new Error('Failed to load questions');
  const data = await res.json();
  return {
    questions: data.questions ?? [],
    hasMore: data.hasMore ?? false,
  };
}
