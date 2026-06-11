import { ExamHubProvider } from '@/context/ExamHubContext';
import ExamNotFound from '@/components/examHub/ExamNotFound';
import { fetchExamHubMeta } from '@/lib/examHub/fetchExamHubMeta';
import { normalizeCategorySlug } from '@/lib/examHub/categoryKey';

export async function generateMetadata({ params }) {
  const { category } = await params;
  const exam = await fetchExamHubMeta(category);

  if (!exam) {
    return {
      title: 'Exam not found | 10Tracker',
      description: 'This exam is not available on 10Tracker.',
    };
  }

  return {
    title: `${exam.name} Practice Hub | 10Tracker`,
    description:
      exam.description ||
      `Practice ${exam.name} MCQs topic-wise with solutions, mock tests, and progress tracking on 10Tracker.`,
    openGraph: {
      title: `${exam.name} | 10Tracker`,
      description: exam.description,
      type: 'website',
    },
  };
}

export default async function CategoryLayout({ children, params }) {
  const { category } = await params;
  const slug = normalizeCategorySlug(category);
  const exam = await fetchExamHubMeta(slug);

  if (!exam) {
    return <ExamNotFound slug={slug} />;
  }

  return (
    <ExamHubProvider exam={exam} categorySlug={slug}>
      {children}
    </ExamHubProvider>
  );
}
