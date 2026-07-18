'use client';

import { memo, useEffect, useRef } from 'react';
import { progressQuestionId } from '@/features/practice/lib/chapterPracticeUtils';

/**
 * Question map. Prefer `idList` (full difficulty index) so the map is complete
 * even when question bodies are paginated / loaded on demand.
 */
function ChapterQuestionMap({
  questions,
  idList = null,
  currentIndex,
  currentId = null,
  completedSet,
  correctSet,
  flagSet,
  onSelect,
  compact = false,
  visibleIndices = null,
}) {
  const curRef = useRef(null);
  const visible = visibleIndices ? new Set(visibleIndices) : null;

  const items = idList?.length
    ? idList.map((id, i) => ({ id: progressQuestionId(id), index: i, label: i + 1 }))
    : (questions ?? []).map((q, i) => ({
        id: progressQuestionId(q._id),
        index: i,
        label: i + 1,
      }));

  useEffect(() => {
    curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIndex, currentId]);

  return (
    <div
      className={`grid gap-2 ${
        compact ? 'grid-cols-8 sm:grid-cols-10' : 'grid-cols-6 sm:grid-cols-8'
      }`}
    >
      {items.map((item) => {
        if (visible && !visible.has(item.index)) return null;
        const qid = item.id;
        const ok = correctSet.has(qid);
        const bad = completedSet.has(qid) && !ok;
        const flagged = flagSet?.has?.(qid);
        const cur = currentId
          ? currentId === qid
          : item.index === currentIndex;

        let cls =
          'border-neutral-200 bg-white text-neutral-600 hover:border-emerald-300 hover:bg-emerald-50';
        if (cur) cls = 'border-emerald-500 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200';
        else if (ok) cls = 'border-emerald-300 bg-emerald-50 text-emerald-800';
        else if (bad) cls = 'border-rose-300 bg-rose-50 text-rose-800';
        else if (flagged) cls = 'border-amber-300 bg-amber-50 text-amber-800';

        return (
          <button
            key={qid || item.index}
            ref={cur ? curRef : null}
            type="button"
            onClick={() => onSelect(item.index)}
            className={`
              relative aspect-square rounded-xl border text-xs font-bold tabular-nums
              transition-all active:scale-95 ${cls}
            `}
            title={flagged ? `Q${item.label} (flagged)` : `Q${item.label}`}
          >
            {item.label}
            {flagged && !cur ? (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default memo(ChapterQuestionMap);
