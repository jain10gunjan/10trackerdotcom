/** URL slug → DB category key (e.g. gate-cse → GATE-CSE) */
export function categorySlugToDbKey(slug) {
  return String(slug || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, '-');
}

export function normalizeCategorySlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

export function categoryDisplayName(slug, fallbackName) {
  if (fallbackName) return fallbackName;
  return normalizeCategorySlug(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
