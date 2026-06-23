/** Streaks and milestone badges for roadmap progress. */

export const ROADMAP_MILESTONES = [
  { id: 'day-7', label: 'Week 1', minDays: 7, type: 'days_completed' },
  { id: 'day-30', label: '30 days', minDays: 30, type: 'days_completed' },
  { id: 'day-90', label: '90 days', minDays: 90, type: 'days_completed' },
  { id: 'half', label: '50%', minPercent: 50, type: 'percent' },
  { id: 'done', label: 'Complete', minPercent: 100, type: 'percent' },
];

/**
 * @param {Array<{ day_number: number, locked?: boolean, progress?: number }>} daySummaries
 */
export function computeCompletedDayStreak(daySummaries) {
  const unlocked = (daySummaries || [])
    .filter((d) => !d.locked)
    .sort((a, b) => a.day_number - b.day_number);

  let current = 0;
  let best = 0;

  for (const day of unlocked) {
    if ((day.progress ?? 0) >= 100) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return { currentStreak: current, bestStreak: best };
}

export function countCompletedDays(daySummaries) {
  return (daySummaries || []).filter((d) => !d.locked && (d.progress ?? 0) >= 100).length;
}

export function computeEarnedMilestones(daySummaries, progressPercent) {
  const completedDays = countCompletedDays(daySummaries);
  const earned = [];

  for (const m of ROADMAP_MILESTONES) {
    if (m.type === 'days_completed' && completedDays >= m.minDays) {
      earned.push(m);
    } else if (m.type === 'percent' && progressPercent >= m.minPercent) {
      earned.push(m);
    }
  }

  return earned;
}

/**
 * Next incomplete unlocked day, or null if all complete.
 */
export function findResumeDay(daySummaries) {
  const unlocked = (daySummaries || [])
    .filter((d) => !d.locked)
    .sort((a, b) => a.day_number - b.day_number);

  const incomplete = unlocked.find((d) => (d.progress ?? 0) < 100);
  return incomplete?.day_number ?? null;
}
