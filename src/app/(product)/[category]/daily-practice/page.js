import DailyPracticeHub from '@/features/exam-hub/components/DailyPracticeHub';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';

export const revalidate = 120;

export default async function DailyPracticePage({ params }) {
  const { category } = await params;
  const categorySlug = normalizeCategorySlug(category);
  return <DailyPracticeHub categorySlug={categorySlug} />;
}
