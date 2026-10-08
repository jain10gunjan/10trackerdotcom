import { redirect } from 'next/navigation';

export default async function RoadmapSlugRedirect({ params }) {
  const { slug } = await params;
  redirect(`/og-trackers/${slug || ''}`);
}
