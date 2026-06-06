import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  datesFromMockAttempts,
  datesFromPracticeRows,
  mergeActivityEvents,
} from '@/lib/activityHeatmap';

function looksLikeEmail(value) {
  const v = String(value || '').trim();
  return v.includes('@') && v.includes('.');
}

function toDay(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function maxIso(...values) {
  let best = null;
  for (const v of values) {
    if (!v) continue;
    const t = new Date(v).getTime();
    if (Number.isNaN(t)) continue;
    if (!best || t > new Date(best).getTime()) best = v;
  }
  return best;
}

function daysAgo(dayStr, today = new Date()) {
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  const d = new Date(`${dayStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.floor((end - d) / (24 * 60 * 60 * 1000));
}

function countActiveDaysInWindow(events, windowDays, today = new Date()) {
  const days = new Set();
  for (const e of events || []) {
    const age = daysAgo(e.date, today);
    if (age >= 0 && age < windowDays) days.add(e.date);
  }
  return days.size;
}

function countInWindow(events, windowDays, field, today = new Date()) {
  let n = 0;
  for (const e of events || []) {
    const age = daysAgo(e.date, today);
    if (age >= 0 && age < windowDays) n += e[field] || 0;
  }
  return n;
}

/**
 * Engagement tiers (admin dashboard):
 * - regular: 3+ active days in last 14d
 * - returning: active in last 14d but not regular
 * - new: first-ever activity within last 7d
 * - at_risk: last activity 15–30d ago
 * - dormant: 30d+ inactive or never practiced
 */
export function computeEngagement(activity, now = new Date()) {
  const events = activity?.events || [];
  const lastActiveAt = activity?.lastActiveAt || null;
  const lastDay = toDay(lastActiveAt);
  const daysSinceActive = lastDay ? daysAgo(lastDay, now) : Infinity;

  const activeDays7 = countActiveDaysInWindow(events, 7, now);
  const activeDays14 = countActiveDaysInWindow(events, 14, now);
  const activeDays30 = countActiveDaysInWindow(events, 30, now);
  const practice30 = countInWindow(events, 30, 'practice', now);
  const mock30 = countInWindow(events, 30, 'mock', now);

  const firstActivityDay = activity?.firstActivityAt
    ? toDay(activity.firstActivityAt)
    : events.length
      ? events.map((e) => e.date).sort()[0]
      : null;
  const isNew =
    firstActivityDay != null && daysAgo(firstActivityDay, now) <= 7 && activeDays30 <= 7;

  let tier = 'dormant';
  if (!lastActiveAt && events.length === 0) {
    tier = 'never';
  } else if (isNew && activeDays14 < 3) {
    tier = 'new';
  } else if (activeDays14 >= 3) {
    tier = 'regular';
  } else if (daysSinceActive <= 14) {
    tier = 'returning';
  } else if (daysSinceActive <= 30) {
    tier = 'at_risk';
  }

  return {
    lastActiveAt,
    firstActivityAt: activity?.firstActivityAt || (firstActivityDay ? `${firstActivityDay}T00:00:00.000Z` : null),
    activeDays7,
    activeDays14,
    activeDays30,
    practiceSessions30: practice30,
    mockAttempts30: mock30,
    daysSinceActive: Number.isFinite(daysSinceActive) ? daysSinceActive : null,
    tier,
  };
}

export function buildActivityBuckets({ progressRows = [], attemptRows = [], clerkIdToEmail = {} }) {
  const buckets = new Map();

  const ensure = (key) => {
    const k = String(key || '').trim();
    if (!k) return null;
    if (!buckets.has(k)) {
      buckets.set(k, {
        key: k,
        email: looksLikeEmail(k) ? normalizeEmail(k) : null,
        progressRows: [],
        attempts: [],
      });
    }
    return buckets.get(k);
  };

  const resolveKeys = (userId) => {
    const raw = String(userId || '').trim();
    if (!raw) return [];
    if (looksLikeEmail(raw)) {
      const email = normalizeEmail(raw);
      return [email];
    }
    const mappedEmail = clerkIdToEmail[raw];
    if (mappedEmail) return [normalizeEmail(mappedEmail), raw];
    return [raw];
  };

  for (const row of progressRows) {
    for (const key of resolveKeys(row.user_id)) {
      ensure(key)?.progressRows.push(row);
    }
  }

  for (const row of attemptRows) {
    for (const key of resolveKeys(row.user_email)) {
      ensure(key)?.attempts.push(row);
    }
  }

  const activityByKey = new Map();

  for (const [key, bucket] of buckets) {
    const practiceEvents = datesFromPracticeRows(bucket.progressRows);
    const mockEvents = datesFromMockAttempts(bucket.attempts);
    const events = mergeActivityEvents(practiceEvents, mockEvents);

    const progressTimes = bucket.progressRows.flatMap((r) => [r.updated_at, r.created_at]);
    const attemptTimes = bucket.attempts.flatMap((a) => [
      a.submitted_at,
      a.started_at,
      a.created_at,
    ]);

    const allTimes = [...progressTimes, ...attemptTimes].filter(Boolean);
    const firstActivityAt =
      allTimes.length > 0
        ? allTimes.reduce((min, t) => (!min || new Date(t) < new Date(min) ? t : min))
        : null;
    const lastActiveAt = maxIso(...allTimes);

    activityByKey.set(key, {
      events,
      firstActivityAt,
      lastActiveAt,
      practiceTopics: bucket.progressRows.length,
      mockAttempts: bucket.attempts.length,
      mockCompleted: bucket.attempts.filter((a) => a.is_completed).length,
    });
  }

  return activityByKey;
}

export function resolveActivityForUser(user, activityByKey) {
  const keys = [];
  if (user.email) keys.push(normalizeEmail(user.email));
  if (user.legacyId) keys.push(user.legacyId);
  if (user.id && user.id !== user.email) keys.push(user.id);

  const mergedEvents = [];
  let firstActivityAt = null;
  let lastActiveAt = null;
  let practiceTopics = 0;
  let mockAttempts = 0;
  let mockCompleted = 0;
  const seen = new Set();

  for (const key of keys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const a = activityByKey.get(key);
    if (!a) continue;
    mergedEvents.push(...(a.events || []));
    practiceTopics += a.practiceTopics || 0;
    mockAttempts += a.mockAttempts || 0;
    mockCompleted += a.mockCompleted || 0;
    firstActivityAt = firstActivityAt
      ? new Date(a.firstActivityAt) < new Date(firstActivityAt)
        ? a.firstActivityAt
        : firstActivityAt
      : a.firstActivityAt;
    lastActiveAt = maxIso(lastActiveAt, a.lastActiveAt);
  }

  const events = mergeActivityEvents(mergedEvents);

  // Practice/mock only — sign-in alone does not count as "active" for engagement tiers
  if (events.length > 0) {
    const eventDays = events.map((e) => e.date).sort();
    const lastDay = eventDays[eventDays.length - 1];
    lastActiveAt = lastDay ? `${lastDay}T12:00:00.000Z` : lastActiveAt;
  } else {
    lastActiveAt = null;
  }

  return {
    events,
    firstActivityAt,
    lastActiveAt,
    lastSignInAt: user.lastSignInAt || null,
    practiceTopics,
    mockAttempts,
    mockCompleted,
  };
}

export function summarizeEngagement(users = []) {
  const counts = {
    total: users.length,
    regular: 0,
    returning: 0,
    new: 0,
    at_risk: 0,
    dormant: 0,
    never: 0,
    activeLast7: 0,
  };

  for (const u of users) {
    const tier = u.engagement?.tier || 'never';
    if (counts[tier] != null) counts[tier] += 1;
    if ((u.engagement?.activeDays7 || 0) > 0) counts.activeLast7 += 1;
  }

  return counts;
}
