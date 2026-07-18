/**
 * Detect & parse GATE-style "Statement for Linked Answer Questions"
 * HTML (statement + multiple numbered MCQs with embedded <ol> options).
 *
 * Returns null for normal questions so callers can keep existing UI.
 */

import { normalizeAnswerOption } from '@/lib/questionAnswerMode';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/** Cheap pre-check — avoid DOMParser on ordinary MCQs. */
const LINKED_HINT_RE =
  /Statement\s+for\s+Linked\s+Answer|Linked\s+Answer\s+Questions/i;

const UPPER_ALPHA_OL_RE = /list-style-type\s*:\s*upper-alpha/gi;

const NUMBERED_STEM_RE = /^\s*(\d{1,3})\.\s*/;

function normalizeOptionText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function optionsMatchDb(subOptions, question) {
  if (!subOptions?.length || !question) return false;
  return OPTION_LETTERS.every((letter, i) => {
    const db = normalizeOptionText(question[`options_${letter}`]);
    const sub = normalizeOptionText(subOptions[i] || '');
    if (!db && !sub) return true;
    return db.length > 0 && sub.length > 0 && db === sub;
  });
}

function isUpperAlphaList(el) {
  if (!el || el.tagName !== 'OL') return false;
  const style = (el.getAttribute('style') || '').toLowerCase();
  const type = (el.getAttribute('type') || '').toLowerCase();
  return style.includes('upper-alpha') || type === 'a';
}

function innerHtmlOf(el) {
  return el?.innerHTML?.trim() || '';
}

function textContentOf(el) {
  return el?.textContent?.replace(/\u00a0/g, ' ').trim() || '';
}

/**
 * @param {string} html
 * @returns {{ statementHtml: string, subQuestions: Array<{ number: string|null, stemHtml: string, options: string[] }> } | null}
 */
export function parseLinkedQuestionSet(html) {
  if (!html || typeof html !== 'string') return null;
  if (typeof DOMParser === 'undefined') return null;

  const upperAlphaCount = (html.match(UPPER_ALPHA_OL_RE) || []).length;
  const hasLinkedHint = LINKED_HINT_RE.test(html);
  if (!hasLinkedHint && upperAlphaCount < 2) return null;

  let doc;
  try {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return null;
  }

  const root =
    doc.querySelector('[itemprop="text"]') ||
    doc.body;

  if (!root) return null;

  let nodes = Array.from(root.childNodes).filter((n) => {
    if (n.nodeType === 3 /* TEXT_NODE */) return (n.textContent || '').trim().length > 0;
    if (n.nodeType === 1 /* ELEMENT_NODE */) {
      const tag = n.tagName;
      if (tag === 'A' && n.getAttribute('name')) return false;
      return true;
    }
    return false;
  });

  // Unwrap a single content wrapper div (scraped pages often nest once)
  if (
    nodes.length === 1 &&
    nodes[0].nodeType === 1 &&
    nodes[0].tagName === 'DIV' &&
    !isUpperAlphaList(nodes[0])
  ) {
    nodes = Array.from(nodes[0].childNodes).filter((n) => {
      if (n.nodeType === 3) return (n.textContent || '').trim().length > 0;
      return n.nodeType === 1;
    });
  }

  const statementParts = [];
  const subQuestions = [];
  let current = null;
  let seenNumbered = false;

  const flushCurrent = () => {
    if (!current) return;
    if (current.stemHtml || current.options.length > 0) {
      subQuestions.push({
        number: current.number,
        stemHtml: current.stemHtml,
        options: current.options.slice(0, 4),
      });
    }
    current = null;
  };

  for (const node of nodes) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const t = node.textContent.trim();
      if (!t) continue;
      if (!seenNumbered) statementParts.push(t);
      else if (current) current.stemHtml += (current.stemHtml ? ' ' : '') + t;
      continue;
    }

    const el = /** @type {Element} */ (node);
    const tag = el.tagName;

    if (isUpperAlphaList(el)) {
      const items = Array.from(el.querySelectorAll(':scope > li')).map((li) => innerHtmlOf(li));
      if (items.length >= 2) {
        if (!current) {
          current = { number: null, stemHtml: '', options: [] };
          seenNumbered = true;
        }
        current.options = items;
        flushCurrent();
      }
      continue;
    }

    if (tag === 'P' || tag === 'DIV') {
      const text = textContentOf(el);
      const numMatch = NUMBERED_STEM_RE.exec(text);

      if (numMatch) {
        flushCurrent();
        seenNumbered = true;
        const clone = el.cloneNode(true);
        // Strip leading "76. " from first text node for cleaner stem (keep rest of HTML)
        const owner = clone.ownerDocument || doc;
        const walker = owner.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        const firstText = walker.nextNode();
        if (firstText?.textContent) {
          firstText.textContent = firstText.textContent.replace(NUMBERED_STEM_RE, '');
        }
        current = {
          number: numMatch[1],
          stemHtml: innerHtmlOf(clone),
          options: [],
        };
        continue;
      }

      // Empty / spacer paragraphs between blocks
      if (!text || text === '\n') continue;

      if (!seenNumbered) {
        statementParts.push(el.outerHTML);
      } else if (current) {
        current.stemHtml += el.outerHTML;
      } else {
        statementParts.push(el.outerHTML);
      }
      continue;
    }

    if (tag === 'OL' || tag === 'UL') {
      // Non-alpha lists belong to statement or stem
      if (!seenNumbered) statementParts.push(el.outerHTML);
      else if (current) current.stemHtml += el.outerHTML;
      continue;
    }

    if (!seenNumbered) statementParts.push(el.outerHTML);
    else if (current) current.stemHtml += el.outerHTML;
  }

  flushCurrent();

  const usable = subQuestions.filter((sq) => sq.options.length >= 2);
  if (usable.length < 2) return null;

  const statementHtml = statementParts.join('').trim();
  // Require a real shared statement, or the linked-answer cue in the original HTML
  if (!statementHtml && !hasLinkedHint) return null;

  return {
    statementHtml:
      statementHtml ||
      '<p><strong>Linked Answer Questions</strong></p>',
    subQuestions: usable,
  };
}

/**
 * Resolve per-subquestion correct letters.
 * Primary format: `correct_option: "A_&_D"` (one letter per linked part).
 * Also accepts legacy `"A|D"`. A single letter falls back to matching options_A–D.
 *
 * @returns {(string|null)[]}
 */
export const LINKED_CORRECT_SEP = '_&_';

export function splitLinkedCorrectOption(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return [];

  if (s.includes(LINKED_CORRECT_SEP)) {
    return s.split(LINKED_CORRECT_SEP).map((p) => normalizeAnswerOption(p.trim()));
  }
  // Legacy pipe form from earlier iteration
  if (s.includes('|') && !/^[A-D]$/i.test(s)) {
    return s.split('|').map((p) => normalizeAnswerOption(p.trim()));
  }
  return [normalizeAnswerOption(s)];
}

/** Build `A_&_D` from letter array (pads/truncates to `count` when provided). */
export function joinLinkedCorrectOption(letters, count) {
  const list = Array.isArray(letters) ? [...letters] : [];
  const n = typeof count === 'number' && count > 0 ? count : list.length;
  const padded = Array.from({ length: n }, (_, i) => {
    const letter = normalizeAnswerOption(list[i]);
    return /^[A-D]$/.test(letter) ? letter : '';
  });
  return padded.join(LINKED_CORRECT_SEP);
}

export function resolveLinkedCorrectOptions(question, linkedSet) {
  const n = linkedSet?.subQuestions?.length || 0;
  if (!n) return [];

  const raw = String(question?.correct_option ?? '').trim();
  if (!raw) return Array(n).fill(null);

  const isMulti =
    raw.includes(LINKED_CORRECT_SEP) ||
    (raw.includes('|') && !/^[A-D]$/i.test(raw));

  if (isMulti) {
    const parts = splitLinkedCorrectOption(raw);
    return Array.from({ length: n }, (_, i) => {
      const letter = parts[i];
      return /^[A-D]$/.test(letter) ? letter : null;
    });
  }

  const letter = normalizeAnswerOption(raw);
  const result = Array(n).fill(null);
  if (!/^[A-D]$/.test(letter)) return result;

  let matchedIdx = -1;
  for (let i = 0; i < n; i++) {
    if (optionsMatchDb(linkedSet.subQuestions[i].options, question)) {
      matchedIdx = i;
      break;
    }
  }
  result[matchedIdx >= 0 ? matchedIdx : 0] = letter;
  return result;
}

/** True when every linked part has a known A–D key. */
export function linkedCorrectKeysComplete(correctLetters, partCount) {
  if (!partCount || !Array.isArray(correctLetters)) return false;
  if (correctLetters.length < partCount) return false;
  return correctLetters.slice(0, partCount).every((l) => /^[A-D]$/.test(l));
}

/** Memo-friendly stable check used by QuestionCard. */
export function getLinkedQuestionSet(question) {
  if (!question) return null;
  return parseLinkedQuestionSet(question.question);
}
