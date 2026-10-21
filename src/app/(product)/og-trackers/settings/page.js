import { redirect } from 'next/navigation';
import OgTrackersSettingsPage from '@/features/og-trackers/components/OgTrackersSettingsPage';
import MetaDataJobs from '@/components/ui/Seo';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

export default function Page() {
  if (!SHOW_OG_TRACKERS) {
    redirect('/og-trackers');
  }

  return (
    <>
      <MetaDataJobs seoTitle="OG Trackers settings" seoDescription="Judge usernames" />
      <OgTrackersSettingsPage />
    </>
  );
}
