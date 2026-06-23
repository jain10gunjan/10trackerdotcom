'use client';

import { useMemo } from 'react';
import { ChevronRight, Clock, Lock } from 'lucide-react';
import { compressDayNavItems, groupByWeek } from '@/lib/roadmaps/viewerUtils';

function DayListRow({ day, onOpen }) {
  const done = day.progress >= 100;
  const labels = day.locked
    ? (day.focus_area_labels || []).slice(0, 3)
    : (day.focus_areas || day.focus_area_labels || [])
        .map((fa) => (typeof fa === 'string' ? fa : fa.focus_area))
        .filter(Boolean)
        .slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onOpen(day)}
      className={`w-full text-left rounded-2xl px-4 py-4 transition-all active:scale-[0.99] ${
        day.locked
          ? 'bg-neutral-50 ring-1 ring-neutral-200/60 cursor-pointer opacity-90 hover:opacity-100'
          : 'bg-white ring-1 ring-neutral-200/80 shadow-sm hover:shadow-md hover:ring-neutral-300/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold tabular-nums ${
            day.locked
              ? 'bg-neutral-200/60 text-neutral-500'
              : done
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-900 text-white'
          }`}
        >
          {day.locked ? <Lock className="w-4 h-4" /> : day.day_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-semibold ${day.locked ? 'text-neutral-500' : 'text-neutral-900'}`}>
              Day {day.day_number}
            </p>
            {!day.locked ? (
              <span className="text-sm font-semibold tabular-nums text-neutral-600">{day.progress}%</span>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Locked
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {day.locked
              ? `${labels.join(' · ')}${day.task_count ? ` · ${day.task_count} tasks` : ''}`
              : `${day.completedCount}/${day.taskCount} tasks${labels.length ? ` · ${labels.join(' · ')}` : ''}`}
          </p>

          {day.time_required ? (
            <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {day.time_required}
            </p>
          ) : null}

          {!day.locked && day.notes?.trim() ? (
            <p className="text-xs text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed">{day.notes.trim()}</p>
          ) : null}

          {!day.locked ? (
            <div className="mt-2.5 h-1 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${day.progress}%` }}
              />
            </div>
          ) : null}
        </div>

        <ChevronRight
          className={`w-5 h-5 shrink-0 mt-2 ${day.locked ? 'text-neutral-300' : 'text-neutral-400'}`}
        />
      </div>
    </button>
  );
}

function LockedRangeRow({ from, to, count, onUnlock }) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="w-full text-left rounded-2xl px-4 py-3.5 bg-neutral-50 ring-1 ring-neutral-200/60 hover:bg-neutral-100/80 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-neutral-200/50 flex items-center justify-center">
          <Lock className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-600">
            {count === 1 ? `Day ${from}` : `Days ${from}–${to}`}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {count} day{count === 1 ? '' : 's'} locked · tap to unlock
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-300 shrink-0" />
      </div>
    </button>
  );
}

export default function RoadmapDayList({ dayMeta, onOpenDay, onUnlock, groupWeeks }) {
  const unlocked = useMemo(() => dayMeta.filter((d) => !d.locked), [dayMeta]);
  const weekGroups = useMemo(
    () => (groupWeeks ? groupByWeek(unlocked) : null),
    [unlocked, groupWeeks]
  );
  const flatItems = useMemo(() => compressDayNavItems(dayMeta), [dayMeta]);

  const handleOpen = (day) => {
    if (day.locked) {
      onUnlock();
      return;
    }
    onOpenDay(day.day_number);
  };

  if (groupWeeks && weekGroups) {
    const maxWeek = weekGroups.at(-1)?.[0] ?? 0;
    const lockedAfterPreview = dayMeta.filter((d) => d.locked);
    const lockedFrom = lockedAfterPreview[0]?.day_number;
    const lockedTo = lockedAfterPreview.at(-1)?.day_number;

    return (
      <div className="space-y-6">
        {weekGroups.map(([week, days]) => (
          <section key={week}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2">
              Week {week}
              {maxWeek > 1 ? ` · days ${days[0]?.day_number}–${days.at(-1)?.day_number}` : ''}
            </h3>
            <ul className="space-y-2">
              {days.map((day) => (
                <li key={day.day_number}>
                  <DayListRow day={day} onOpen={handleOpen} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {lockedAfterPreview.length >= 3 && lockedFrom ? (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2">
              Locked
            </h3>
            <LockedRangeRow
              from={lockedFrom}
              to={lockedTo}
              count={lockedAfterPreview.length}
              onUnlock={onUnlock}
            />
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {flatItems.map((item) => {
        if (item.type === 'locked-range') {
          return (
            <li key={item.key}>
              <LockedRangeRow
                from={item.from}
                to={item.to}
                count={item.count}
                onUnlock={onUnlock}
              />
            </li>
          );
        }
        return (
          <li key={item.key}>
            <DayListRow day={item.day} onOpen={handleOpen} />
          </li>
        );
      })}
    </ul>
  );
}
