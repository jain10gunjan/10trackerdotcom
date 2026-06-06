/**
 * Build GitHub-style activity grid from dated events.
 * @param {{ date: string, practice?: number, mock?: number }[]} events ISO date (YYYY-MM-DD)
 * @param {'90d' | '12mo'} rangeKey
 */
export function buildHeatmapGrid(events, rangeKey = '90d') {
  const days = rangeKey === '12mo' ? 365 : 90;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const byDate = new Map();
  for (const e of events || []) {
    const d = String(e.date || '').slice(0, 10);
    if (!d) continue;
    const prev = byDate.get(d) || { practice: 0, mock: 0 };
    byDate.set(d, {
      practice: prev.practice + (e.practice || 0),
      mock: prev.mock + (e.mock || 0),
    });
  }

  const cells = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const counts = byDate.get(key) || { practice: 0, mock: 0 };
    const total = counts.practice + counts.mock;
    cells.push({
      date: key,
      practice: counts.practice,
      mock: counts.mock,
      total,
      level: total === 0 ? 0 : total <= 2 ? 1 : total <= 5 ? 2 : total <= 10 ? 3 : 4,
    });
  }

  return { cells, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), days };
}

export function datesFromMockAttempts(attempts) {
  const events = [];
  for (const a of attempts || []) {
    for (const field of ['submitted_at', 'started_at', 'created_at']) {
      const raw = a[field];
      if (!raw) continue;
      const day = new Date(raw).toISOString().slice(0, 10);
      events.push({ date: day, mock: 1 });
    }
  }
  return events;
}

export function datesFromPracticeRows(rows) {
  const events = [];
  for (const r of rows || []) {
    const raw = r.updated_at || r.created_at;
    if (!raw) continue;
    events.push({ date: new Date(raw).toISOString().slice(0, 10), practice: 1 });
  }
  return events;
}

export function mergeActivityEvents(...lists) {
  const byDate = new Map();
  for (const list of lists) {
    for (const e of list) {
      const d = e.date;
      if (!d) continue;
      const prev = byDate.get(d) || { practice: 0, mock: 0 };
      byDate.set(d, {
        practice: prev.practice + (e.practice || 0),
        mock: prev.mock + (e.mock || 0),
      });
    }
  }
  return [...byDate.entries()].map(([date, v]) => ({ date, ...v }));
}

/** Streak stats from merged daily activity events */
export function computeStreakStats(events) {
  const activeDates = new Set(
    (events || [])
      .filter((e) => (e.practice || 0) + (e.mock || 0) > 0)
      .map((e) => String(e.date).slice(0, 10))
  );

  if (!activeDates.size) {
    return { activeDays: 0, currentStreak: 0, maxStreak: 0 };
  }

  const sorted = [...activeDates].sort();
  const activeDays = sorted.length;

  let maxStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const curr = new Date(`${sorted[i]}T00:00:00`);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      run += 1;
      maxStreak = Math.max(maxStreak, run);
    } else if (diffDays > 1) {
      run = 1;
    }
  }

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  let checkedToday = false;

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (activeDates.has(key)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (!checkedToday && cursor.getTime() === today.getTime()) {
      checkedToday = true;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { activeDays, currentStreak, maxStreak };
}
