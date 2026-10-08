import OgTrackersCatalogPage from '@/features/og-trackers/components/OgTrackersCatalogPage';
import MetaDataJobs from '@/components/ui/Seo';

export const metadata = {
  title: 'OG Trackers',
  description: 'YouTube + LeetCode + CodeStudio learning paths',
};

export default function Page() {
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
