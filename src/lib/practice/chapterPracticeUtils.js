export const QUESTIONS_PER_PAGE = 10;
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const DIFFICULTY_STORAGE_KEY = 'pyq-practice-difficulty';

export const progressQuestionId = (id) => (id == null ? '' : String(id));

export const normalizeChapterName = (name) =>
  name ? name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/-/g, ' ') : '';

export const chapterNamesMatch = (a, b) => normalizeChapterName(a) === normalizeChapterName(b);

export const getChapterCandidates = (chapter) => {
  const ch = chapter ?? '';
  return Array.from(
    new Set([
      ch,
      ch.trim(),
      ch.replace(/-/g, ' '),
      normalizeChapterName(ch),
      normalizeChapterName(ch).replace(/\s+/g, '-'),
    ].filter(Boolean))
  );
};

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
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
  messageStyle: 'none',
  showMathMenu: false,
};
