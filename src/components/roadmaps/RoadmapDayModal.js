'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import RoadmapTaskPanel from '@/components/roadmaps/RoadmapTaskPanel';
import RoadmapSaveBar from '@/components/roadmaps/RoadmapSaveBar';

const MODAL_OPEN_ATTR = 'data-roadmap-day-modal';

export default function RoadmapDayModal({
  open,
  day,
  dayProgress,
  mergedMap,
  serverMap,
  draft,
  hydrated,
  onToggle,
  onNotesChange,
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

  if (!open || !day) return null;

  const showSave = isDirty && hydrated;

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
        className="relative w-full sm:max-w-2xl flex flex-col bg-white rounded-t-[1.25rem] sm:rounded-2xl shadow-2xl max-h-[min(90dvh,900px)] sm:max-h-[min(88dvh,820px)] max-sm:mb-3"
      >
        {/* Sheet handle — mobile affordance */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral-200" aria-hidden />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-neutral-100">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrevDay}
            className="p-2 rounded-xl hover:bg-neutral-100 disabled:opacity-25 disabled:pointer-events-none touch-manipulation"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={onNextDay}
            className="p-2 rounded-xl hover:bg-neutral-100 disabled:opacity-25 disabled:pointer-events-none touch-manipulation"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center min-w-0 px-0.5">
            <h2 id="roadmap-day-modal-title" className="text-base font-semibold text-neutral-900">
              Day {day.day_number}
            </h2>
            {day.time_required ? (
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{day.time_required}</p>
            ) : null}
          </div>

          <span className="text-sm font-bold tabular-nums text-emerald-600 shrink-0 w-10 text-center">
            {dayProgress}%
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {day.notes ? (
          <p className="shrink-0 mx-3 sm:mx-5 mt-2.5 text-sm text-neutral-600 leading-relaxed bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-100">
            {day.notes}
          </p>
        ) : null}

        {/* Tasks — scrollable; extra bottom space on mobile for home indicator + thumb reach */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-5 py-3 sm:py-4 max-sm:pb-8 sm:pb-4 ${
            showSave ? '' : 'max-sm:pb-10'
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
          />
          <div className="sm:hidden h-4 shrink-0" aria-hidden />
        </div>

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
            className="shrink-0 sm:hidden h-[calc(env(safe-area-inset-bottom)+1.25rem)]"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
