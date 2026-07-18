/**
 * Canonicalize question HTML / latex for consistent MathJax rendering.
 */

export function canonicalizeLatexTags(text) {
  if (!text) return text;
  return String(text)
    .replace(/\[latex\]/gi, '$')
    .replace(/\[\/latex\]/gi, '$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
}

export function canonicalizeQuestionHtml(html) {
  if (!html) return html;
  let t = String(html);
  t = canonicalizeLatexTags(t);
  // Collapse Word-style empty paragraphs
  t = t.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '');
  // Normalize <br> variants
  t = t.replace(/<br\s*\/?>/gi, '<br />');
  return t.trim();
}

export function canonicalizeQuestionRow(row) {
  if (!row || typeof row !== 'object') return row;
  const next = { ...row };
  for (const key of [
    'question',
    'options_A',
    'options_B',
    'options_C',
    'options_D',
    'solution',
    'solutiontext',
    'directionHTML',
    'questionextratext',
  ]) {
    if (typeof next[key] === 'string' && next[key]) {
      next[key] = canonicalizeQuestionHtml(next[key]);
    }
  }
  return next;
}
