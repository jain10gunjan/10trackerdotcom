import { examData } from '@/data/examData';

/** Fallback when platform_exams table is empty or unavailable */
export function getStaticExamCatalog() {
  return examData.map((e, i) => ({
    slug: e.slug,
    name: e.name,
    description: e.description || '',
    category: e.category || '',
    image_url: typeof e.image === 'string' ? e.image : null,
    icon: e.icon || null,
    color_gradient: e.color || null,
    sort_order: i * 10,
    is_active: e.active !== false,
  }));
}

export function examBySlug(slug, catalog = []) {
  const s = String(slug || '').trim().toLowerCase();
  return catalog.find((e) => e.slug === s) || null;
}

export function formatExamSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Practice hub for an exam — matches /[category] routes (e.g. /upsc-prelims). */
export function practiceHrefForSlug(slug) {
  const s = String(slug || '').trim().toLowerCase();
  if (!s) return '/exams';
  return `/${s}`;
}

export function mockTestHrefForSlug(slug) {
  return `/mock-test/${String(slug || '').trim().toLowerCase()}`;
}
