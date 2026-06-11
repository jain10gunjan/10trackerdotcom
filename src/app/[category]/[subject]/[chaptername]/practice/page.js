'use client';

import { Suspense } from 'react';
import ChapterPracticeApp from '@/components/practice/chapter/ChapterPracticeApp';
import ChapterPracticeSkeleton from '@/components/practice/chapter/ChapterPracticeSkeleton';

export default function ChapterPracticePage() {
  return (
    <Suspense fallback={<ChapterPracticeSkeleton />}>
      <ChapterPracticeApp />
    </Suspense>
  );
}
