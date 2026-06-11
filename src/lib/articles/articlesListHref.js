export function articlesListHref({ page = 1, category = '', query = '' } = {}) {
  const params = new URLSearchParams();
  const q = String(query || '').trim();
  const cat = String(category || '').trim();

  if (q) params.set('q', q);
  if (cat) params.set('category', cat);
  if (page > 1) params.set('page', String(page));

  const qs = params.toString();
  return qs ? `/articles?${qs}` : '/articles';
}
