import HomePageRouter from '@/components/HomePageRouter';
import { fetchActiveExamCatalog } from '@/lib/exams/fetchActiveExamCatalog';
import { pickFeaturedExams } from '@/lib/exams/examCatalogUtils';
import { fetchRoadmapCatalog } from '@/lib/roadmaps/fetchRoadmapCatalog';
import { pickFeaturedRoadmaps } from '@/lib/roadmaps/roadmapCatalogUtils';

export const metadata = {
  title: '10Tracker - Exam Practice & Study Roadmaps',
  description:
    'Practice topic-wise MCQs and mock tests, or follow structured day-by-day roadmaps for competitive exam preparation on 10Tracker.',
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
    'study roadmaps',
  ],
  openGraph: {
    title: '10Tracker - Exam Practice & Study Roadmaps',
    description:
      'Practice topic-wise MCQs and mock tests, or follow structured day-by-day roadmaps for competitive exam preparation on 10Tracker.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '10Tracker - Exam Practice & Roadmaps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '10Tracker - Exam Practice & Study Roadmaps',
    description:
      'Practice topic-wise MCQs and mock tests, or follow structured day-by-day roadmaps for competitive exam preparation on 10Tracker.',
    images: ['/og-image.jpg'],
  },
};

/** ISR: refresh featured exams and roadmaps within 2 minutes */
export const revalidate = 120;

export default async function Home() {
  const [exams, { roadmaps }] = await Promise.all([
    fetchActiveExamCatalog(),
    fetchRoadmapCatalog(),
  ]);

  const featuredExams = pickFeaturedExams(exams, { limit: 5 });
  const featuredRoadmaps = pickFeaturedRoadmaps(roadmaps, { limit: 5 });
  const questionCount = exams.reduce((sum, e) => sum + (e.count || 0), 0);

  return (
    <HomePageRouter
      featuredExams={featuredExams}
      featuredRoadmaps={featuredRoadmaps}
      stats={{
        examCount: exams.length,
        roadmapCount: roadmaps.length,
        questionCount,
      }}
    />
  );
}
