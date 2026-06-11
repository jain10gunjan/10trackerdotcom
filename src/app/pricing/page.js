import PricingPage from '@/components/pricing/PricingPage';
import { fetchRoadmapCatalog } from '@/lib/roadmaps/fetchRoadmapCatalog';

export const revalidate = 120;

export default async function PricingRoute() {
  const { roadmaps } = await fetchRoadmapCatalog();
  return <PricingPage initialRoadmaps={roadmaps} />;
}
