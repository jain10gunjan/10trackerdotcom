import OgTrackersCatalogPage from '@/features/og-trackers/components/OgTrackersCatalogPage';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import MetaDataJobs from '@/components/ui/Seo';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export const metadata = SHOW_OG_TRACKERS
  ? {
      title: 'OG Trackers',
      description: 'YouTube + LeetCode + CodeStudio learning paths',
    }
  : {
      title: 'OG Trackers — Coming soon',
      description: 'Structured learning paths are coming soon on 10Tracker.',
      robots: { index: false, follow: false },
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
      <MetaDataJobs
        seoTitle="OG Trackers"
        seoDescription="Learning paths with YouTube and coding problems"
      />
      <OgTrackersCatalogPage />
    </>
  );
}
