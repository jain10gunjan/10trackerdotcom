import OgPathViewerPage from '@/features/og-trackers/components/OgPathViewerPage';
import MetaDataJobs from '@/components/ui/Seo';

export default function Page() {
  return (
    <>
      <MetaDataJobs seoTitle="OG Tracker path" seoDescription="Learning path" />
      <OgPathViewerPage />
    </>
  );
}
