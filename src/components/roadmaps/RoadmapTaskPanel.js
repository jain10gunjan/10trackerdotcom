'use client';

import { memo, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';
import { isTaskDirty } from '@/lib/roadmaps/draftStore';

const TaskRow = memo(function TaskRow({
  task,
  progress,
  isDirty,
  onToggle,
  onNotesChange,
}) {
  const completed = progress?.status === 'completed';
  const hasNotes = Boolean(progress?.user_notes?.trim());
  const [notesOpen, setNotesOpen] = useState(hasNotes);

  return (
    <div
      className={`group flex gap-3 py-3 border-b border-neutral-100 last:border-0 ${
        isDirty ? 'bg-amber-50/40 -mx-1 px-1 rounded-lg' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(task.task_id)}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        className={`mt-0.5 shrink-0 w-6 h-6 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all touch-manipulation ${
          completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-neutral-300 hover:border-neutral-500 bg-white'
        }`}
      >
        {completed ? <Check className="w-3 h-3 stroke-[3]" /> : null}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-[15px] leading-snug ${
              completed ? 'text-neutral-400 line-through decoration-neutral-300' : 'text-neutral-900'
            }`}
          >
            {task.task}
          </p>
          {task.resources ? (
            <a
              href={task.resources}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              aria-label="Open resource"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : null}
        </div>

        {(notesOpen || hasNotes) && (
          <textarea
            rows={2}
            placeholder="Notes…"
            value={progress?.user_notes ?? ''}
            onChange={(e) => onNotesChange(task.task_id, e.target.value)}
            className="mt-2 w-full rounded-lg border-0 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 resize-none"
          />
        )}

        {!notesOpen && !hasNotes ? (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="mt-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            + Add note
          </button>
        ) : null}
      </div>
    </div>
  );
});

function FocusSection({ area, tasks, mergedMap, serverMap, draft, hydrated, onToggle, onNotesChange, defaultOpen }) {
  const completedInSection = tasks.filter((t) => mergedMap[t.task_id]?.status === 'completed').length;
  const allDone = tasks.length > 0 && completedInSection === tasks.length;
  const [open, setOpen] = useState(defaultOpen ?? !allDone);

  return (
    <section className="border border-neutral-200/80 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50/80 transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900">{area}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {completedInSection}/{tasks.length} done
          </p>
        </div>
        <div className="w-16 h-1 rounded-full bg-neutral-100 overflow-hidden shrink-0">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${tasks.length ? (completedInSection / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-1 border-t border-neutral-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.task_id}
              task={task}
              progress={mergedMap[task.task_id]}
              isDirty={hydrated && isTaskDirty(serverMap, draft, task.task_id)}
              onToggle={onToggle}
              onNotesChange={onNotesChange}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function RoadmapTaskPanel({
  embedded = false,
  day,
  dayProgress,
  mergedMap,
  serverMap,
  draft,
  hydrated,
  onToggle,
  onNotesChange,
  onPrevDay,
  onNextDay,
  hasPrev,
  hasNext,
}) {
  const sections = useMemo(() => {
    return (day?.focus_areas || []).map((fa) => ({
      area: fa.focus_area,
      tasks: fa.tasks || [],
    }));
  }, [day]);

  if (!day) {
    if (embedded) return null;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <p className="text-neutral-500 text-sm">Pick a day to view tasks</p>
      </div>
    );
  }

  const taskContent = (
    <div className={embedded ? 'space-y-3' : 'p-4 sm:p-6 space-y-3'}>
      {sections.map((sec, i) => (
        <FocusSection
          key={`${sec.area}-${i}`}
          area={sec.area}
          tasks={sec.tasks}
          mergedMap={mergedMap}
          serverMap={serverMap}
          draft={draft}
          hydrated={hydrated}
          onToggle={onToggle}
          onNotesChange={onNotesChange}
          defaultOpen={embedded ? i === 0 : i === 0}
        />
      ))}
    </div>
  );

  if (embedded) return taskContent;

  return (
    <div>
      <div className="sticky top-20 z-10 bg-neutral-50/95 backdrop-blur-sm border-b border-neutral-200/80 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrevDay}
              className="p-2 rounded-lg hover:bg-neutral-200/60 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNextDay}
              className="p-2 rounded-lg hover:bg-neutral-200/60 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              Day {day.day_number}
            </h2>
            {day.time_required ? (
              <p className="text-xs text-neutral-500 mt-0.5">{day.time_required}</p>
            ) : null}
          </div>
          <div className="text-right shrink-0 w-14">
            <p className="text-lg font-bold tabular-nums text-neutral-900">{dayProgress}%</p>
          </div>
        </div>
        {day.notes ? (
          <p className="mt-3 text-sm text-neutral-600 leading-relaxed bg-white rounded-lg px-3 py-2 border border-neutral-100">
            {day.notes}
          </p>
        ) : null}
      </div>
      {taskContent}
    </div>
  );
}
