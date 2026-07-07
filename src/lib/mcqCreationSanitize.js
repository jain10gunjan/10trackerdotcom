import sanitizeHtml from "sanitize-html";

const MCQ_ALLOWED_TAGS = [
  "b",
  "strong",
  "i",
  "em",
  "ul",
  "ol",
  "li",
  "br",
  "p",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "span",
  "div",
];

const MCQ_ALLOWED_ATTRIBUTES = {
  "*": ["class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

/** Sanitize MCQ question / solution / direction HTML before render. */
export function sanitizeMcqHtml(html) {
  if (!html) return "";
  return sanitizeHtml(String(html), {
    allowedTags: MCQ_ALLOWED_TAGS,
    allowedAttributes: MCQ_ALLOWED_ATTRIBUTES,
  });
}
