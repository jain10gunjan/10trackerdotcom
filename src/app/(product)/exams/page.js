import ExamsCatalogPage from '@/features/exams/components/ExamsCatalogPage';
import { fetchExamCatalog, sumQuestionCounts } from '@/features/exams/lib/fetchExamCatalog';

// Next.js only accepts a literal here. Same interval as EXAM_CATALOG_REVALIDATE_SECONDS.
export const revalidate = 120;

export const metadata = {
  title: 'Exam Catalog',
  description:
    'Browse all active competitive exams on 10Tracker. Practice topic-wise MCQs and take mock tests for UPSC, GATE, aptitude, and more.',
  alternates: { canonical: '/exams' },
  openGraph: {
    title: 'Exam Catalog',
    description:
      'Browse all active competitive exams on 10Tracker. Practice topic-wise MCQs and take mock tests for UPSC, GATE, aptitude, and more.',
    url: '/exams',
    type: 'website',
  },
};

export default async function ExamsPage() {
  const exams = await fetchExamCatalog({ activeOnly: true });
  return (
    <ExamsCatalogPage initialExams={exams} totalQuestions={sumQuestionCounts(exams)} />
  );
}
