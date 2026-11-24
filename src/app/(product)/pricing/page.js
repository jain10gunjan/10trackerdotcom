import PricingPage from '@/features/pricing/components/PricingPage';
import { fetchRoadmapCatalog } from '@/features/roadmaps/lib/fetchRoadmapCatalog';

export const revalidate = 120;

export const metadata = {
  title: 'Plans & Pricing',
  description:
    'Unlimited practice and mock tests on 10Tracker. OG Trackers are free. AI playlist builder is included on 3-month and 6-month plans.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Plans & Pricing',
    description:
      'Unlimited practice and mock tests on 10Tracker. OG Trackers are free. AI playlist builder is included on 3-month and 6-month plans.',
    url: '/pricing',
    type: 'website',
  },
};

export default async function PricingRoute({ searchParams }) {
  const params = await searchParams;
  const subscribed = params?.subscribed === '1';
  const { roadmaps } = await fetchRoadmapCatalog();
  return <PricingPage initialRoadmaps={roadmaps} subscribed={subscribed} />;
}
