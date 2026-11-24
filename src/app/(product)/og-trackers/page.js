import { Suspense } from 'react';
import OgTrackersCatalogPage from '@/features/og-trackers/components/OgTrackersCatalogPage';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import MetaDataJobs from '@/components/ui/Seo';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export const metadata = SHOW_OG_TRACKERS
  ? {
      title: 'OG Trackers',
      description:
        'Exam track for shared chapter paths, User track for private playlist trackers — watch, practice, and mocks on 10Tracker.',
      alternates: { canonical: '/og-trackers' },
    }
  : {
      title: 'OG Trackers — Coming soon',
      description: 'Structured learning paths are coming soon on 10Tracker.',
      robots: { index: false, follow: false },
      alternates: { canonical: '/og-trackers' },
    };

function CatalogFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500">
      Loading trackers…
    </div>
  );
}

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
        seoDescription="Exam track and User track — structured study paths with YouTube, practice, and mocks"
      />
      <Suspense fallback={<CatalogFallback />}>
        <OgTrackersCatalogPage />
      </Suspense>
    </>
  );
}
