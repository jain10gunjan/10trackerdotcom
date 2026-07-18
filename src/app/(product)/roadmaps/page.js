import { Suspense } from 'react';
import RoadmapsCatalogPage from '@/features/roadmaps/components/RoadmapsCatalogPage';
import { fetchRoadmapCatalog } from '@/features/roadmaps/lib/fetchRoadmapCatalog';

export const revalidate = 120;

export default async function RoadmapsPage() {
  const { roadmaps } = await fetchRoadmapCatalog();
  return (
    <Suspense fallback={null}>
      <RoadmapsCatalogPage initialRoadmaps={roadmaps} />
    </Suspense>
  );
}
