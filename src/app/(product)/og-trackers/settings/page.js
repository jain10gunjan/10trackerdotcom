import OgTrackersSettingsPage from '@/features/og-trackers/components/OgTrackersSettingsPage';
import MetaDataJobs from '@/components/ui/Seo';

export default function Page() {
  return (
    <>
      <MetaDataJobs seoTitle="OG Trackers settings" seoDescription="Judge usernames" />
      <OgTrackersSettingsPage />
    </>
  );
}
