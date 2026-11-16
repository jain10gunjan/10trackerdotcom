import { redirect } from 'next/navigation';

export default async function PracticeUnlimitedTopicsRedirect({ params }) {
  const { category, topics } = await params;
  const slug = String(category || '').trim().toLowerCase();
  const topic = String(topics || '').trim();
  if (slug && topic) redirect(`/${slug}/practice/${encodeURIComponent(topic)}`);
  if (slug) redirect(`/${slug}`);
  redirect('/exams');
}
