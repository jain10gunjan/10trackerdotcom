import { calculateDayProgress, countTasksInDay } from '@/lib/roadmaps/progressUtils';

export function buildDayMeta(days, progressMap) {
  return (days || []).map((day) => {
    if (day.locked) {
      return {
        ...day,
        progress: 0,
        taskCount: day.task_count || day.taskCount || 0,
        completedCount: 0,
        week: Math.ceil(day.day_number / 7),
      };
    }

    const hasTaskPayload = (day.focus_areas || []).some((fa) => fa.tasks?.length);
    if (!hasTaskPayload && day.taskCount != null) {
      return {
        ...day,
        progress: calculateDayProgressFromMap(day, progressMap) ?? day.progress ?? 0,
        taskCount: day.taskCount,
        completedCount: day.completedCount ?? 0,
        week: Math.ceil(day.day_number / 7),
      };
    }

    const taskCount = countTasksInDay(day);
    let completedCount = 0;
    for (const fa of day.focus_areas || []) {
      for (const t of fa.tasks || []) {
        if (progressMap[t.task_id]?.status === 'completed') completedCount += 1;
      }
    }
    return {
      ...day,
      progress: calculateDayProgress(day, progressMap),
      taskCount,
      completedCount,
      week: Math.ceil(day.day_number / 7),
    };
  });
}

function calculateDayProgressFromMap(day, progressMap) {
  if (!day.focus_areas?.length) return day.progress ?? 0;
  return calculateDayProgress(day, progressMap);
}

/** Collapse long runs of locked days for sidebar performance & clarity. */
export function compressDayNavItems(days, minRun = 3) {
  const items = [];
  let lockedRun = [];

  const flushLocked = () => {
    if (!lockedRun.length) return;
    if (lockedRun.length >= minRun) {
      items.push({
        type: 'locked-range',
        key: `locked-${lockedRun[0].day_number}-${lockedRun.at(-1).day_number}`,
        from: lockedRun[0].day_number,
        to: lockedRun.at(-1).day_number,
        count: lockedRun.length,
      });
    } else {
      for (const d of lockedRun) items.push({ type: 'day', key: d.id || d.day_number, day: d });
    }
    lockedRun = [];
  };

  for (const day of days) {
    if (day.locked) {
      lockedRun.push(day);
    } else {
      flushLocked();
      items.push({ type: 'day', key: day.id || day.day_number, day });
    }
  }
  flushLocked();
  return items;
}

export function groupByWeek(dayMeta) {
  const weeks = new Map();
  for (const day of dayMeta) {
    const w = day.week;
    if (!weeks.has(w)) weeks.set(w, []);
    weeks.get(w).push(day);
  }
  return [...weeks.entries()].sort(([a], [b]) => a - b);
}

export function extractFocusAreas(dayMeta) {
  const set = new Set();
  for (const d of dayMeta || []) {
    const labels =
      d.focus_area_labels ||
      (d.focus_areas || []).map((fa) => fa.focus_area).filter(Boolean);
    for (const label of labels) {
      if (label) set.add(label);
    }
  }
  return [...set].sort();
}

export function filterDayMetaByFocus(dayMeta, focusArea) {
  if (!focusArea || focusArea === 'All') return dayMeta;
  const target = focusArea.toLowerCase();
  return dayMeta.filter((d) => {
    const labels = d.focus_area_labels || (d.focus_areas || []).map((fa) => fa.focus_area);
    return labels.some((fa) => fa?.toLowerCase() === target);
  });
}

export function filterDayMeta(dayMeta, query) {
  const q = query.trim().toLowerCase();
  if (!q) return dayMeta;
  return dayMeta.filter((d) => {
    if (`day ${d.day_number}`.includes(q)) return true;
    if (d.locked) {
      return (d.focus_area_labels || []).some((fa) => fa.toLowerCase().includes(q));
    }
    return (d.focus_areas || []).some(
      (fa) =>
        fa.focus_area?.toLowerCase().includes(q) ||
        (fa.tasks || []).some((t) => t.task?.toLowerCase().includes(q))
    );
  });
}

/** Merge lightweight summaries with loaded full day payloads. */
export function mergeSummariesWithDays(summaries, loadedDays) {
  const byNum = Object.fromEntries((loadedDays || []).map((d) => [d.day_number, d]));
  return (summaries || []).map((s) => {
    const full = byNum[s.day_number];
    if (!full) return s;
    return { ...s, ...full, progress: s.progress, completedCount: s.completedCount, taskCount: s.taskCount };
  });
}

export function findNextUnlockedDay(dayMeta, current, direction = 1) {
  const unlocked = dayMeta.filter((d) => !d.locked);
  const idx = unlocked.findIndex((d) => d.day_number === current);
  if (idx === -1) return unlocked[0]?.day_number ?? null;
  const next = unlocked[idx + direction];
  return next?.day_number ?? current;
}
