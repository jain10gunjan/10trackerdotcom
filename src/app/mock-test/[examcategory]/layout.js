import { ExamHubProvider } from '@/context/ExamHubContext';
import { fetchExamHubMeta } from '@/lib/examHub/fetchExamHubMeta';
import { normalizeCategorySlug } from '@/lib/examHub/categoryKey';
import { formatExamSlug } from '@/lib/platformExams';

export async function generateMetadata({ params }) {
  const { examcategory } = await params;
  const slug = normalizeCategorySlug(examcategory);
  const exam = await fetchExamHubMeta(slug);
  const label = exam?.name || formatExamSlug(slug);

  return {
    title: `${label} Mock Tests`,
    description: `Full-length timed mock tests for ${label}. Track scores, ranks, and detailed analytics on 10Tracker.`,
  };
}

export default async function MockTestCategoryLayout({ children, params }) {
  const { examcategory } = await params;
  const slug = normalizeCategorySlug(examcategory);
  const exam = await fetchExamHubMeta(slug);

  if (exam) {
    return (
      <ExamHubProvider exam={exam} categorySlug={slug}>
        {children}
      </ExamHubProvider>
    );
  }

  return children;
}
