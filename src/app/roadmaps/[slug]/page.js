import MetaDataJobs from '@/components/Seo';
import RoadmapViewer from '@/components/roadmaps/RoadmapViewer';

export default function RoadmapSlugPage({ params }) {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <MetaDataJobs seoTitle="Roadmap" seoDescription="Structured study roadmap on 10Tracker." />
      <RoadmapViewer slug={params.slug} />
    </div>
  );
}
