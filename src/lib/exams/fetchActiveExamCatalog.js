import { examData } from '@/data/examData';
import { getStaticExamCatalog } from '@/lib/platformExams';
import { getSupabaseServer } from '@/lib/supabaseServer';

const COUNT_BY_SLUG = Object.fromEntries(
  examData.map((e) => [e.slug, e.count || 0])
);

export function mapExamCatalogRow(row) {
  const slug = String(row.slug || '').trim().toLowerCase();
  return {
    slug,
    name: row.name,
    image: row.image_url || row.image || null,
    icon: row.icon || '📚',
    description: row.description || 'Topic-wise practice with solutions',
    category: row.category || 'General',
    count: COUNT_BY_SLUG[slug] ?? row.count ?? 0,
    sortOrder: row.sort_order ?? row.sortOrder ?? 999,
    active: row.is_active !== false,
  };
}

export async function fetchActiveExamCatalog() {
  try {
    const supabase = getSupabaseServer(false);
    const { data, error } = await supabase
      .from('platform_exams')
      .select(
        'slug, name, description, category, image_url, icon, color_gradient, sort_order, is_active'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return getStaticExamCatalog()
          .filter((e) => e.is_active)
          .map(mapExamCatalogRow);
      }
      throw error;
    }

    if (Array.isArray(data)) {
      return data.map(mapExamCatalogRow);
    }

    return getStaticExamCatalog()
      .filter((e) => e.is_active)
      .map(mapExamCatalogRow);
  } catch (err) {
    console.error('fetchActiveExamCatalog', err);
    return getStaticExamCatalog()
      .filter((e) => e.is_active)
      .map(mapExamCatalogRow);
  }
}
