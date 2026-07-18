import PricingPage from '@/features/pricing/components/PricingPage';
import { fetchRoadmapCatalog } from '@/features/roadmaps/lib/fetchRoadmapCatalog';

export const revalidate = 120;

export default async function PricingRoute() {
  const { roadmaps } = await fetchRoadmapCatalog();
  return <PricingPage initialRoadmaps={roadmaps} />;
}
