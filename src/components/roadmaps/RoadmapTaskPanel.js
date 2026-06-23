'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { focusAreaStyle, resourceHostname } from '@/lib/roadmaps/focusAreaStyles';
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
  const host = resourceHostname(task.resources);

  return (
    <div
      className={`group relative flex gap-3 py-3.5 border-b border-neutral-100 last:border-0 transition-colors ${
        isDirty ? 'bg-amber-50/50 -mx-1 px-1 rounded-xl' : ''
      } ${completed ? 'opacity-90' : ''}`}
    >
      {isDirty ? (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-amber-400"
          title="Unsaved change"
        />
      ) : null}

      <button
        type="button"
        onClick={() => onToggle(task.task_id)}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        aria-pressed={completed}
        className={`mt-0.5 shrink-0 w-7 h-7 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all touch-manipulation active:scale-95 ${
          completed
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200/80'
            : 'border-neutral-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/30'
        }`}
      >
        {completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[15px] leading-snug pr-1 ${
              completed
                ? 'text-neutral-400 line-through decoration-neutral-300'
                : 'text-neutral-900 font-medium'
            }`}
          >
            {task.task}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                notesOpen || hasNotes
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
              aria-label={notesOpen ? 'Hide notes' : 'Add note'}
              title="Notes"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            {task.resources ? (
              <a
                href={task.resources}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 p-2 sm:pl-2 sm:pr-2.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors max-w-[120px] sm:max-w-[140px]"
                aria-label="Open resource"
                title={task.resources}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                {host ? (
                  <span className="hidden sm:inline text-[10px] font-medium truncate">{host}</span>
                ) : null}
              </a>
            ) : null}
          </div>
        </div>

        {notesOpen ? (
          <div className="mt-2.5">
            <textarea
              rows={2}
              placeholder="Reflections, links, what you learned…"
              value={progress?.user_notes ?? ''}
              onChange={(e) => onNotesChange(task.task_id, e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-300 resize-none"
            />
            {(progress?.user_notes?.length ?? 0) > 0 ? (
              <p className="mt-1 text-[10px] text-neutral-400 text-right tabular-nums">
                {progress.user_notes.length} chars
              </p>
            ) : null}
          </div>
        ) : hasNotes ? (
          <p className="mt-2 text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100 line-clamp-2">
            {progress.user_notes}
          </p>
        ) : null}
      </div>
    </div>
  );
});

function FocusSection({
  area,
  tasks,
  mergedMap,
  serverMap,
  draft,
  hydrated,
  onToggle,
  onNotesChange,
  onSetSectionStatus,
  defaultOpen,
  incompleteOnly,
}) {
  const style = focusAreaStyle(area);
  const visibleTasks = useMemo(
    () =>
      incompleteOnly
        ? tasks.filter((t) => mergedMap[t.task_id]?.status !== 'completed')
        : tasks,
    [tasks, incompleteOnly, mergedMap]
  );
  const completedInSection = tasks.filter((t) => mergedMap[t.task_id]?.status === 'completed').length;
  const allDone = tasks.length > 0 && completedInSection === tasks.length;
  const [open, setOpen] = useState(defaultOpen ?? !allDone);

  if (incompleteOnly && visibleTasks.length === 0) return null;

  return (
    <section className={`rounded-xl overflow-hidden bg-white ring-1 ${style.ring} shadow-sm`}>
      <div className="flex items-stretch">
        <div className={`w-1 shrink-0 ${style.accent}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left hover:bg-neutral-50/80 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                open ? '' : '-rotate-90'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${style.light} ${style.text}`}
                >
                  {area}
                </span>
                {allDone ? (
                  <span className="text-[10px] font-semibold text-emerald-600">Done</span>
                ) : null}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1 tabular-nums">
                {completedInSection}/{tasks.length} tasks
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-xs font-bold tabular-nums text-neutral-700">
                {tasks.length ? Math.round((completedInSection / tasks.length) * 100) : 0}%
              </span>
              <div className="w-20 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${style.accent}`}
                  style={{
                    width: `${tasks.length ? (completedInSection / tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </button>

          {open && !allDone ? (
            <div className="px-3 sm:px-4 pb-2 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onSetSectionStatus(
                    tasks.filter((t) => mergedMap[t.task_id]?.status !== 'completed').map((t) => t.task_id),
                    'completed'
                  )
                }
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 py-1.5 px-1"
              >
                Mark section done
              </button>
            </div>
          ) : null}

          {open ? (
            <div className="px-3 sm:px-4 pb-2 border-t border-neutral-100">
              {visibleTasks.length === 0 ? (
                <p className="py-4 text-center text-xs text-neutral-400">All tasks in this section are done.</p>
              ) : (
                visibleTasks.map((task) => (
                  <TaskRow
                    key={task.task_id}
                    task={task}
                    progress={mergedMap[task.task_id]}
                    isDirty={hydrated && isTaskDirty(serverMap, draft, task.task_id)}
                    onToggle={onToggle}
                    onNotesChange={onNotesChange}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
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
  onSetAllTasksStatus,
  onPrevDay,
  onNextDay,
  hasPrev,
  hasNext,
}) {
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [expandAll, setExpandAll] = useState(null);

  const sections = useMemo(() => {
    return (day?.focus_areas || []).map((fa) => ({
      area: fa.focus_area,
      tasks: fa.tasks || [],
    }));
  }, [day]);

  const allTaskIds = useMemo(
    () => sections.flatMap((s) => s.tasks.map((t) => t.task_id)),
    [sections]
  );

  const completedCount = useMemo(
    () => allTaskIds.filter((id) => mergedMap[id]?.status === 'completed').length,
    [allTaskIds, mergedMap]
  );

  const allDone = allTaskIds.length > 0 && completedCount === allTaskIds.length;

  const handleSetSectionStatus = useCallback(
    (taskIds, status) => {
      onSetAllTasksStatus?.(taskIds, status);
    },
    [onSetAllTasksStatus]
  );

  if (!day) {
    if (embedded) return null;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <p className="text-neutral-500 text-sm">Pick a day to view tasks</p>
      </div>
    );
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <button
        type="button"
        onClick={() => setIncompleteOnly((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-colors ${
          incompleteOnly
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        {incompleteOnly ? 'Showing todo' : 'Show todo only'}
      </button>
      <button
        type="button"
        onClick={() => setExpandAll((v) => (v === true ? false : true))}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
      >
        <Layers className="w-3.5 h-3.5" />
        {expandAll === false ? 'Expand all' : 'Collapse all'}
      </button>
      {allTaskIds.length > 0 ? (
        <button
          type="button"
          onClick={() =>
            onSetAllTasksStatus?.(
              allDone
                ? allTaskIds
                : allTaskIds.filter((id) => mergedMap[id]?.status !== 'completed'),
              allDone ? 'not_completed' : 'completed'
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 ml-auto"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          {allDone ? 'Reset day' : 'Mark all done'}
        </button>
      ) : null}
    </div>
  );

  const taskContent = (
    <div className={embedded ? '' : 'p-4 sm:p-6'}>
      {embedded ? toolbar : null}
      <div className={embedded ? 'space-y-3' : 'space-y-3'}>
        {sections.map((sec, i) => (
          <FocusSection
            key={`${sec.area}-${i}-${expandAll}`}
            area={sec.area}
            tasks={sec.tasks}
            mergedMap={mergedMap}
            serverMap={serverMap}
            draft={draft}
            hydrated={hydrated}
            onToggle={onToggle}
            onNotesChange={onNotesChange}
            onSetSectionStatus={handleSetSectionStatus}
            defaultOpen={expandAll === null ? i === 0 : expandAll}
            incompleteOnly={incompleteOnly}
          />
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <>
        {allDone ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Day complete — nice work!</p>
          </div>
        ) : null}
        {taskContent}
      </>
    );
  }

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

export function useDayTaskStats(day, mergedMap) {
  return useMemo(() => {
    const tasks = (day?.focus_areas || []).flatMap((fa) => fa.tasks || []);
    const total = tasks.length;
    const completed = tasks.filter((t) => mergedMap[t.task_id]?.status === 'completed').length;
    return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [day, mergedMap]);
}
