import ExamHubPage from '@/components/examHub/ExamHubPage';
import { fetchHubPageData } from '@/lib/examHub/fetchHubPageData';
import { normalizeCategorySlug } from '@/lib/examHub/categoryKey';
import ExamNotFound from '@/components/examHub/ExamNotFound';

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
