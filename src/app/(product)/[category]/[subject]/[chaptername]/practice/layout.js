import { formatSlugTitle } from '@/features/practice/lib/chapterPracticeUtils';

export async function generateMetadata({ params }) {
  const { category, chaptername } = await params;
  const chapter = formatSlugTitle(chaptername);
  const exam = String(category ?? '').replace(/-/g, ' ').toUpperCase();

  return {
    title: `${chapter} Practice | ${exam} | 10Tracker`,
    description: `Practice ${chapter} MCQs with solutions and progress tracking on 10Tracker.`,
  };
}

export default function ChapterPracticeLayout({ children }) {
  return children;
}
