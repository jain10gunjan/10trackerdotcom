import OgPathViewerPage from '@/features/og-trackers/components/OgPathViewerPage';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import MetaDataJobs from '@/components/ui/Seo';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export const metadata = {
  title: SHOW_OG_TRACKERS ? 'OG Tracker path' : 'OG Trackers — Coming soon',
  ...(SHOW_OG_TRACKERS ? {} : { robots: { index: false, follow: false } }),
};

export default function Page() {
  if (!SHOW_OG_TRACKERS) {
    return (
      <>
        <MetaDataJobs
          seoTitle="OG Trackers — Coming soon"
          seoDescription="Structured learning paths are coming soon on 10Tracker."
        />
        <OgTrackersComingSoonPage />
      </>
    );
  }

  return (
    <>
      <MetaDataJobs seoTitle="OG Tracker path" seoDescription="Learning path" />
      <OgPathViewerPage />
    </>
  );
}
