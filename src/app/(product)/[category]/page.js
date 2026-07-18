import ExamHubPage from '@/features/exam-hub/components/ExamHubPage';
import { fetchHubPageData } from '@/features/exam-hub/lib/fetchHubPageData';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import ExamNotFound from '@/features/exam-hub/components/ExamNotFound';

export const revalidate = 120;

export default async function CategoryHubPage({ params }) {
  const { category } = await params;
  const slug = normalizeCategorySlug(category);
  const data = await fetchHubPageData(slug);

  if (!data) {
    return <ExamNotFound slug={slug} />;
  }

  return (
    <ExamHubPage
      exam={data.exam}
      categorySlug={slug}
      initialSubjects={data.subjects}
      mockTestCount={data.mockTestCount}
      dailyPracticeCount={data.dailyPracticeCount}
    />
  );
}
