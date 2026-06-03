/**
 * Leaderboard aggregation for mock tests (best % per test, overall average of bests).
 */

export const LEADERBOARD_PERIODS = {
  all: { label: 'All time', days: null },
  week: { label: 'This week', days: 7 },
  month: { label: 'This month', days: 30 },
};

export function periodStartDate(periodKey) {
  const cfg = LEADERBOARD_PERIODS[periodKey];
  if (!cfg?.days) return null;
  const d = new Date();
  d.setDate(d.getDate() - cfg.days);
  return d.toISOString();
}

export function scoreFromAttempt(attempt) {
  const pct = Number(attempt?.percentage);
  if (!Number.isNaN(pct)) return pct;
  const score = Number(attempt?.score);
  if (!Number.isNaN(score)) return score;
  return 0;
}

export function filterAttemptsByPeriod(attempts, periodKey) {
  const start = periodStartDate(periodKey);
  if (!start) return attempts;
  return (attempts || []).filter((a) => {
    const at = a.submitted_at || a.started_at;
    return at && new Date(at) >= new Date(start);
  });
}

/** Best score per user for one test */
export function buildPerTestLeaderboard(attempts, profilesMap = {}, limit = 50) {
  const byUser = new Map();

  for (const row of attempts || []) {
    const email = row.user_email;
    if (!email) continue;
    const score = scoreFromAttempt(row);
    const prev = byUser.get(email);
    if (!prev || score > prev.score) {
      byUser.set(email, {
        userEmail: email,
        score,
        durationTaken: row.duration_taken ?? null,
        submittedAt: row.submitted_at,
        attemptId: row.id,
      });
    }
  }

  const sorted = [...byUser.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.durationTaken ?? 999999) - (b.durationTaken ?? 999999);
  });

  return sorted.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...entry,
    displayName: profilesMap[entry.userEmail]?.display_name || maskEmail(entry.userEmail),
    avatarUrl: profilesMap[entry.userEmail]?.avatar_url || null,
  }));
}

/** Overall: average of each user's best % per test (category) */
export function buildOverallLeaderboard(attempts, testIdsInCategory, profilesMap = {}, limit = 100) {
  const testIdSet = new Set(testIdsInCategory || []);
  const userTestBests = new Map();

  for (const row of attempts || []) {
    if (testIdSet.size && !testIdSet.has(row.test_id)) continue;
    const email = row.user_email;
    if (!email) continue;
    const score = scoreFromAttempt(row);
    if (!userTestBests.has(email)) userTestBests.set(email, new Map());
    const perTest = userTestBests.get(email);
    const prev = perTest.get(row.test_id) ?? 0;
    if (score > prev) perTest.set(row.test_id, score);
  }

  const aggregated = [];
  for (const [email, perTest] of userTestBests) {
    const scores = [...perTest.values()];
    if (!scores.length) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    aggregated.push({
      userEmail: email,
      score: Math.round(avg * 100) / 100,
      testsCompleted: scores.length,
      totalTests: testIdSet.size || perTest.size,
    });
  }

  aggregated.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.testsCompleted - a.testsCompleted;
  });

  return aggregated.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...entry,
    displayName: profilesMap[entry.userEmail]?.display_name || maskEmail(entry.userEmail),
    avatarUrl: profilesMap[entry.userEmail]?.avatar_url || null,
  }));
}

export function findUserRank(entries, userEmail) {
  if (!userEmail) return null;
  const idx = entries.findIndex((e) => e.userEmail === userEmail);
  if (idx < 0) return null;
  return { ...entries[idx], rank: idx + 1 };
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return 'Student';
  const [local, domain] = email.split('@');
  const shown = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}***`;
  return `${shown}@${domain}`;
}
