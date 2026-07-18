/** Shared HTML / LaTeX helpers for question rendering. */
import { canonicalizeLatexTags } from '@/features/practice/lib/canonicalizeQuestionContent';

export const convertLatexTags = (text) => canonicalizeLatexTags(text);

export const convertRelativeImageUrls = (text) => {
  if (!text) return text;
  const textStr = String(text);
  if (!textStr.includes('/wp-content/uploads/GATE')) return textStr;
  // Prefer already-mirrored Supabase URLs when present; otherwise absolute practicepaper URLs.
  // Mirroring is performed server-side on SSR / bodies fetch into article-images/gate-pyq/.
  return textStr.replace(
    /(<img[^>]*src=["'])(\/wp-content\/uploads\/GATE[^"']*)(["'])/gi,
    '$1https://practicepaper.in$2$3'
  );
};

/** Convert newlines for UPSC and GATE stems/options that store plain text breaks. */
export const convertNewlinesToBreaks = (text, shouldNormalize) => {
  if (!text || !shouldNormalize) return text;
  let processed = String(text);
  processed = processed.replace(/\\n/g, '<br />');
  processed = processed.replace(/\r\n/g, '<br />');
  processed = processed.replace(/\r/g, '<br />');
  processed = processed.replace(/\n/g, '<br />');
  return processed;
};

export const CODE_PRE_REGEX = /<pre([^>]*)>([\s\S]*?)<\/pre>/gi;

export const extractLanguageFromPre = (preAttrs) => {
  if (!preAttrs) return null;
  const classMatch = /class=["']([^"']*)["']/i.exec(preAttrs);
  if (!classMatch) return null;
  const classes = classMatch[1].split(/\s+/);
  const langClass = classes.find((cls) => cls.startsWith('lang-'));
  if (!langClass) return null;
  const raw = langClass.replace('lang-', '').toLowerCase();
  if (raw === 'c_cpp') return 'cpp';
  return raw || null;
};
