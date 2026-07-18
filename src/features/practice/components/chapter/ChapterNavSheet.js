'use client';

import { memo, useMemo } from 'react';
import { X } from 'lucide-react';
import ProgressRing from './ProgressRing';
import ChapterQuestionMap from './ChapterQuestionMap';
import { progressQuestionId } from '@/features/practice/lib/chapterPracticeUtils';

function ChapterNavSheet({
  questions,
  idList = null,
  currentIndex,
  currentId = null,
  completedSet,
  correctSet,
  flagSet,
  onSelect,
  onClose,
  hasMore,
  stats,
  user,
  unsaved,
  saving,
  onSave,
  onSignIn,
  visibleIndices = null,
}) {
  const { correctCount, wrongCount, pendingCount, firstPending } = useMemo(() => {
    const correct = questions.filter((q) => correctSet.has(progressQuestionId(q._id))).length;
    const wrong = questions.filter((q) => {
      const id = progressQuestionId(q._id);
      return completedSet.has(id) && !correctSet.has(id);
    }).length;
    const pending = questions.length - correct - wrong;
    const first = questions.findIndex((q) => !completedSet.has(progressQuestionId(q._id)));
    return {
      correctCount: correct,
      wrongCount: wrong,
      pendingCount: pending,
      firstPending: first,
    };
  }, [questions, completedSet, correctSet]);

  return (
    <>
      <button
        type="button"
        aria-label="Close question map"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden max-h-[85vh] flex flex-col rounded-t-3xl bg-white border border-neutral-200 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>

        <div className="px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Question map</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {questions.length}
              {hasMore ? '+' : ''} loaded · tap to jump
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {stats ? (
          <div className="px-4 pb-3 shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="relative shrink-0">
                <ProgressRing pct={stats.pct ?? 0} size={46} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-neutral-800">
                  {stats.pct ?? 0}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900">
                  {stats.comp ?? 0}
                  <span className="text-neutral-400 font-medium">/{stats.total ?? 0}</span> done
                </p>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  {stats.acc ?? 0}% accuracy · {stats.pts ?? 0} pts
                </p>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!unsaved || saving}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                  {unsaved > 0 ? ` (${unsaved})` : ''}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        ) : null}

        <div className="px-4 pb-3 flex flex-wrap gap-3 text-[11px] font-medium text-neutral-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Correct: <strong className="text-emerald-700">{correctCount}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Wrong: <strong className="text-rose-700">{wrongCount}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            Pending: <strong className="text-neutral-700">{pendingCount}</strong>
          </span>
        </div>

        <div className="border-t border-neutral-100 overflow-y-auto px-4 py-4 flex-1">
          <ChapterQuestionMap
            questions={questions}
            idList={idList}
            currentIndex={currentIndex}
            currentId={currentId}
            completedSet={completedSet}
            correctSet={correctSet}
            flagSet={flagSet}
            onSelect={(i) => {
              onSelect(i);
              onClose();
            }}
            compact
            visibleIndices={visibleIndices}
          />
          {firstPending !== -1 ? (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
              First unattempted: Q{firstPending + 1}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default memo(ChapterNavSheet);
