'use client';

import { memo, useEffect, useRef } from 'react';
import { progressQuestionId } from '@/lib/practice/chapterPracticeUtils';

function ChapterQuestionMap({
  questions,
  currentIndex,
  completedSet,
  correctSet,
  onSelect,
  compact = false,
}) {
  const curRef = useRef(null);

  useEffect(() => {
    curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIndex]);

  return (
    <div
      className={`grid gap-2 ${
        compact
          ? 'grid-cols-8 sm:grid-cols-10'
          : 'grid-cols-6 sm:grid-cols-8'
      }`}
    >
      {questions.map((q, i) => {
        const qid = progressQuestionId(q._id);
        const ok = correctSet.has(qid);
        const bad = completedSet.has(qid) && !ok;
        const cur = i === currentIndex;

        let cls =
          'border-neutral-200 bg-white text-neutral-600 hover:border-emerald-300 hover:bg-emerald-50';
        if (cur) cls = 'border-emerald-500 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200';
        else if (ok) cls = 'border-emerald-300 bg-emerald-50 text-emerald-800';
        else if (bad) cls = 'border-rose-300 bg-rose-50 text-rose-800';

        return (
          <button
            key={q._id}
            ref={cur ? curRef : null}
            type="button"
            onClick={() => onSelect(i)}
            className={`
              relative aspect-square rounded-xl border text-xs font-bold tabular-nums
              transition-all active:scale-95 ${cls}
            `}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export default memo(ChapterQuestionMap);
