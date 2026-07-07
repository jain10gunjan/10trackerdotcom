/**
 * NAT-style questions: all options_A–D empty, answer typed as plain text.
 * correct_option holds the exact numerical/text value(s) — not LaTeX or A/B/C/D.
 *
 * Multiple accepted answers: pipe-separated plain values, e.g. "42|42.0"
 */

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function getOptionField(question, letter) {
  if (!question) return '';
  const v = question[`options_${letter}`];
  return typeof v === 'string' ? v.trim() : '';
}

/** At least one options_A–D field is non-empty. */
export function hasPopulatedOptions(question) {
  return OPTION_LETTERS.some((letter) => getOptionField(question, letter).length > 0);
}

/** All four option fields empty → user types answer in an input. */
export function isInlineAnswerQuestion(question) {
  return !hasPopulatedOptions(question);
}

export function normalizeInlineAnswer(value) {
  return String(value ?? '').trim();
}

/** Split correct_option into accepted exact-match strings. */
export function parseAcceptedAnswers(correctOption) {
  if (correctOption == null) return [];
  const raw = String(correctOption).trim();
  if (!raw) return [];
  if (raw.includes('|')) {
    return raw
      .split('|')
      .map((part) => normalizeInlineAnswer(part))
      .filter(Boolean);
  }
  return [normalizeInlineAnswer(raw)];
}

export function formatAcceptedAnswers(correctOption) {
  const parts = parseAcceptedAnswers(correctOption);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.join(' or ');
}

export function isInlineAnswerCorrect(userAnswer, correctOption) {
  const normalized = normalizeInlineAnswer(userAnswer);
  if (!normalized) return false;
  const accepted = parseAcceptedAnswers(correctOption);
  if (accepted.length === 0) return false;
  return accepted.some((answer) => normalized === answer);
}

/** Normalize MCQ option id (A/B/C/D) for comparison. */
export function normalizeAnswerOption(value) {
  if (value == null) return '';
  const s = String(value).trim();
  if (!s) return '';
  const letter =
    s.match(/^option[_\s-]?([a-d])$/i)?.[1] || s.match(/^([a-d])$/i)?.[1];
  if (letter) return letter.toUpperCase();
  return s.toUpperCase();
}

export function isMcqLetterCorrect(userAnswer, correctOption) {
  const u = normalizeAnswerOption(userAnswer);
  const c = normalizeAnswerOption(correctOption);
  if (!c || !/^[A-D]$/.test(c)) return false;
  return u === c;
}

/**
 * @param {string} userAnswer
 * @param {string} correctOption
 * @param {object} [question] — when provided, uses inline vs MCQ detection
 */
export function isAnswerCorrect(userAnswer, correctOption, question = null) {
  if (question && isInlineAnswerQuestion(question)) {
    return isInlineAnswerCorrect(userAnswer, correctOption);
  }
  if (isMcqLetterCorrect(userAnswer, correctOption)) {
    return true;
  }
  if (question == null && correctOption != null) {
    const c = normalizeInlineAnswer(correctOption);
    if (c && !/^[A-D]$/i.test(c)) {
      return isInlineAnswerCorrect(userAnswer, correctOption);
    }
  }
  return false;
}

export function getVisibleMcqOptions(question) {
  return OPTION_LETTERS.filter((letter) => getOptionField(question, letter).length > 0);
}
