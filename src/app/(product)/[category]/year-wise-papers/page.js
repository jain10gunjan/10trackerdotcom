import { redirect } from 'next/navigation';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';

/** Year-wise papers removed from catalog — send users back to the exam hub. */
export default async function YearWisePapersRedirect({ params }) {
  const { category } = await params;
  redirect(`/${normalizeCategorySlug(category)}`);
}
