export function filterAndSortExams(exams, { searchTerm = '', category = 'All', sortBy = 'popular' } = {}) {
  let list = exams || [];
  const q = searchTerm.trim().toLowerCase();

  if (q) {
    list = list.filter((exam) => {
      const hay = `${exam.name || ''} ${exam.slug || ''} ${exam.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (category && category !== 'All') {
    list = list.filter((exam) => (exam.category || 'Other') === category);
  }

  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'questions':
        return (b.count || 0) - (a.count || 0);
      case 'popular':
      default:
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || (b.count || 0) - (a.count || 0);
    }
  });
}

export function examCategoriesFromList(exams) {
  const set = new Set();
  (exams || []).forEach((e) => set.add(e.category || 'Other'));
  return ['All', ...Array.from(set).sort()];
}

export function pickFeaturedExams(exams, { primarySlug = null, limit = 3 } = {}) {
  const list = exams || [];
  if (!list.length) return [];

  if (primarySlug) {
    const primary = list.find((e) => e.slug === primarySlug);
    const rest = list
      .filter((e) => e.slug !== primarySlug)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || (b.count || 0) - (a.count || 0));
    return [primary, ...rest].filter(Boolean).slice(0, limit);
  }

  return [...list]
    .sort((a, b) => (b.count || 0) - (a.count || 0) || (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, limit);
}
