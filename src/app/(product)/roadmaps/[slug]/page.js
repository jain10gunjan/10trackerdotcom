import RoadmapViewer from '@/features/roadmaps/components/RoadmapViewer';
import { getRoadmapBySlug, normalizeSlug } from '@/features/roadmaps/lib/roadmapService';

export async function generateMetadata({ params }) {
  const { slug: slugParam } = await params;
  const slug = normalizeSlug(slugParam);
  const roadmap = await getRoadmapBySlug(slug);

  if (!roadmap?.is_active) {
    return {
      title: 'Roadmap | 10Tracker',
      description: 'Structured study roadmap on 10Tracker.',
    };
  }

  const description =
    roadmap.description?.trim().slice(0, 160) ||
    `Structured ${roadmap.title} study roadmap with day-by-day tasks on 10Tracker.`;

  return {
    title: `${roadmap.title} | 10Tracker Roadmaps`,
    description,
    openGraph: {
      title: `${roadmap.title} | 10Tracker`,
      description,
      type: 'website',
    },
  };
}

export default async function RoadmapSlugPage({ params }) {
  const { slug: slugParam } = await params;
  const slug = normalizeSlug(slugParam);
  const roadmap = await getRoadmapBySlug(slug);

  const initialMeta =
    roadmap?.is_active
      ? {
          slug: roadmap.slug,
          title: roadmap.title,
          description: roadmap.description,
          priceInr: roadmap.price_inr,
          freePreviewDays: roadmap.free_preview_days,
        }
      : null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <RoadmapViewer slug={slug} initialMeta={initialMeta} />
    </div>
  );
}
