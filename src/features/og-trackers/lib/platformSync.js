/**
 * Mirror on-platform practice / mock progress into og_progress.
 * Source of truth remains user_progress and user_test_attempts.
 */

import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  applyProgressUserFilter,
  parseProgressIdArray,
} from '@/lib/progressIdentity';
import { fetchChapterQuestionIdsServer } from '@/features/practice/lib/server/chapterQuestions';
import { upsertProgress } from '@/features/og-trackers/lib/ogTrackerService';
import {
  isPlatformResourceType,
  normalizeMockMeta,
  normalizePracticeMeta,
} from '@/features/og-trackers/lib/platformUrls';

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

const PLATFORM_TYPES = ['PRACTICE_CHAPTER', 'MOCK_TEST'];

async function loadPlatformResources({ pathId = null, resourceIds = null } = {}) {
  const supabase = db();
  let query = supabase
    .from('og_resources')
    .select('id, path_id, type, meta, external_slug, external_url')
    .in('type', PLATFORM_TYPES);

  if (pathId) query = query.eq('path_id', pathId);
  if (resourceIds?.length) query = query.in('id', resourceIds);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function syncPracticeChapter(userEmail, resource) {
  const meta = normalizePracticeMeta(resource.meta || {});
  if (!meta.area || !meta.chapter) {
    return { resourceId: resource.id, skipped: true, reason: 'incomplete_meta' };
  }

  const { ids } = await fetchChapterQuestionIdsServer({
    category: meta.area,
    chapter: meta.chapter,
    subject: meta.subject || undefined,
    difficulty: null,
  });

  const total = ids.length;
  if (!total) {
    return {
      resourceId: resource.id,
      skipped: true,
      reason: 'no_questions',
      detail: { completedCount: 0, totalCount: 0 },
    };
  }

  const idSet = new Set(ids.map(String));
  const supabase = db();
  let query = supabase
    .from('user_progress')
    .select('completedquestions, topic, area')
    .eq('area', meta.area);
  query = applyProgressUserFilter(query, { email: userEmail });

  const { data: rows, error } = await query;
  if (error) throw error;

  const completedSet = new Set();
  for (const row of rows || []) {
    for (const qid of parseProgressIdArray(row.completedquestions)) {
      if (idSet.has(String(qid))) completedSet.add(String(qid));
    }
  }

  const completedCount = completedSet.size;
  const percent = Math.round((completedCount / total) * 100);
  const threshold = meta.completionPercent;
  let status = 'NOT_STARTED';
  if (percent >= threshold) status = 'COMPLETED';
  else if (completedCount > 0) status = 'IN_PROGRESS';

  await upsertProgress(userEmail, {
    resourceId: resource.id,
    percentWatched: percent,
    status,
  });

  return {
    resourceId: resource.id,
    status,
    percent,
    detail: {
      completedCount,
      totalCount: total,
      kind: 'practice',
    },
  };
}

async function syncMockTest(userEmail, resource) {
  const meta = normalizeMockMeta(resource.meta || {});
  const testId = meta.testId || String(resource.external_slug || '').trim();
  if (!testId) {
    return { resourceId: resource.id, skipped: true, reason: 'incomplete_meta' };
  }

  const supabase = db();
  const { data: attempts, error } = await supabase
    .from('user_test_attempts')
    .select('id, is_completed, status, percentage, score')
    .eq('user_email', userEmail)
    .eq('test_id', testId)
    .order('submitted_at', { ascending: false })
    .limit(40);

  if (error) throw error;

  const list = attempts || [];
  const completed = list.filter((a) => a.is_completed === true || a.status === 'completed');
  const inProgress = list.filter(
    (a) => !a.is_completed && (a.status === 'in_progress' || a.status == null)
  );

  let status = 'NOT_STARTED';
  let percent = 0;
  let bestScore = null;

  if (completed.length) {
    status = 'COMPLETED';
    let best = 0;
    for (const a of completed) {
      const p = Number(a.percentage);
      const s = Number(a.score);
      const val = Number.isFinite(p) ? p : Number.isFinite(s) ? s : 0;
      if (val > best) best = val;
    }
    percent = Math.max(0, Math.min(100, Math.round(best)));
    bestScore = percent;
  } else if (inProgress.length) {
    status = 'IN_PROGRESS';
    percent = 0;
  }

  await upsertProgress(userEmail, {
    resourceId: resource.id,
    percentWatched: percent,
    status,
  });

  return {
    resourceId: resource.id,
    status,
    percent,
    detail: {
      kind: 'mock',
      bestScore,
      attemptCount: completed.length,
      hasInProgress: inProgress.length > 0,
    },
  };
}

function withSoftTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

/**
 * Sync PRACTICE_CHAPTER + MOCK_TEST resources for a user.
 * Bounded concurrency + per-resource timeout so one stuck fetch can't stall the path.
 * @returns {{ synced: number, details: Record<string, object> }}
 */
export async function syncPlatformResources(
  email,
  { pathId = null, resourceIds = null, concurrency = 3, perResourceMs = 2500 } = {}
) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) return { synced: 0, details: {} };

  const resources = (await loadPlatformResources({ pathId, resourceIds })).filter((r) =>
    isPlatformResourceType(r.type)
  );

  const details = {};
  let synced = 0;

  async function runOne(resource) {
    try {
      const work =
        resource.type === 'PRACTICE_CHAPTER'
          ? syncPracticeChapter(userEmail, resource)
          : resource.type === 'MOCK_TEST'
            ? syncMockTest(userEmail, resource)
            : Promise.resolve(null);

      const result = await withSoftTimeout(work, perResourceMs, {
        resourceId: resource.id,
        skipped: true,
        reason: 'timeout',
      });
      if (result?.detail) details[resource.id] = result.detail;
      if (result?.reason === 'timeout') {
        details[resource.id] = { error: 'timeout' };
      }
      if (result && !result.skipped) synced += 1;
    } catch (err) {
      console.error('platformSync resource', resource.id, err?.message || err);
      details[resource.id] = { error: err.message || 'sync_failed' };
    }
  }

  // Simple pool — scalable without slamming Supabase
  let idx = 0;
  async function worker() {
    while (idx < resources.length) {
      const current = resources[idx];
      idx += 1;
      await runOne(current);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(resources.length, 1)) },
    () => worker()
  );
  await Promise.all(workers);

  return { synced, details };
}
