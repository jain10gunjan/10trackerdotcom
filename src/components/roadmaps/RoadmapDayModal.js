'use client';

import { useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Sparkles, StickyNote, X } from 'lucide-react';
import RoadmapTaskPanel from '@/components/roadmaps/RoadmapTaskPanel';
import RoadmapSaveBar from '@/components/roadmaps/RoadmapSaveBar';
import RoadmapProgressRing from '@/components/roadmaps/RoadmapProgressRing';

const MODAL_OPEN_ATTR = 'data-roadmap-day-modal';

export default function RoadmapDayModal({
  open,
  day,
  dayProgress,
  totalDays,
  totalTasks,
  completedTasks,
  mergedMap,
  serverMap,
  draft,
  hydrated,
  onToggle,
  onNotesChange,
  onSetAllTasksStatus,
  onClose,
  onPrevDay,
  onNextDay,
  hasPrev,
  hasNext,
  isDirty,
  dirtyCount,
  saving,
  onSave,
  onDiscard,
}) {
  useEffect(() => {
    if (!open) return undefined;
    document.documentElement.setAttribute(MODAL_OPEN_ATTR, 'open');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'INPUT') return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrevDay();
      if (e.key === 'ArrowRight' && hasNext) onNextDay();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.removeAttribute(MODAL_OPEN_ATTR);
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, onPrevDay, onNextDay, hasPrev, hasNext]);

  const taskStats = useMemo(() => {
    const total = totalTasks ?? 0;
    const completed = completedTasks ?? 0;
    return { total, completed, percent: dayProgress ?? 0 };
  }, [totalTasks, completedTasks, dayProgress]);

  if (!open || !day) return null;

  const showSave = isDirty && hydrated;
  const dayComplete = taskStats.total > 0 && taskStats.completed === taskStats.total;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-neutral-900/55 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-day-modal-title"
        className="relative w-full sm:max-w-2xl flex flex-col bg-white rounded-t-[1.35rem] sm:rounded-2xl shadow-2xl shadow-neutral-900/20 max-h-[min(92dvh,900px)] sm:max-h-[min(88dvh,820px)] max-sm:mb-2 ring-1 ring-neutral-200/80"
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral-200" aria-hidden />
        </div>

        {/* Header */}
        <div className="shrink-0 border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50/50">
          <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrevDay}
              className="p-2 rounded-xl hover:bg-white disabled:opacity-25 disabled:pointer-events-none touch-manipulation border border-transparent hover:border-neutral-200"
              aria-label="Previous day"
              title="Previous day (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNextDay}
              className="p-2 rounded-xl hover:bg-white disabled:opacity-25 disabled:pointer-events-none touch-manipulation border border-transparent hover:border-neutral-200"
              aria-label="Next day"
              title="Next day (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 px-1">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h2 id="roadmap-day-modal-title" className="text-base sm:text-lg font-bold text-neutral-900">
                  Day {day.day_number}
                </h2>
                {totalDays ? (
                  <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                    of {totalDays}
                  </span>
                ) : null}
                {dayComplete ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <Sparkles className="w-3 h-3" />
                    Complete
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                {day.time_required ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                    <Clock className="w-3 h-3" />
                    {day.time_required}
                  </span>
                ) : null}
                {taskStats.total > 0 ? (
                  <span className="text-[11px] font-medium text-neutral-500 tabular-nums">
                    {taskStats.completed}/{taskStats.total} tasks
                  </span>
                ) : null}
              </div>
            </div>

            <RoadmapProgressRing percent={taskStats.percent} size={52} label="" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white text-neutral-500 hover:text-neutral-900 touch-manipulation border border-transparent hover:border-neutral-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {taskStats.total > 0 ? (
            <div className="px-4 pb-3">
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dayComplete ? 'bg-emerald-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${taskStats.percent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {day.notes?.trim() ? (
          <div className="shrink-0 mx-3 sm:mx-4 mt-3 flex gap-2.5 rounded-xl bg-amber-50/60 border border-amber-100/80 px-3 py-2.5">
            <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/80 mb-0.5">
                Focus for today
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">{day.notes.trim()}</p>
            </div>
          </div>
        ) : null}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 ${
            showSave ? '' : 'max-sm:pb-8'
          }`}
        >
          <RoadmapTaskPanel
            embedded
            day={day}
            mergedMap={mergedMap}
            serverMap={serverMap}
            draft={draft}
            hydrated={hydrated}
            onToggle={onToggle}
            onNotesChange={onNotesChange}
            onSetAllTasksStatus={onSetAllTasksStatus}
          />
        </div>

        {!showSave ? (
          <div className="shrink-0 hidden sm:flex items-center justify-center gap-3 px-4 py-2 border-t border-neutral-100 bg-neutral-50/50 text-[10px] text-neutral-400">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white border border-neutral-200">←</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-white border border-neutral-200">→</kbd> days
            </span>
            <span className="w-px h-3 bg-neutral-200" />
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white border border-neutral-200">Esc</kbd> close
            </span>
          </div>
        ) : null}

        {showSave ? (
          <RoadmapSaveBar
            embedded
            dirtyCount={dirtyCount}
            saving={saving}
            onSave={onSave}
            onDiscard={onDiscard}
          />
        ) : (
          <div
            className="shrink-0 sm:hidden h-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
