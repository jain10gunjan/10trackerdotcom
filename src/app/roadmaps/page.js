import RoadmapsCatalogPage from '@/components/roadmaps/RoadmapsCatalogPage';
import { fetchRoadmapCatalog } from '@/lib/roadmaps/fetchRoadmapCatalog';

export const revalidate = 120;

export default async function RoadmapsPage() {
  const { roadmaps } = await fetchRoadmapCatalog();
  return <RoadmapsCatalogPage initialRoadmaps={roadmaps} />;
}
