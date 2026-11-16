import { redirect } from 'next/navigation';

export default async function PracticeUnlimitedCategoryRedirect({ params }) {
  const { category } = await params;
  const slug = String(category || '').trim().toLowerCase();
  if (slug) redirect(`/${slug}`);
  redirect('/exams');
}
