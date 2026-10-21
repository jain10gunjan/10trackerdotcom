import { redirect } from 'next/navigation';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export const metadata = {
  title: SHOW_OG_TRACKERS ? 'Study plans' : 'Study plans — Coming soon',
  description: SHOW_OG_TRACKERS
    ? 'Day-by-day study plans on 10Tracker.'
    : 'Day-by-day study plans are coming soon on 10Tracker.',
  ...(SHOW_OG_TRACKERS ? {} : { robots: { index: false, follow: false } }),
};

/** Legacy roadmaps URL — live product is OG Trackers when launched. */
export default function RoadmapsRedirectPage() {
  if (!SHOW_OG_TRACKERS) {
    return (
      <OgTrackersComingSoonPage title="Study plans" eyebrow="Roadmaps" />
    );
  }
  redirect('/og-trackers');
}
