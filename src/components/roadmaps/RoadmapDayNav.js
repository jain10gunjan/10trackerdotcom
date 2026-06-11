'use client';

import { memo, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { compressDayNavItems, groupByWeek } from '@/lib/roadmaps/viewerUtils';

const COMPACT_WEEK_THRESHOLD = 14;

function DayPill({ day, selected, onSelect }) {
  const done = day.progress >= 100;
  return (
    <button
      type="button"
      onClick={() => onSelect(day.day_number)}
      className={`shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl text-xs font-semibold tabular-nums transition-all ${
        selected
          ? 'bg-neutral-900 text-white shadow-md scale-105'
          : done
            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
            : 'bg-white text-neutral-700 ring-1 ring-neutral-200/80 hover:ring-neutral-300'
      }`}
      title={`Day ${day.day_number} · ${day.progress}%`}
    >
      {day.day_number}
    </button>
  );
}

const SidebarDay = memo(function SidebarDay({ day, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(day.day_number)}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
        selected ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'
      }`}
    >
      <span
        className={`w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-xs font-bold tabular-nums ${
          selected
            ? 'bg-white/15 text-white'
            : day.progress >= 100
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-neutral-100 text-neutral-700'
        }`}
      >
        {day.day_number}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-neutral-800'}`}>
            {day.completedCount}/{day.taskCount} tasks
          </span>
          <span className={`text-[11px] tabular-nums ${selected ? 'text-neutral-300' : 'text-neutral-400'}`}>
            {day.progress}%
          </span>
        </div>
        <div className={`mt-1 h-0.5 rounded-full overflow-hidden ${selected ? 'bg-white/20' : 'bg-neutral-100'}`}>
          <div
            className={`h-full rounded-full transition-all ${selected ? 'bg-white' : 'bg-emerald-500'}`}
            style={{ width: `${day.progress}%` }}
          />
        </div>
      </div>
    </button>
  );
});

function LockedRange({ from, to, count, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-neutral-400 hover:bg-neutral-50"
    >
      <Lock className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 text-xs font-medium">
        {count === 1 ? `Day ${from} locked` : `Days ${from}–${to} locked`}
      </span>
      {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function RoadmapDayNav({
  dayMeta,
  selectedDayNum,
  onSelectDay,
  jumpValue,
  onJumpChange,
  onJumpSubmit,
  useWeekGroups,
}) {
  const [expandedLocked, setExpandedLocked] = useState({});
  const unlocked = useMemo(() => dayMeta.filter((d) => !d.locked), [dayMeta]);
  const locked = useMemo(() => dayMeta.filter((d) => d.locked), [dayMeta]);
  const navItems = useMemo(() => compressDayNavItems(dayMeta), [dayMeta]);
  const weekGroups = useMemo(
    () => (useWeekGroups ? groupByWeek(unlocked) : []),
    [unlocked, useWeekGroups]
  );
  const lockedNavItems = useMemo(
    () => (useWeekGroups && locked.length ? compressDayNavItems(locked, 1) : []),
    [useWeekGroups, locked]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: horizontal scroller */}
      <div className="lg:hidden -mx-1">
        <div className="flex gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-thin overscroll-x-contain">
          {unlocked.map((day) => (
            <DayPill
              key={day.day_number}
              day={day}
              selected={day.day_number === selectedDayNum}
              onSelect={onSelectDay}
            />
          ))}
          {dayMeta.some((d) => d.locked) ? (
            <div className="shrink-0 flex items-center gap-1 px-2 text-neutral-400">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-medium">+{dayMeta.filter((d) => d.locked).length}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Jump to day — scales for 100+ day roadmaps */}
      {dayMeta.length > 7 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onJumpSubmit();
          }}
          className="flex gap-2"
        >
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Jump to day…"
            value={jumpValue}
            onChange={(e) => onJumpChange(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border-0 bg-neutral-100 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
          <button
            type="submit"
            className="shrink-0 px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
          >
            Go
          </button>
        </form>
      ) : null}

      {/* Desktop sidebar */}
      <nav className="hidden lg:block max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain pr-0.5 space-y-0.5">
        {useWeekGroups
          ? (
              <>
                {weekGroups.map(([week, days]) => (
                  <div key={week} className="mb-3">
                    <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Week {week}
                    </p>
                    <div className="space-y-0.5">
                      {days.map((day) => (
                        <SidebarDay
                          key={day.day_number}
                          day={day}
                          selected={day.day_number === selectedDayNum}
                          onSelect={onSelectDay}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {lockedNavItems.length ? (
                  <div className="pt-2 mt-2 border-t border-neutral-100">
                    {lockedNavItems.map((item) =>
                      item.type === 'locked-range' ? (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 px-2.5 py-2 text-xs text-neutral-400"
                        >
                          <Lock className="w-3 h-3 shrink-0" />
                          {item.count === 1
                            ? `Day ${item.from} locked`
                            : `${item.count} days locked (${item.from}–${item.to})`}
                        </div>
                      ) : (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-400"
                        >
                          <Lock className="w-3 h-3" />
                          Day {item.day.day_number}
                        </div>
                      )
                    )}
                  </div>
                ) : null}
              </>
            )
          : navItems.map((item) => {
              if (item.type === 'locked-range') {
                const key = item.key;
                const isExpanded = expandedLocked[key];
                if (!isExpanded) {
                  return (
                    <LockedRange
                      key={key}
                      from={item.from}
                      to={item.to}
                      count={item.count}
                      expanded={false}
                      onToggle={() => setExpandedLocked((p) => ({ ...p, [key]: true }))}
                    />
                  );
                }
                return (
                  <div key={key} className="space-y-0.5 pl-1 border-l border-neutral-100 ml-2">
                    <LockedRange
                      from={item.from}
                      to={item.to}
                      count={item.count}
                      expanded
                      onToggle={() => setExpandedLocked((p) => ({ ...p, [key]: false }))}
                    />
                    {dayMeta
                      .filter((d) => d.locked && d.day_number >= item.from && d.day_number <= item.to)
                      .map((day) => (
                        <div
                          key={day.day_number}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-400"
                        >
                          <Lock className="w-3 h-3" />
                          Day {day.day_number}
                        </div>
                      ))}
                  </div>
                );
              }
              const day = item.day;
              return (
                <SidebarDay
                  key={item.key}
                  day={day}
                  selected={day.day_number === selectedDayNum}
                  onSelect={onSelectDay}
                />
              );
            })}
      </nav>
    </div>
  );
}

export { COMPACT_WEEK_THRESHOLD };
