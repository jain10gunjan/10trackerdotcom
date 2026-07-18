import ExamsCatalogPage from '@/features/exams/components/ExamsCatalogPage';
import { fetchActiveExamCatalog } from '@/features/exams/lib/fetchActiveExamCatalog';

export const revalidate = 120;

export default async function ExamsPage() {
  const exams = await fetchActiveExamCatalog();
  return <ExamsCatalogPage initialExams={exams} />;
}
