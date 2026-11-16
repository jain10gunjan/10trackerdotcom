import OgTrackersCatalogPage from '@/features/og-trackers/components/OgTrackersCatalogPage';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import MetaDataJobs from '@/components/ui/Seo';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export const metadata = SHOW_OG_TRACKERS
  ? {
      title: 'OG Trackers',
      description:
        'Structured GATE, DSA, and placement study paths — YouTube lessons, practice, mocks, and coding progress on 10Tracker.',
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
        seoDescription="Structured study paths with YouTube, practice, mocks, and coding progress"
      />
      <OgTrackersCatalogPage />
    </>
  );
}
