/** Resolve exam categories a user is associated with. */

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** Display label for a category slug (gate-cse → GATE CSE). */
export function formatCategoryLabel(slug) {
  if (!slug) return "—";
  return String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @returns {{
 *   primary: string | null,
 *   targets: string[],
 *   practiced: string[],
 *   all: string[],
 * }}
 */
export function getUserCategories(user) {
  const profile = user?.profile || {};
  const primaryRaw = normalizeSlug(profile.targetExam);
  const targetSet = new Set();

  if (primaryRaw) targetSet.add(primaryRaw);
  for (const exam of Array.isArray(profile.targetExams) ? profile.targetExams : []) {
    const s = normalizeSlug(exam);
    if (s) targetSet.add(s);
  }

  const practicedSet = new Set();
  for (const area of user?.usage?.areas || []) {
    const s = normalizeSlug(area?.area);
    if (s) practicedSet.add(s);
  }

  const targets = [...targetSet];
  const practiced = [...practicedSet];
  const allSet = new Set([...targets, ...practiced]);
  const primary = primaryRaw || targets[0] || practiced[0] || null;

  return {
    primary,
    targets,
    practiced,
    all: [...allSet],
  };
}

export function userMatchesCategory(user, category) {
  if (!category || category === "all") return true;
  const needle = normalizeSlug(category);
  return getUserCategories(user).all.includes(needle);
}
