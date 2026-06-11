import { getSupabaseServer } from '@/lib/supabaseServer';
import { fetchActiveMockTests } from '@/lib/mockTestUtils';
import { fetchExamHubMeta } from '@/lib/examHub/fetchExamHubMeta';
import { fetchExamSubjects } from '@/lib/examHub/fetchExamSubjects';
import { categorySlugToDbKey } from '@/lib/examHub/categoryKey';

async function fetchDailyPracticeCount(categorySlug) {
  try {
    const supabase = getSupabaseServer(false);
    const dbCategory = categorySlugToDbKey(categorySlug);
    const { count, error } = await supabase
      .from('daily_practice_sets')
      .select('id', { count: 'exact', head: true })
      .eq('category', dbCategory)
      .eq('is_active', true);

    if (error) {
      if (error.code === '42P01') return 0;
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}

export async function fetchHubPageData(categorySlug) {
  const exam = await fetchExamHubMeta(categorySlug);
  if (!exam) return null;

  const [subjects, mockResult, dailyPracticeCount] = await Promise.all([
    fetchExamSubjects(categorySlug),
    fetchActiveMockTests(getSupabaseServer(false), categorySlug).catch(() => ({ data: [] })),
    fetchDailyPracticeCount(categorySlug),
  ]);

  return {
    exam,
    subjects,
    mockTestCount: mockResult?.data?.length || 0,
    dailyPracticeCount,
  };
}
