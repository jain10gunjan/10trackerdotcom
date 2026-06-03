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
