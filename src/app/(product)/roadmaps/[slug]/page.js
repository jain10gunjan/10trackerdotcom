import { redirect } from 'next/navigation';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export default async function RoadmapSlugRedirect({ params }) {
  if (!SHOW_OG_TRACKERS) {
    return <OgTrackersComingSoonPage title="Study plans" eyebrow="Roadmaps" />;
  }
  const { slug } = await params;
  redirect(`/og-trackers/${slug || ''}`);
}
