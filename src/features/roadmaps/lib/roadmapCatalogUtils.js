import { examData } from '@/data/examData';

const EXAM_NAME_BY_SLUG = Object.fromEntries(
  examData.map((e) => [String(e.slug || '').toLowerCase(), e.name || e.slug])
);

export function examLabelForSlug(examSlug) {
  if (!examSlug) return null;
  const key = String(examSlug).trim().toLowerCase();
  return EXAM_NAME_BY_SLUG[key] || key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mapRoadmapCatalogRow(row) {
  const examSlug = row.exam_slug ? String(row.exam_slug).trim().toLowerCase() : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    priceInr: row.price_inr,
    freePreviewDays: row.free_preview_days || 0,
    sortOrder: row.sort_order ?? 0,
    totalDays: row.total_days ?? row.totalDays ?? 0,
    examSlug,
    examLabel: examLabelForSlug(examSlug),
  };
}

export function examCategoriesFromRoadmaps(roadmaps) {
  const set = new Set();
  (roadmaps || []).forEach((r) => {
    set.add(r.examLabel || 'General');
  });
  return ['All', ...Array.from(set).sort()];
}

export function filterAndSortRoadmaps(
  roadmaps,
  { searchTerm = '', category = 'All', sortBy = 'featured' } = {}
) {
  let list = roadmaps || [];
  const q = searchTerm.trim().toLowerCase();

  if (q) {
    list = list.filter((r) => {
      const hay = `${r.title || ''} ${r.slug || ''} ${r.description || ''} ${r.examLabel || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (category && category !== 'All') {
    list = list.filter((r) => (r.examLabel || 'General') === category);
  }

  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.priceInr - b.priceInr;
      case 'price-desc':
        return b.priceInr - a.priceInr;
      case 'days':
        return (b.totalDays || 0) - (a.totalDays || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      case 'featured':
      default:
        return (
          (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
          (b.freePreviewDays || 0) - (a.freePreviewDays || 0) ||
          a.title.localeCompare(b.title)
        );
    }
  });
}

/** Featured = lowest sort_order first; prefer roadmaps with a free preview for marketplace appeal. */
export function pickFeaturedRoadmaps(roadmaps, { limit = 3 } = {}) {
  const list = roadmaps || [];
  if (!list.length) return [];

  return [...list]
    .sort(
      (a, b) =>
        (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
        (b.freePreviewDays || 0) - (a.freePreviewDays || 0) ||
        (b.totalDays || 0) - (a.totalDays || 0)
    )
    .slice(0, limit);
}
