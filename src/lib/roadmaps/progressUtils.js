/** Progress helpers for roadmap days (focus_areas JSON). */

export function countTasksInDay(day) {
  if (!day?.focus_areas?.length) return 0;
  let n = 0;
  for (const fa of day.focus_areas) {
    n += Array.isArray(fa.tasks) ? fa.tasks.length : 0;
  }
  return n;
}

export function countCompletedInDay(day, progressMap) {
  if (!day?.focus_areas?.length) return 0;
  let n = 0;
  for (const fa of day.focus_areas) {
    for (const task of fa.tasks || []) {
      if (task?.task_id && progressMap[task.task_id]?.status === 'completed') {
        n += 1;
      }
    }
  }
  return n;
}

export function calculateRoadmapProgress(days, progressMap) {
  let total = 0;
  let completed = 0;
  for (const day of days || []) {
    total += countTasksInDay(day);
    completed += countCompletedInDay(day, progressMap);
  }
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { totalTasks: total, completedTasks: completed, percent };
}

export function calculateDayProgress(day, progressMap) {
  const total = countTasksInDay(day);
  const completed = countCompletedInDay(day, progressMap);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function progressMapFromRows(rows) {
  const map = {};
  for (const r of rows || []) {
    map[r.task_id] = { status: r.status, user_notes: r.user_notes || '' };
  }
  return map;
}

export function isDayUnlocked(dayNumber, freePreviewDays, purchased) {
  if (purchased) return true;
  return dayNumber <= (freePreviewDays || 0);
}

/** Slim day row for nav, streaks, and resume — no task payloads. */
export function buildDaySummary(day, unlocked, progressMap) {
  const taskCount = countTasksInDay(day);
  const completedCount = unlocked ? countCompletedInDay(day, progressMap) : 0;
  const progress = unlocked && taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const week = Math.ceil(day.day_number / 7);

  if (!unlocked) {
    return {
      id: day.id,
      day_number: day.day_number,
      time_required: day.time_required,
      locked: true,
      focus_area_labels: (day.focus_areas || []).map((fa) => fa.focus_area).filter(Boolean),
      task_count: taskCount,
      taskCount,
      completedCount: 0,
      progress: 0,
      week,
    };
  }

  return {
    id: day.id,
    day_number: day.day_number,
    time_required: day.time_required,
    notes: day.notes,
    locked: false,
    focus_area_labels: (day.focus_areas || []).map((fa) => fa.focus_area).filter(Boolean),
    taskCount,
    completedCount,
    progress,
    week,
  };
}

export function sanitizeDayForClient(day, unlocked) {
  if (!unlocked) {
    return {
      id: day.id,
      day_number: day.day_number,
      time_required: day.time_required,
      locked: true,
      focus_area_labels: (day.focus_areas || []).map((fa) => fa.focus_area).filter(Boolean),
      task_count: countTasksInDay(day),
    };
  }
  return {
    id: day.id,
    day_number: day.day_number,
    time_required: day.time_required,
    notes: day.notes,
    locked: false,
    focus_areas: day.focus_areas || [],
  };
}
