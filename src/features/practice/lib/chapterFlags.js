import { progressQuestionId } from '@/features/practice/lib/chapterPracticeUtils';

const FLAGS_VERSION = 1;

export function getChapterFlagsKey(userId, category, chapter) {
  const uid = userId || 'anon';
  const cat = String(category ?? '').toLowerCase();
  const ch = String(chapter ?? '').toLowerCase().replace(/\s+/g, '-');
  return `pyq-chapter-flags:v${FLAGS_VERSION}:${uid}:${cat}:${ch}`;
}

export function readChapterFlags(userId, category, chapter) {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(getChapterFlagsKey(userId, category, chapter));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
    return new Set(ids.map(progressQuestionId).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function writeChapterFlags(userId, category, chapter, flagSet) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getChapterFlagsKey(userId, category, chapter),
      JSON.stringify({ v: FLAGS_VERSION, ids: [...flagSet], updatedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function toggleChapterFlag(userId, category, chapter, questionId) {
  const qid = progressQuestionId(questionId);
  if (!qid) return readChapterFlags(userId, category, chapter);
  const next = readChapterFlags(userId, category, chapter);
  if (next.has(qid)) next.delete(qid);
  else next.add(qid);
  writeChapterFlags(userId, category, chapter, next);
  return next;
}
