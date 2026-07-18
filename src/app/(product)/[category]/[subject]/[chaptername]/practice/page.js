import { Suspense } from 'react';
import ChapterPracticeApp from '@/features/practice/components/chapter/ChapterPracticeApp';
import ChapterPracticeSkeleton from '@/features/practice/components/chapter/ChapterPracticeSkeleton';
import { fetchChapterPracticeInitialData } from '@/features/practice/lib/server/chapterQuestions';
import {
  QUESTIONS_PER_PAGE,
  DIFFICULTIES,
} from '@/features/practice/lib/chapterPracticeUtils';

function ChapterPracticeClient({ initialData }) {
  return (
    <Suspense fallback={<ChapterPracticeSkeleton />}>
      <ChapterPracticeApp initialData={initialData} />
    </Suspense>
  );
}

export default async function ChapterPracticePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const category = resolvedParams?.category;
  const chaptername = resolvedParams?.chaptername;
  const chapter = chaptername ? String(chaptername).replace(/-/g, ' ') : '';
  const difficultyRaw = String(resolvedSearch?.difficulty ?? 'easy').toLowerCase();
  const difficulty = DIFFICULTIES.includes(difficultyRaw) ? difficultyRaw : 'easy';

  let initialData = null;
  if (category && chapter) {
    try {
      initialData = await fetchChapterPracticeInitialData({
        category,
        chapter,
        difficulty,
        page: 1,
        limit: QUESTIONS_PER_PAGE,
      });
    } catch (e) {
      console.error('SSR chapter practice bootstrap failed', e);
      initialData = null;
    }
  }

  return <ChapterPracticeClient initialData={initialData} />;
}
