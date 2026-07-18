/**
 * NAT-style questions: all options_A–D empty, answer typed as plain text.
 * correct_option holds the exact numerical/text value(s) — not LaTeX or A/B/C/D.
 *
 * Multiple accepted answers: pipe-separated plain values, e.g. "42|42.0"
 */

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const NUMERIC_TOLERANCE = 1e-6;

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

/** Parse "1/2", "0.5", "2.50", "-3" into a number, or null if not numeric. */
export function parseNumericAnswer(value) {
  const s = normalizeInlineAnswer(value).replace(/,/g, '');
  if (!s) return null;
  const frac = /^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/.exec(s);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function numbersNearlyEqual(a, b, tolerance = NUMERIC_TOLERANCE) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= tolerance * scale;
}

export function isInlineAnswerCorrect(userAnswer, correctOption) {
  const normalized = normalizeInlineAnswer(userAnswer);
  if (!normalized) return false;
  const accepted = parseAcceptedAnswers(correctOption);
  if (accepted.length === 0) return false;
  if (accepted.some((answer) => normalized === answer)) return true;

  const userNum = parseNumericAnswer(normalized);
  if (userNum == null) return false;
  return accepted.some((answer) => {
    const acceptedNum = parseNumericAnswer(answer);
    return acceptedNum != null && numbersNearlyEqual(userNum, acceptedNum);
  });
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
