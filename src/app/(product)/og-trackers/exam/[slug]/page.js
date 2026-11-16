import OgExamHubPage from '@/features/og-trackers/components/OgExamHubPage';
import OgTrackersComingSoonPage from '@/features/og-trackers/components/OgTrackersComingSoonPage';
import MetaDataJobs from '@/components/ui/Seo';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export const metadata = SHOW_OG_TRACKERS
  ? {
      title: 'OG Trackers — Exam',
      description: 'Chapter-wise study trackers for your exam on 10Tracker.',
    }
  : {
      title: 'OG Trackers — Coming soon',
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
        seoTitle="OG Trackers — Exam chapters"
        seoDescription="Open a chapter tracker — watch, practice, mock."
      />
      <OgExamHubPage />
    </>
  );
}
