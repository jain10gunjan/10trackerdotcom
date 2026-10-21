import ExamsCatalogPage from '@/features/exams/components/ExamsCatalogPage';
import { fetchExamCatalog } from '@/features/exams/lib/fetchExamCatalog';

export const revalidate = 120;

export default async function ExamsPage() {
  const exams = await fetchExamCatalog({ activeOnly: true });
  return <ExamsCatalogPage initialExams={exams} />;
}
