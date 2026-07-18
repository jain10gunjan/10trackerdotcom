export const metadata = {
  title: 'Exam Catalog | 10Tracker',
  description:
    'Browse all active competitive exams on 10Tracker. Practice topic-wise MCQs and take mock tests for UPSC, GATE, aptitude, and more.',
  keywords: [
    'competitive exams',
    'exam preparation',
    'GATE exam',
    'UPSC preparation',
    'mock tests',
    'MCQ practice',
    '10Tracker',
  ],
  openGraph: {
    title: 'Exam Catalog | 10Tracker',
    description:
      'Browse all active competitive exams on 10Tracker. Practice topic-wise MCQs and take mock tests.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exam Catalog | 10Tracker',
    description:
      'Browse all active competitive exams on 10Tracker. Practice topic-wise MCQs and take mock tests.',
  },
};

export default function ExamsLayout({ children }) {
  return children;
}
