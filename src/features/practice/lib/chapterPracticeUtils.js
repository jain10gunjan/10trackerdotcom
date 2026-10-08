export const QUESTIONS_PER_PAGE = 10;
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const DIFFICULTY_STORAGE_KEY = 'pyq-practice-difficulty';
export const EXAM_MINUTES_PER_QUESTION = 2;

const MAX_PARAM_LEN = 120;

export const progressQuestionId = (id) => (id == null ? '' : String(id));

/** Scoped difficulty preference so chapters do not inherit each other. */
export function getDifficultyStorageKey(category, chapter) {
  const cat = String(category ?? '').toLowerCase();
  const ch = String(chapter ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  if (!cat || !ch) return DIFFICULTY_STORAGE_KEY;
  return `${DIFFICULTY_STORAGE_KEY}:${cat}:${ch}`;
}

export const normalizeChapterName = (name) =>
  name ? name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/-/g, ' ') : '';

export const chapterNamesMatch = (a, b) => normalizeChapterName(a) === normalizeChapterName(b);

export const getChapterCandidates = (chapter) => {
  const ch = chapter ?? '';
  return Array.from(
    new Set(
      [
        ch,
        ch.trim(),
        ch.replace(/-/g, ' '),
        normalizeChapterName(ch),
        normalizeChapterName(ch).replace(/\s+/g, '-'),
      ].filter(Boolean)
    )
  );
};

/** Subject URL slug → DB subject variants (Physics / physics / …). */
export function getSubjectCandidates(subject) {
  if (!subject) return [];
  const raw = String(subject).trim();
  if (!raw) return [];
  const spaced = raw.replace(/-/g, ' ').replace(/_/g, ' ').trim();
  const lower = spaced.toLowerCase();
  const titled = lower.replace(/\b\w/g, (c) => c.toUpperCase());
  return Array.from(
    new Set([raw, spaced, lower, titled, raw.toLowerCase(), raw.toUpperCase()].filter(Boolean))
  );
}

/**
 * Reject empty / oversized / control-char params before hitting the DB.
 * Allows letters, numbers, spaces, hyphens, underscores, and common punctuation in titles.
 */
export function sanitizePracticeParam(value, { max = MAX_PARAM_LEN } = {}) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s.length > max) return null;
  if (/[\u0000-\u001f\u007f<>`\\]/.test(s)) return null;
  return s;
}

export function normalizeCategoryKey(category) {
  const cleaned = sanitizePracticeParam(category);
  if (!cleaned) return null;
  return cleaned.toUpperCase().replace(/\s+/g, '-');
}

export function parseDifficultyParam(searchParams) {
  if (!searchParams) return null;
  const d = String(searchParams.get('difficulty') ?? '').toLowerCase();
  return DIFFICULTIES.includes(d) ? d : null;
}

export function formatSlugTitle(slug) {
  if (!slug) return '';
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const mathJaxConfig = {
  'fast-preview': { disabled: false },
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    processEscapes: true,
  },
  messageStyle: 'none',
  showMathMenu: false,
};
