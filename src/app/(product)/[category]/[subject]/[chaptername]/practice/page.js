import { Suspense } from 'react';
import ChapterPracticeApp from '@/features/practice/components/chapter/ChapterPracticeApp';
import ChapterPracticeSkeleton from '@/features/practice/components/chapter/ChapterPracticeSkeleton';
import { fetchChapterPracticeInitialData } from '@/features/practice/lib/server/chapterQuestions';
import {
  QUESTIONS_PER_PAGE,
  DIFFICULTIES,
  sanitizePracticeParam,
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
  const category = sanitizePracticeParam(resolvedParams?.category);
  const subject = sanitizePracticeParam(resolvedParams?.subject);
  // Keep URL slug as-is (e.g. atoms-and-nuclei) — resolver matches chapter column variants.
  const chapter = sanitizePracticeParam(resolvedParams?.chaptername);
  const difficultyRaw = String(resolvedSearch?.difficulty ?? 'easy').toLowerCase();
  const difficulty = DIFFICULTIES.includes(difficultyRaw) ? difficultyRaw : 'easy';

  let initialData = null;
  if (category && chapter) {
    try {
      initialData = await fetchChapterPracticeInitialData({
        category,
        subject,
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
