/** Admin mock-test URLs under /admin/mock-tests */

export function mockTestAdminBase(examcategory) {
  const slug = String(examcategory || 'gate-cse').trim().toLowerCase();
  return `/admin/mock-tests/${slug}`;
}

export function mockTestAdminCreate(examcategory, query) {
  const base = `${mockTestAdminBase(examcategory)}/create`;
  if (!query) return base;
  const q = new URLSearchParams(query).toString();
  return q ? `${base}?${q}` : base;
}

export function categoryLabelFromSlug(slug) {
  return String(slug || '')
    .trim()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
