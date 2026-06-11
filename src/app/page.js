import HomePageRouter from '@/components/HomePageRouter';
import { fetchGuestHomeArticles } from '@/lib/guestHome/fetchGuestHomeArticles';

export const metadata = {
  title: '10Tracker - Exam Practice, Mock Tests & Daily Updates',
  description:
    'Pick your exam and start practicing with topic-wise MCQs, mock tests, and daily updates on 10Tracker.',
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
    'study materials',
  ],
  openGraph: {
    title: '10Tracker - Exam Practice, Mock Tests & Daily Updates',
    description:
      'Pick your exam and start practicing with topic-wise MCQs, mock tests, and daily updates on 10Tracker.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '10Tracker - Exam Practice & Updates',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '10Tracker - Exam Practice, Mock Tests & Daily Updates',
    description:
      'Pick your exam and start practicing with topic-wise MCQs, mock tests, and daily updates on 10Tracker.',
    images: ['/og-image.jpg'],
  },
};

/** ISR: cache guest article sections; fresh within 2 minutes */
export const revalidate = 120;

export default async function Home() {
  const categorySections = await fetchGuestHomeArticles();
  return <HomePageRouter categorySections={categorySections} />;
}
