import DailyPracticeHub from '@/components/examHub/DailyPracticeHub';
import { normalizeCategorySlug } from '@/lib/examHub/categoryKey';

export const revalidate = 120;

export default async function DailyPracticePage({ params }) {
  const { category } = await params;
  const categorySlug = normalizeCategorySlug(category);
  return <DailyPracticeHub categorySlug={categorySlug} />;
}
