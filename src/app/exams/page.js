import ExamsCatalogPage from '@/components/exams/ExamsCatalogPage';
import { fetchActiveExamCatalog } from '@/lib/exams/fetchActiveExamCatalog';

export const revalidate = 120;

export default async function ExamsPage() {
  const exams = await fetchActiveExamCatalog();
  return <ExamsCatalogPage initialExams={exams} />;
}
