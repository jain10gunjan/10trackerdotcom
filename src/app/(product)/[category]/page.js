import { notFound } from 'next/navigation';
import ExamHubPage from '@/features/exam-hub/components/ExamHubPage';
import { fetchHubPageData } from '@/features/exam-hub/lib/fetchHubPageData';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';

export const revalidate = 120;

export async function generateMetadata({ params }) {
  const { category } = await params;
  const slug = normalizeCategorySlug(category);
  const data = await fetchHubPageData(slug);

  if (!data) {
    return {
      title: 'Exam not found',
      description: 'This exam is not available on 10Tracker.',
      robots: { index: false, follow: false },
    };
  }

  const name = data.exam?.name || slug;
  const description =
    data.exam?.description ||
    `Practice topic-wise MCQs and mock tests for ${name} on 10Tracker.`;

  return {
    title: `${name} Practice Hub`,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: `${name} Practice Hub`,
      description,
      url: `/${slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryHubPage({ params }) {
  const { category } = await params;
  const slug = normalizeCategorySlug(category);
  const data = await fetchHubPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <ExamHubPage
      exam={data.exam}
      categorySlug={slug}
      initialSubjects={data.subjects}
      mockTestCount={data.mockTestCount}
      topicMockCount={data.topicMockCount}
      dailyPracticeCount={data.dailyPracticeCount}
    />
  );
}
