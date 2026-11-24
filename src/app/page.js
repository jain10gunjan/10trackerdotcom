import HomePageRouter from '@/components/layout/HomePageRouter';
import { fetchExamCatalog } from '@/features/exams/lib/fetchExamCatalog';
import { pickFeaturedExams } from '@/features/exams/lib/examCatalogUtils';
import { fetchRoadmapCatalog } from '@/features/roadmaps/lib/fetchRoadmapCatalog';
import { pickFeaturedRoadmaps } from '@/features/roadmaps/lib/roadmapCatalogUtils';
import { SHOW_ROADMAPS } from '@/lib/siteNav';

const homeTitle = '10Tracker - Exam Practice, Mocks & OG Trackers';
const homeDescription =
  'Practice topic-wise MCQs and timed mocks, then follow OG Tracker paths — free to start on 10Tracker.';

export const metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [
    'exam preparation',
    'CAT exam',
    'GATE exam',
    'UPSC preparation',
    'JEE preparation',
    'NEET preparation',
    'competitive exams',
    'mock tests',
    'MCQ practice',
    'OG Trackers',
  ],
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '10Tracker - Exam Practice & OG Trackers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: '/',
  },
};

/** ISR: refresh featured exams within 2 minutes */
export const revalidate = 120;

export default async function Home() {
  const [exams, roadmapCatalog] = await Promise.all([
    fetchExamCatalog({ activeOnly: true }),
    SHOW_ROADMAPS ? fetchRoadmapCatalog() : Promise.resolve({ roadmaps: [] }),
  ]);

  const roadmaps = roadmapCatalog?.roadmaps || [];
  const featuredExams = pickFeaturedExams(exams, { limit: 5 });
  const featuredRoadmaps = SHOW_ROADMAPS
    ? pickFeaturedRoadmaps(roadmaps, { limit: 5 })
    : [];
  const questionCount = exams.reduce((sum, e) => sum + (e.count || 0), 0);

  return (
    <HomePageRouter
      featuredExams={featuredExams}
      featuredRoadmaps={featuredRoadmaps}
      stats={{
        examCount: exams.length,
        questionCount,
      }}
    />
  );
}
