/**
 * Path-level study insights: sequential unlock, streak/weekly goal, weak-topic tips.
 */

import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { slugifyPathSegment } from '@/features/og-trackers/lib/platformUrls';

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function startOfUtcWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 Sun
  const diff = day === 0 ? 6 : day - 1; // Monday-start week
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function isStepSatisfied(resource, threshold = 70) {
  const status = resource?.progress?.status;
  const percent = Number(resource?.progress?.percentWatched) || 0;
  // SKIPPED unlocks the next step the same way COMPLETED does.
  if (status === 'COMPLETED' || status === 'SKIPPED') return true;
  return percent >= threshold;
}

/**
 * Mark resources as sequenceLocked when a prior step is incomplete.
 * Premium/resource locks still win separately.
 */
export function applySequentialUnlock(resources, { enabled, threshold = 70 } = {}) {
  if (!enabled || !resources?.length) {
    return (resources || []).map((r) => ({
      ...r,
      sequenceLocked: false,
      unlockBlockedBy: null,
    }));
  }

  let blockedBy = null;
  return resources.map((r) => {
    // Premium-locked steps are handled separately; skip them in the sequence chain.
    if (r.locked) {
      return {
        ...r,
        sequenceLocked: false,
        unlockBlockedBy: null,
      };
    }
    if (blockedBy) {
      return {
        ...r,
        sequenceLocked: true,
        unlockBlockedBy: blockedBy,
      };
    }
    if (!isStepSatisfied(r, threshold)) {
      blockedBy = { id: r.id, title: r.title };
    }
    return {
      ...r,
      sequenceLocked: false,
      unlockBlockedBy: null,
    };
  });
}

export function computeStreakAndWeekly(completionDates, weeklyGoal = 3) {
  const days = [
    ...new Set(
      (completionDates || []).map(dayKey).filter(Boolean)
    ),
  ].sort();

  const daySet = new Set(days);
  const today = dayKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = dayKey(yesterdayDate);

  let streak = 0;
  if (daySet.has(today) || daySet.has(yesterday)) {
    let cursor = daySet.has(today) ? new Date() : yesterdayDate;
    while (true) {
      const key = dayKey(cursor);
      if (!daySet.has(key)) break;
      streak += 1;
      cursor = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  const weekStart = startOfUtcWeek(new Date());
  const weeklyCompleted = (completionDates || []).filter((iso) => {
    const d = new Date(iso);
    return !Number.isNaN(d.getTime()) && d >= weekStart;
  }).length;

  const goal = Math.max(1, Math.min(50, Number(weeklyGoal) || 3));

  return {
    streakDays: streak,
    weeklyCompleted,
    weeklyGoal: goal,
    weeklyRemaining: Math.max(0, goal - weeklyCompleted),
    weeklyMet: weeklyCompleted >= goal,
  };
}

function normalizeMatchKey(value) {
  return slugifyPathSegment(String(value || '').replace(/_/g, ' '));
}

function performanceEntries(subjectPerformance) {
  if (!subjectPerformance || typeof subjectPerformance !== 'object') return [];
  return Object.entries(subjectPerformance).map(([name, stats]) => {
    const percentage =
      typeof stats?.percentage === 'number'
        ? stats.percentage
        : typeof stats?.accuracy === 'number'
          ? stats.accuracy
          : null;
    return {
      name,
      key: normalizeMatchKey(name),
      percentage,
      correct: stats?.correct ?? null,
      wrong: stats?.wrong ?? null,
      total: stats?.total ?? stats?.attempted ?? null,
    };
  });
}

/**
 * Map weak mock subjects/topics onto practice chapters on the same path.
 */
export function buildWeakTopicRecommendations({
  resources,
  mockAttemptsByTestId,
  weakBelow = 60,
  limit = 4,
} = {}) {
  const practice = (resources || []).filter(
    (r) => r.type === 'PRACTICE_CHAPTER' && !r.locked && r.progress?.status !== 'COMPLETED'
  );
  if (!practice.length) return [];

  const scored = [];

  for (const [testId, attempt] of Object.entries(mockAttemptsByTestId || {})) {
    const entries = performanceEntries(attempt?.subject_performance);
    for (const entry of entries) {
      if (entry.percentage == null || entry.percentage >= weakBelow) continue;

      for (const res of practice) {
        const chapter = normalizeMatchKey(res.meta?.chapter);
        const subject = normalizeMatchKey(res.meta?.subject);
        const title = normalizeMatchKey(res.title);
        const hit =
          (chapter && (entry.key.includes(chapter) || chapter.includes(entry.key))) ||
          (subject && (entry.key.includes(subject) || subject.includes(entry.key))) ||
          (title && (entry.key.includes(title) || title.includes(entry.key)));
        if (!hit) continue;
        scored.push({
          resourceId: res.id,
          title: res.title,
          href: res.externalUrl,
          reason: `Weak on “${entry.name}” (${Math.round(entry.percentage)}%) in latest mock`,
          score: entry.percentage,
          testId,
        });
      }
    }
  }

  // Prefer weakest first, unique by resource
  scored.sort((a, b) => a.score - b.score);
  const out = [];
  const seen = new Set();
  for (const row of scored) {
    if (seen.has(row.resourceId)) continue;
    seen.add(row.resourceId);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

export async function loadPathCompletionTimestamps(email, resourceIds) {
  const userEmail = normalizeEmail(email);
  if (!userEmail || !resourceIds?.length) return [];

  const supabase = db();
  const { data, error } = await supabase
    .from('og_progress')
    .select('resource_id, status, updated_at')
    .eq('user_email', userEmail)
    .eq('status', 'COMPLETED')
    .in('resource_id', resourceIds);

  if (error) throw error;
  return (data || []).map((r) => r.updated_at).filter(Boolean);
}

export async function loadLatestMockAttemptsForPath(email, resources) {
  const userEmail = normalizeEmail(email);
  const mocks = (resources || []).filter((r) => r.type === 'MOCK_TEST');
  if (!userEmail || !mocks.length) return {};

  const testIds = mocks
    .map((r) => r.meta?.testId || r.externalSlug)
    .filter(Boolean);
  if (!testIds.length) return {};

  const supabase = db();
  const { data, error } = await supabase
    .from('user_test_attempts')
    .select('test_id, subject_performance, percentage, submitted_at, is_completed')
    .eq('user_email', userEmail)
    .in('test_id', testIds)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })
    .limit(40);

  if (error) throw error;

  const byTest = {};
  for (const row of data || []) {
    if (!byTest[row.test_id]) byTest[row.test_id] = row;
  }
  return byTest;
}

export function buildModuleDrillLinks(resources, pathSlug) {
  const sections = new Map();
  for (const r of resources || []) {
    if (r.type !== 'PRACTICE_CHAPTER' || !r.externalUrl || r.locked) continue;
    const label = (r.sectionLabel || '').trim() || 'Path';
    if (!sections.has(label)) sections.set(label, r);
  }

  const drills = {};
  for (const [label, r] of sections.entries()) {
    const base = r.externalUrl;
    const join = base.includes('?') ? '&' : '?';
    const href = `${base}${join}mode=exam&from=og&path=${encodeURIComponent(pathSlug || '')}&rid=${encodeURIComponent(r.id)}`;
    drills[label] = {
      href,
      title: r.title,
      resourceId: r.id,
    };
  }
  return drills;
}
