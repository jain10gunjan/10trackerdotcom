import { examData } from '@/data/examData';
import { getStaticExamCatalog } from '@/lib/platformExams';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { mapExamCatalogRow } from '@/features/exams/lib/fetchActiveExamCatalog';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';

function mapStaticExam(row) {
  return mapExamCatalogRow({
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    image_url: typeof row.image === 'string' ? row.image : null,
    icon: row.icon,
    sort_order: 0,
    is_active: row.active !== false,
  });
}

export async function fetchExamHubMeta(categorySlug) {
  const slug = normalizeCategorySlug(categorySlug);
  if (!slug) return null;

  try {
    const supabase = getSupabaseServer(false);
    const { data, error } = await supabase
      .from('platform_exams')
      .select(
        'slug, name, description, category, image_url, icon, color_gradient, sort_order, is_active'
      )
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      if (!data.is_active) return null;
      return { ...mapExamCatalogRow(data), isActive: true };
    }

    if (error && error.code !== '42P01') {
      console.error('fetchExamHubMeta', error);
    }
  } catch (err) {
    console.error('fetchExamHubMeta', err);
  }

  const staticRow =
    getStaticExamCatalog().find((e) => e.slug === slug && e.is_active !== false) ||
    examData.find((e) => e.slug === slug && e.active !== false);

  if (!staticRow) return null;
  return { ...mapStaticExam(staticRow), isActive: true };
}
