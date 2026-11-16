import crypto from 'crypto';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  OG_TRACKERS_SETUP_HINT,
  RESOURCE_TYPES,
  getOgPremiumAmountPaise,
} from '@/features/og-trackers/lib/constants';
import {
  normalizeCategory,
  normalizeIcon,
  normalizeTags,
} from '@/features/og-trackers/lib/trackerMeta';
import { extractYouTubeVideoId } from '@/features/og-trackers/lib/youtubeId';
import { resolveJudgeExternal } from '@/features/og-trackers/lib/judgeUrls';
import {
  isJudgeResourceType,
  isPlatformResourceType,
  resolvePlatformExternal,
} from '@/features/og-trackers/lib/platformUrls';
import {
  applySequentialUnlock,
  buildModuleDrillLinks,
  buildWeakTopicRecommendations,
  computeStreakAndWeekly,
  loadLatestMockAttemptsForPath,
  loadPathCompletionTimestamps,
} from '@/features/og-trackers/lib/pathInsights';

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

export { OG_TRACKERS_SETUP_HINT };

export function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 64;
}

export function isSetupError(error) {
  const message = String(error?.message || '');
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message)
  );
}

export async function getUserPremiumState(email) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) {
    return {
      isPremium: false,
      leetcodeUsername: null,
      codestudioUsername: null,
      hackerrankUsername: null,
      profile: null,
    };
  }

  const supabase = db();
  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'user_email, is_premium, leetcode_username, codestudio_username, hackerrank_username, display_name'
    )
    .eq('user_email', userEmail)
    .maybeSingle();

  if (error && !isSetupError(error)) throw error;

  return {
    isPremium: Boolean(data?.is_premium),
    leetcodeUsername: data?.leetcode_username || null,
    codestudioUsername: data?.codestudio_username || null,
    hackerrankUsername: data?.hackerrank_username || null,
    profile: data || null,
  };
}

export async function updateJudgeUsernames(
  email,
  { leetcodeUsername, codestudioUsername, hackerrankUsername }
) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) throw new Error('Email required');

  const supabase = db();
  const patch = {
    updated_at: new Date().toISOString(),
  };
  if (leetcodeUsername !== undefined) {
    patch.leetcode_username = leetcodeUsername
      ? String(leetcodeUsername).trim().slice(0, 64)
      : null;
  }
  if (codestudioUsername !== undefined) {
    patch.codestudio_username = codestudioUsername
      ? String(codestudioUsername).trim().slice(0, 64)
      : null;
  }
  if (hackerrankUsername !== undefined) {
    patch.hackerrank_username = hackerrankUsername
      ? String(hackerrankUsername).trim().slice(0, 64)
      : null;
  }

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('user_email')
    .eq('user_email', userEmail)
    .maybeSingle();

  const selectCols =
    'user_email, is_premium, leetcode_username, codestudio_username, hackerrank_username';

  if (existing) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(patch)
      .eq('user_email', userEmail)
      .select(selectCols)
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_email: userEmail,
      display_name: userEmail.split('@')[0],
      ...patch,
    })
    .select(selectCols)
    .single();

  if (error) throw error;
  return data;
}

export async function setUserPremium(email, isPremium = true) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) throw new Error('Email required');

  const supabase = db();
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('user_email')
    .eq('user_email', userEmail)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_premium: Boolean(isPremium),
        updated_at: new Date().toISOString(),
      })
      .eq('user_email', userEmail)
      .select('user_email, is_premium')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_email: userEmail,
      display_name: userEmail.split('@')[0],
      is_premium: Boolean(isPremium),
      updated_at: new Date().toISOString(),
    })
    .select('user_email, is_premium')
    .single();

  if (error) throw error;
  return data;
}

function pathIsLocked(path, isPremium) {
  return Boolean(path?.is_premium) && !isPremium;
}

function resourceIsLocked(path, resource, isPremium) {
  if (isPremium) return false;
  if (resource?.is_premium === true) return true;
  if (resource?.is_premium === false) return false;
  return Boolean(path?.is_premium);
}

function sanitizeResource(resource, locked) {
  if (!resource) return null;
  const meta =
    resource.meta && typeof resource.meta === 'object' && !Array.isArray(resource.meta)
      ? resource.meta
      : {};
  const base = {
    id: resource.id,
    pathId: resource.path_id,
    type: resource.type,
    sortOrder: resource.sort_order,
    title: resource.title,
    difficulty: resource.difficulty || null,
    durationSeconds: resource.duration_seconds ?? null,
    isPremium: resource.is_premium,
    sectionLabel: resource.section_label || null,
    meta,
    locked,
  };
  if (locked) {
    return {
      ...base,
      youtubeVideoId: null,
      externalSlug: resource.external_slug || null,
      externalUrl: null,
    };
  }
  return {
    ...base,
    youtubeVideoId: extractYouTubeVideoId(resource.youtube_video_id) || null,
    externalSlug: resource.external_slug || null,
    externalUrl: resource.external_url || null,
  };
}

function statusRank(status) {
  if (status === 'COMPLETED') return 3;
  if (status === 'SKIPPED') return 2;
  if (status === 'IN_PROGRESS') return 1;
  return 0;
}

function computeTypeBreakdown(resources) {
  const breakdown = {
    videos: { total: 0, completed: 0 },
    practice: { total: 0, completed: 0 },
    mocks: { total: 0, completed: 0 },
    coding: { total: 0, completed: 0 },
  };
  for (const r of resources || []) {
    const done =
      r.progress?.status === 'COMPLETED' || r.progress?.status === 'SKIPPED';
    if (r.type === 'VIDEO') {
      breakdown.videos.total += 1;
      if (done) breakdown.videos.completed += 1;
    } else if (r.type === 'PRACTICE_CHAPTER') {
      breakdown.practice.total += 1;
      if (done) breakdown.practice.completed += 1;
    } else if (r.type === 'MOCK_TEST') {
      breakdown.mocks.total += 1;
      if (done) breakdown.mocks.completed += 1;
    } else if (isJudgeResourceType(r.type)) {
      breakdown.coding.total += 1;
      if (done) breakdown.coding.completed += 1;
    }
  }
  return breakdown;
}

export async function listActivePaths(email = null) {
  const supabase = db();
  const { isPremium } = await getUserPremiumState(email);

  const { data: paths, error } = await supabase
    .from('og_paths')
    .select(
      'id, slug, title, description, category, tags, icon, sort_order, is_premium, is_active'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    if (isSetupError(error)) {
      return { paths: [], setupRequired: true, isPremium, error };
    }
    throw error;
  }

  const pathIds = (paths || []).map((p) => p.id);
  let resourceCounts = {};
  let completedCounts = {};

  if (pathIds.length) {
    const { data: resources } = await supabase
      .from('og_resources')
      .select('id, path_id')
      .in('path_id', pathIds);

    const resourceIdsByPath = {};
    for (const r of resources || []) {
      resourceCounts[r.path_id] = (resourceCounts[r.path_id] || 0) + 1;
      if (!resourceIdsByPath[r.path_id]) resourceIdsByPath[r.path_id] = [];
      resourceIdsByPath[r.path_id].push(r.id);
    }

    const userEmail = normalizeEmail(email);
    if (userEmail) {
      const allResourceIds = (resources || []).map((r) => r.id);
      if (allResourceIds.length) {
        const { data: progress } = await supabase
          .from('og_progress')
          .select('resource_id, status')
          .eq('user_email', userEmail)
          .eq('status', 'COMPLETED')
          .in('resource_id', allResourceIds);

        const completedSet = new Set((progress || []).map((p) => p.resource_id));
        for (const [pathId, ids] of Object.entries(resourceIdsByPath)) {
          completedCounts[pathId] = ids.filter((id) => completedSet.has(id)).length;
        }
      }
    }
  }

  return {
    paths: (paths || []).map((p) => {
      const total = resourceCounts[p.id] || 0;
      const completed = completedCounts[p.id] || 0;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        category: p.category || 'General',
        tags: Array.isArray(p.tags) ? p.tags : [],
        icon: p.icon || 'Map',
        sortOrder: p.sort_order,
        isPremium: p.is_premium,
        locked: pathIsLocked(p, isPremium),
        totalResources: total,
        completedResources: completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }),
    setupRequired: false,
    isPremium,
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
 * Fast path read. Platform sync is OFF by default — only run when opts.syncPlatform
 * is true (explicit refresh). Insights are soft-timed so Supabase blips never stall UX.
 */
export async function getPathBySlug(
  slug,
  email = null,
  { syncPlatform = false, insightsTimeoutMs = 1200 } = {}
) {
  const supabase = db();
  const { isPremium, leetcodeUsername, codestudioUsername, hackerrankUsername } =
    await getUserPremiumState(email);

  const { data: path, error } = await supabase
    .from('og_paths')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    if (isSetupError(error)) return { setupRequired: true, path: null };
    throw error;
  }
  if (!path) return { path: null, resources: [], progressByResource: {}, isPremium };

  const { data: resources, error: resErr } = await supabase
    .from('og_resources')
    .select('*')
    .eq('path_id', path.id)
    .order('sort_order', { ascending: true });

  if (resErr) throw resErr;

  const userEmail = normalizeEmail(email);
  let platformDetails = {};
  if (userEmail && syncPlatform && (resources || []).some((r) => isPlatformResourceType(r.type))) {
    try {
      const { syncPlatformResources } = await import(
        '@/features/og-trackers/lib/platformSync'
      );
      const synced = await withSoftTimeout(
        syncPlatformResources(userEmail, { pathId: path.id }),
        4000,
        { synced: 0, details: {}, timedOut: true }
      );
      platformDetails = synced.details || {};
    } catch (err) {
      console.error('getPathBySlug platform sync', err?.message || err);
    }
  }

  let progressByResource = {};
  if (userEmail && (resources || []).length) {
    const { data: progress } = await supabase
      .from('og_progress')
      .select('resource_id, status, percent_watched, updated_at')
      .eq('user_email', userEmail)
      .in(
        'resource_id',
        resources.map((r) => r.id)
      );

    for (const row of progress || []) {
      progressByResource[row.resource_id] = {
        status: row.status,
        percentWatched: row.percent_watched ?? 0,
        updatedAt: row.updated_at,
        detail: platformDetails[row.resource_id] || null,
      };
    }
  }

  const lockedPath = pathIsLocked(path, isPremium);
  let sanitized = (resources || []).map((r) => {
    const locked = resourceIsLocked(path, r, isPremium);
    const progress = progressByResource[r.id] || {
      status: 'NOT_STARTED',
      percentWatched: 0,
      updatedAt: null,
      detail: platformDetails[r.id] || null,
    };
    if (!progress.detail && platformDetails[r.id]) {
      progress.detail = platformDetails[r.id];
    }
    return {
      ...sanitizeResource(r, locked),
      progress,
    };
  });

  const unlockThreshold = Number(path.unlock_threshold) || 70;
  sanitized = applySequentialUnlock(sanitized, {
    enabled: Boolean(path.sequential_unlock),
    threshold: unlockThreshold,
  });

  const completed = sanitized.filter((r) => r.progress?.status === 'COMPLETED').length;
  const breakdown = computeTypeBreakdown(sanitized);

  let insights = {
    streakDays: 0,
    weeklyCompleted: 0,
    weeklyGoal: Number(path.weekly_goal) || 3,
    weeklyRemaining: Number(path.weekly_goal) || 3,
    weeklyMet: false,
    recommendations: [],
    moduleDrills: buildModuleDrillLinks(sanitized, path.slug),
  };

  if (userEmail && sanitized.length) {
    try {
      const emptyInsights = {
        completionDates: [],
        mockAttempts: {},
      };
      const packed = await withSoftTimeout(
        Promise.all([
          loadPathCompletionTimestamps(
            userEmail,
            sanitized.map((r) => r.id)
          ),
          loadLatestMockAttemptsForPath(userEmail, sanitized),
        ]).then(([completionDates, mockAttempts]) => ({
          completionDates,
          mockAttempts,
        })),
        insightsTimeoutMs,
        emptyInsights
      );
      insights = {
        ...computeStreakAndWeekly(packed.completionDates || [], path.weekly_goal),
        recommendations: buildWeakTopicRecommendations({
          resources: sanitized,
          mockAttemptsByTestId: packed.mockAttempts || {},
        }),
        moduleDrills: buildModuleDrillLinks(sanitized, path.slug),
      };
    } catch (err) {
      console.error('getPathBySlug insights', err?.message || err);
    }
  }

  const hasCoding = sanitized.some((r) => isJudgeResourceType(r.type));
  const missingJudgeUsernames = hasCoding
    ? {
        leetcode: !leetcodeUsername,
        codestudio: !codestudioUsername,
        hackerrank: !hackerrankUsername,
      }
    : null;

  return {
    path: {
      id: path.id,
      slug: path.slug,
      title: path.title,
      description: path.description,
      category: path.category || 'General',
      tags: Array.isArray(path.tags) ? path.tags : [],
      icon: path.icon || 'Map',
      isPremium: path.is_premium,
      locked: lockedPath,
      sequentialUnlock: Boolean(path.sequential_unlock),
      weeklyGoal: Number(path.weekly_goal) || 3,
      unlockThreshold,
      totalResources: sanitized.length,
      completedResources: completed,
      percent:
        sanitized.length > 0
          ? Math.round((completed / sanitized.length) * 100)
          : 0,
      breakdown,
    },
    resources: sanitized,
    insights,
    missingJudgeUsernames,
    isPremium,
    leetcodeUsername,
    codestudioUsername,
    hackerrankUsername,
    setupRequired: false,
  };
}

export async function getDashboardStats(email) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) {
    return {
      videosCompleted: 0,
      leetcodeSolved: 0,
      codestudioSolved: 0,
      hackerrankSolved: 0,
      practiceCompleted: 0,
      mocksCompleted: 0,
      isPremium: false,
    };
  }

  const { isPremium } = await getUserPremiumState(userEmail);
  const supabase = db();

  const { data: progress } = await supabase
    .from('og_progress')
    .select('resource_id, status')
    .eq('user_email', userEmail)
    .eq('status', 'COMPLETED');

  const ids = (progress || []).map((p) => p.resource_id);
  if (!ids.length) {
    return {
      videosCompleted: 0,
      leetcodeSolved: 0,
      codestudioSolved: 0,
      hackerrankSolved: 0,
      practiceCompleted: 0,
      mocksCompleted: 0,
      isPremium,
    };
  }

  const { data: resources } = await supabase
    .from('og_resources')
    .select('id, type')
    .in('id', ids);

  let videosCompleted = 0;
  let leetcodeSolved = 0;
  let codestudioSolved = 0;
  let hackerrankSolved = 0;
  let practiceCompleted = 0;
  let mocksCompleted = 0;
  for (const r of resources || []) {
    if (r.type === 'VIDEO') videosCompleted += 1;
    else if (r.type === 'LEETCODE_PROBLEM') leetcodeSolved += 1;
    else if (r.type === 'CODESTUDIO_PROBLEM') codestudioSolved += 1;
    else if (r.type === 'HACKERRANK_PROBLEM') hackerrankSolved += 1;
    else if (r.type === 'PRACTICE_CHAPTER') practiceCompleted += 1;
    else if (r.type === 'MOCK_TEST') mocksCompleted += 1;
  }

  return {
    videosCompleted,
    leetcodeSolved,
    codestudioSolved,
    hackerrankSolved,
    practiceCompleted,
    mocksCompleted,
    isPremium,
  };
}

/**
 * Upsert progress — never regress percent_watched (highest progress wins).
 * Optional deviceLabel / tokenId stamped when migration columns exist.
 */
export async function upsertProgress(
  email,
  { resourceId, percentWatched, status, deviceLabel = null, tokenId = null } = {}
) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) throw new Error('Authentication required');
  if (!resourceId) throw new Error('resourceId required');

  const supabase = db();
  const { data: existing } = await supabase
    .from('og_progress')
    .select('percent_watched, status')
    .eq('user_email', userEmail)
    .eq('resource_id', resourceId)
    .maybeSingle();

  const prevPercent = existing?.percent_watched ?? 0;
  let nextPercent =
    percentWatched != null
      ? Math.max(0, Math.min(100, Math.floor(Number(percentWatched))))
      : prevPercent;
  if (nextPercent < prevPercent) nextPercent = prevPercent;

  let nextStatus = status || existing?.status || 'NOT_STARTED';
  // Never downgrade COMPLETED / SKIPPED → weaker statuses
  if (statusRank(existing?.status) > statusRank(nextStatus)) {
    nextStatus = existing.status;
  }
  // Video beacons omit status — auto-complete at 90% watched.
  if (status == null) {
    if (nextPercent >= 90) nextStatus = 'COMPLETED';
    else if (nextPercent > 0 && nextStatus === 'NOT_STARTED') nextStatus = 'IN_PROGRESS';
  } else if (
    nextPercent > 0 &&
    nextStatus === 'NOT_STARTED' &&
    status !== 'SKIPPED'
  ) {
    nextStatus = 'IN_PROGRESS';
  }

  const row = {
    user_email: userEmail,
    resource_id: resourceId,
    percent_watched: nextPercent,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (deviceLabel) row.last_device_label = String(deviceLabel).slice(0, 120);
  if (tokenId) row.last_token_id = tokenId;

  let { data, error } = await supabase
    .from('og_progress')
    .upsert(row, { onConflict: 'user_email,resource_id' })
    .select(
      'resource_id, status, percent_watched, updated_at, last_device_label, last_token_id'
    )
    .single();

  // Columns missing until migration — retry without device fields.
  if (
    error &&
    (error.code === 'PGRST204' ||
      /last_device_label|last_token_id/i.test(error.message || ''))
  ) {
    delete row.last_device_label;
    delete row.last_token_id;
    const retry = await supabase
      .from('og_progress')
      .upsert(row, { onConflict: 'user_email,resource_id' })
      .select('resource_id, status, percent_watched, updated_at')
      .single();
    data = retry.data;
    error = retry.error;
  }

  // SKIPPED not in CHECK constraint yet — fall back to COMPLETED for unlock.
  if (
    error &&
    nextStatus === 'SKIPPED' &&
    /check|status/i.test(String(error.message || ''))
  ) {
    row.status = 'COMPLETED';
    const retry = await supabase
      .from('og_progress')
      .upsert(row, { onConflict: 'user_email,resource_id' })
      .select('resource_id, status, percent_watched, updated_at')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
}

export async function markResourceCompleted(email, resourceId) {
  return upsertProgress(email, {
    resourceId,
    percentWatched: 100,
    status: 'COMPLETED',
  });
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────

export async function adminListPaths() {
  const supabase = db();
  const { data, error } = await supabase
    .from('og_paths')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    if (isSetupError(error)) return { paths: [], setupRequired: true };
    throw error;
  }
  return { paths: data || [], setupRequired: false };
}

export async function adminCreatePath(input) {
  const slug = normalizeSlug(input.slug || input.title);
  if (!isValidSlug(slug)) throw new Error('Invalid slug');

  const supabase = db();
  const weeklyGoal = Number(input.weeklyGoal);
  const unlockThreshold = Number(input.unlockThreshold);

  const baseRow = {
    slug,
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    category: normalizeCategory(input.category),
    tags: normalizeTags(input.tags),
    icon: normalizeIcon(input.icon),
    sort_order: Number(input.sortOrder) || 0,
    is_premium: Boolean(input.isPremium),
    is_active: input.isActive !== false,
  };

  const withStudy = {
    ...baseRow,
    sequential_unlock: Boolean(input.sequentialUnlock),
    weekly_goal:
      Number.isFinite(weeklyGoal) && weeklyGoal >= 1 && weeklyGoal <= 50
        ? Math.floor(weeklyGoal)
        : 3,
    unlock_threshold:
      Number.isFinite(unlockThreshold) && unlockThreshold >= 1 && unlockThreshold <= 100
        ? Math.floor(unlockThreshold)
        : 70,
  };

  let { data, error } = await supabase.from('og_paths').insert(withStudy).select('*').single();
  if (
    error &&
    (/sequential_unlock|weekly_goal|unlock_threshold/i.test(String(error.message || '')) ||
      error.code === 'PGRST204')
  ) {
    ({ data, error } = await supabase.from('og_paths').insert(baseRow).select('*').single());
  }

  if (error) throw error;
  return data;
}

export async function adminUpdatePath(pathId, input) {
  const supabase = db();
  const patch = { updated_at: new Date().toISOString() };
  if (input.title != null) patch.title = String(input.title).trim();
  if (input.description != null) patch.description = String(input.description).trim();
  if (input.category != null) patch.category = normalizeCategory(input.category);
  if (input.tags != null) patch.tags = normalizeTags(input.tags);
  if (input.icon != null) patch.icon = normalizeIcon(input.icon);
  if (input.sortOrder != null) patch.sort_order = Number(input.sortOrder) || 0;
  // Use !== undefined so false (free) is applied correctly.
  if (input.isPremium !== undefined && input.isPremium !== null) {
    patch.is_premium = Boolean(input.isPremium);
  }
  if (input.isActive !== undefined && input.isActive !== null) {
    patch.is_active = Boolean(input.isActive);
  }
  if (input.sequentialUnlock != null) {
    patch.sequential_unlock = Boolean(input.sequentialUnlock);
  }
  if (input.weeklyGoal != null) {
    const weeklyGoal = Number(input.weeklyGoal);
    if (!Number.isFinite(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 50) {
      throw new Error('Weekly goal must be between 1 and 50');
    }
    patch.weekly_goal = Math.floor(weeklyGoal);
  }
  if (input.unlockThreshold != null) {
    const unlockThreshold = Number(input.unlockThreshold);
    if (
      !Number.isFinite(unlockThreshold) ||
      unlockThreshold < 1 ||
      unlockThreshold > 100
    ) {
      throw new Error('Unlock threshold must be between 1 and 100');
    }
    patch.unlock_threshold = Math.floor(unlockThreshold);
  }
  if (input.slug != null) {
    const slug = normalizeSlug(input.slug);
    if (!isValidSlug(slug)) throw new Error('Invalid slug');
    patch.slug = slug;
  }

  let { data, error } = await supabase
    .from('og_paths')
    .update(patch)
    .eq('id', pathId)
    .select('*')
    .single();

  if (
    error &&
    (/sequential_unlock|weekly_goal|unlock_threshold/i.test(String(error.message || '')) ||
      error.code === 'PGRST204')
  ) {
    const fallback = { ...patch };
    delete fallback.sequential_unlock;
    delete fallback.weekly_goal;
    delete fallback.unlock_threshold;
    ({ data, error } = await supabase
      .from('og_paths')
      .update(fallback)
      .eq('id', pathId)
      .select('*')
      .single());
  }

  if (error) throw error;

  // Path set to free: clear per-resource premium locks so steps unlock for everyone.
  // Path set to premium: null resource flags so they inherit path premium
  // (keeps explicit resource.is_premium === false as free sample steps).
  if (Object.prototype.hasOwnProperty.call(patch, 'is_premium')) {
    if (patch.is_premium === false) {
      const { error: resErr } = await supabase
        .from('og_resources')
        .update({ is_premium: false, updated_at: new Date().toISOString() })
        .eq('path_id', pathId);
      if (resErr) throw resErr;
    } else if (patch.is_premium === true) {
      const { error: resErr } = await supabase
        .from('og_resources')
        .update({ is_premium: null, updated_at: new Date().toISOString() })
        .eq('path_id', pathId)
        .eq('is_premium', true);
      if (resErr) throw resErr;
    }
  }

  return data;
}

export async function adminDeletePath(pathId) {
  const supabase = db();
  const { error } = await supabase.from('og_paths').delete().eq('id', pathId);
  if (error) throw error;
  return { ok: true };
}

export async function adminListResources(pathId) {
  const supabase = db();
  const { data, error } = await supabase
    .from('og_resources')
    .select('*')
    .eq('path_id', pathId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function adminCreateResource(pathId, input) {
  const type = String(input.type || '').toUpperCase();
  if (!RESOURCE_TYPES.includes(type)) throw new Error('Invalid resource type');

  const youtubeId =
    type === 'VIDEO'
      ? extractYouTubeVideoId(input.youtubeVideoId || input.youtubeUrl || '')
      : null;

  if (type === 'VIDEO' && input.youtubeVideoId && !youtubeId) {
    throw new Error('Invalid YouTube URL or video ID');
  }

  let externalSlug = input.externalSlug || null;
  let externalUrl = input.externalUrl || null;
  let meta =
    input.meta && typeof input.meta === 'object' && !Array.isArray(input.meta)
      ? input.meta
      : {};

  if (isPlatformResourceType(type)) {
    const resolved = resolvePlatformExternal({
      type,
      meta,
      externalUrl,
      externalSlug,
    });
    meta = resolved.meta;
    externalUrl = resolved.externalUrl;
    externalSlug = resolved.externalSlug;
    if (type === 'PRACTICE_CHAPTER') {
      if (!meta.area || !meta.subject || !meta.chapter) {
        throw new Error('Practice chapter needs area, subject, and chapter');
      }
      if (!externalUrl) throw new Error('Could not build practice chapter URL');
    }
    if (type === 'MOCK_TEST') {
      if (!meta.examCategory || !meta.testId) {
        throw new Error('Mock test needs exam category and test ID');
      }
      if (!externalUrl) throw new Error('Could not build mock test URL');
    }
  } else if (type !== 'VIDEO') {
    const resolved = resolveJudgeExternal({
      type,
      externalSlug,
      externalUrl,
    });
    externalSlug = resolved.externalSlug;
    externalUrl = resolved.externalUrl;
    if (!externalSlug) {
      throw new Error('Paste a problem URL (or slug) for sync to work');
    }
  }

  const sectionLabel =
    input.sectionLabel != null && String(input.sectionLabel).trim()
      ? String(input.sectionLabel).trim().slice(0, 80)
      : null;

  const supabase = db();
  const { data, error } = await supabase
    .from('og_resources')
    .insert({
      path_id: pathId,
      type,
      sort_order: Number(input.sortOrder) || 0,
      title: String(input.title || '').trim(),
      youtube_video_id: youtubeId,
      duration_seconds: input.durationSeconds != null ? Number(input.durationSeconds) : null,
      external_slug: externalSlug,
      difficulty: input.difficulty || null,
      external_url: externalUrl,
      is_premium: input.isPremium === undefined ? null : Boolean(input.isPremium),
      section_label: sectionLabel,
      meta,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateResource(resourceId, input) {
  const supabase = db();
  const patch = { updated_at: new Date().toISOString() };
  if (input.type != null) {
    const type = String(input.type).toUpperCase();
    if (!RESOURCE_TYPES.includes(type)) throw new Error('Invalid resource type');
    patch.type = type;
  }
  if (input.title != null) patch.title = String(input.title).trim();
  if (input.sortOrder != null) patch.sort_order = Number(input.sortOrder) || 0;
  if (input.youtubeVideoId !== undefined) {
    const youtubeId = extractYouTubeVideoId(input.youtubeVideoId || '');
    if (input.youtubeVideoId && !youtubeId) {
      throw new Error('Invalid YouTube URL or video ID');
    }
    patch.youtube_video_id = youtubeId;
  }
  if (input.durationSeconds !== undefined) {
    patch.duration_seconds =
      input.durationSeconds != null ? Number(input.durationSeconds) : null;
  }
  if (input.sectionLabel !== undefined) {
    patch.section_label =
      input.sectionLabel != null && String(input.sectionLabel).trim()
        ? String(input.sectionLabel).trim().slice(0, 80)
        : null;
  }

  const touchingExternal =
    input.externalSlug !== undefined ||
    input.externalUrl !== undefined ||
    input.type != null ||
    input.meta !== undefined;

  if (touchingExternal) {
    const { data: existing } = await supabase
      .from('og_resources')
      .select('type, external_slug, external_url, meta')
      .eq('id', resourceId)
      .maybeSingle();

    const nextType = patch.type || existing?.type;
    if (nextType && isPlatformResourceType(nextType)) {
      const resolved = resolvePlatformExternal({
        type: nextType,
        meta: input.meta !== undefined ? input.meta : existing?.meta,
        externalSlug:
          input.externalSlug !== undefined ? input.externalSlug : existing?.external_slug,
        externalUrl:
          input.externalUrl !== undefined ? input.externalUrl : existing?.external_url,
      });
      if (nextType === 'PRACTICE_CHAPTER') {
        if (!resolved.meta.area || !resolved.meta.subject || !resolved.meta.chapter) {
          throw new Error('Practice chapter needs area, subject, and chapter');
        }
      }
      if (nextType === 'MOCK_TEST') {
        if (!resolved.meta.examCategory || !resolved.meta.testId) {
          throw new Error('Mock test needs exam category and test ID');
        }
      }
      if (!resolved.externalUrl) {
        throw new Error('Could not build platform resource URL');
      }
      patch.meta = resolved.meta;
      patch.external_slug = resolved.externalSlug;
      patch.external_url = resolved.externalUrl;
    } else if (nextType && nextType !== 'VIDEO') {
      const resolved = resolveJudgeExternal({
        type: nextType,
        externalSlug:
          input.externalSlug !== undefined ? input.externalSlug : existing?.external_slug,
        externalUrl:
          input.externalUrl !== undefined ? input.externalUrl : existing?.external_url,
      });
      if (!resolved.externalSlug) {
        throw new Error('Paste a problem URL (or slug) for sync to work');
      }
      patch.external_slug = resolved.externalSlug;
      patch.external_url = resolved.externalUrl;
      if (input.meta !== undefined) {
        patch.meta =
          input.meta && typeof input.meta === 'object' && !Array.isArray(input.meta)
            ? input.meta
            : {};
      }
    } else {
      if (input.externalSlug !== undefined) patch.external_slug = input.externalSlug || null;
      if (input.externalUrl !== undefined) patch.external_url = input.externalUrl || null;
      if (nextType === 'VIDEO') {
        patch.meta = {};
      } else if (input.meta !== undefined) {
        patch.meta =
          input.meta && typeof input.meta === 'object' && !Array.isArray(input.meta)
            ? input.meta
            : {};
      }
    }
  } else if (input.meta !== undefined) {
    patch.meta =
      input.meta && typeof input.meta === 'object' && !Array.isArray(input.meta)
        ? input.meta
        : {};
  }

  if (input.difficulty !== undefined) patch.difficulty = input.difficulty || null;
  if (input.isPremium !== undefined) {
    patch.is_premium = input.isPremium === null ? null : Boolean(input.isPremium);
  }

  const { data, error } = await supabase
    .from('og_resources')
    .update(patch)
    .eq('id', resourceId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function adminDeleteResource(resourceId) {
  const supabase = db();
  const { error } = await supabase.from('og_resources').delete().eq('id', resourceId);
  if (error) throw error;
  return { ok: true };
}

// ── Premium orders ─────────────────────────────────────────────────────────

export async function createPremiumOrderRecord(email, razorpayOrderId, amountPaise) {
  const userEmail = normalizeEmail(email);
  const supabase = db();
  const { data, error } = await supabase
    .from('og_premium_orders')
    .insert({
      user_email: userEmail,
      amount_paise: amountPaise,
      status: 'pending',
      razorpay_order_id: razorpayOrderId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function completePremiumOrder(email, { razorpayOrderId, razorpayPaymentId }) {
  const userEmail = normalizeEmail(email);
  const supabase = db();

  const { data: order, error } = await supabase
    .from('og_premium_orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .eq('user_email', userEmail)
    .maybeSingle();

  if (error) throw error;
  if (!order) throw new Error('Order not found');

  if (order.status === 'completed') {
    await setUserPremium(userEmail, true);
    return { alreadyProcessed: true, order };
  }

  const expected = getOgPremiumAmountPaise();
  if (Number(order.amount_paise) !== Number(expected)) {
    throw new Error('Order amount mismatch');
  }

  const { data: updated, error: updErr } = await supabase
    .from('og_premium_orders')
    .update({
      status: 'completed',
      razorpay_payment_id: razorpayPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', razorpayOrderId)
    .eq('user_email', userEmail)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (updErr) throw updErr;
  await setUserPremium(userEmail, true);
  return { alreadyProcessed: false, order: updated || order };
}

/** HMAC token for sendBeacon (short-lived). */
export function signBeaconPayload({ email, resourceId, percentWatched }, ttlMs = 2 * 60 * 60 * 1000) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('Missing auth secret for beacon');

  const exp = Date.now() + ttlMs;
  const body = JSON.stringify({
    email: normalizeEmail(email),
    resourceId,
    percentWatched,
    exp,
  });
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return Buffer.from(JSON.stringify({ body, sig })).toString('base64url');
}

export function verifyBeaconToken(token) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) return null;

  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    const expected = crypto.createHmac('sha256', secret).update(parsed.body).digest('hex');
    if (expected !== parsed.sig) return null;
    const payload = JSON.parse(parsed.body);
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getResourceById(resourceId) {
  const supabase = db();
  const { data, error } = await supabase
    .from('og_resources')
    .select('*, og_paths!inner(id, slug, is_premium, is_active)')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Resolve a catalogued YouTube video for the Chrome extension.
 * Returns null when the video is not in any active path.
 * Includes siblings + path progress + weekly goal for one-shot HUD.
 */
export async function getResourceByYoutubeVideoId(youtubeVideoId, email = null) {
  const videoId = extractYouTubeVideoId(youtubeVideoId);
  if (!videoId) return null;

  const supabase = db();
  const { data: rows, error } = await supabase
    .from('og_resources')
    .select(
      '*, og_paths!inner(id, slug, title, is_premium, is_active, weekly_goal)'
    )
    .eq('youtube_video_id', videoId)
    .eq('type', 'VIDEO')
    .limit(10);

  if (error) {
    // weekly_goal column may be missing
    if (/weekly_goal/i.test(error.message || '')) {
      const fallback = await supabase
        .from('og_resources')
        .select('*, og_paths!inner(id, slug, title, is_premium, is_active)')
        .eq('youtube_video_id', videoId)
        .eq('type', 'VIDEO')
        .limit(10);
      if (fallback.error) throw fallback.error;
      return finalizeYoutubeLookup(fallback.data, videoId, email);
    }
    throw error;
  }

  return finalizeYoutubeLookup(rows, videoId, email);
}

async function finalizeYoutubeLookup(rows, videoId, email) {
  const resource =
    (rows || []).find((row) => row.og_paths?.is_active === true) || null;
  if (!resource) return null;

  const path = resource.og_paths;
  const supabase = db();
  const { isPremium } = await getUserPremiumState(email);
  const locked = resourceIsLocked(path, resource, isPremium);

  let progress = null;
  const userEmail = normalizeEmail(email);
  if (userEmail) {
    let progressRow = null;
    const withDevice = await supabase
      .from('og_progress')
      .select('status, percent_watched, updated_at, last_device_label')
      .eq('user_email', userEmail)
      .eq('resource_id', resource.id)
      .maybeSingle();

    if (
      withDevice.error &&
      /last_device_label/i.test(withDevice.error.message || '')
    ) {
      const basic = await supabase
        .from('og_progress')
        .select('status, percent_watched, updated_at')
        .eq('user_email', userEmail)
        .eq('resource_id', resource.id)
        .maybeSingle();
      progressRow = basic.data;
    } else {
      progressRow = withDevice.data;
    }

    if (progressRow) {
      progress = {
        status: progressRow.status,
        percentWatched: progressRow.percent_watched,
        updatedAt: progressRow.updated_at,
        lastDeviceLabel: progressRow.last_device_label || null,
      };
    }
  }

  const sanitized = sanitizeResource(resource, locked);

  // Sibling videos in the same path (for Next / Prev).
  const { data: siblingsRows } = await supabase
    .from('og_resources')
    .select('id, title, sort_order, youtube_video_id, section_label')
    .eq('path_id', path.id)
    .eq('type', 'VIDEO')
    .order('sort_order', { ascending: true });

  const videos = (siblingsRows || [])
    .map((r) => ({
      id: r.id,
      title: r.title,
      sortOrder: r.sort_order,
      youtubeVideoId: extractYouTubeVideoId(r.youtube_video_id),
      sectionLabel: r.section_label || null,
    }))
    .filter((r) => r.youtubeVideoId);

  const idx = videos.findIndex((v) => v.youtubeVideoId === videoId);
  const siblings = {
    prev: idx > 0 ? videos[idx - 1] : null,
    next: idx >= 0 && idx < videos.length - 1 ? videos[idx + 1] : null,
  };

  let pathProgress = { completed: 0, total: videos.length, percent: 0 };
  let weekGoal = {
    weeklyGoal: Math.max(1, Number(path.weekly_goal) || 3),
    weeklyCompleted: 0,
    weeklyRemaining: Math.max(1, Number(path.weekly_goal) || 3),
    weeklyMet: false,
  };

  if (userEmail && videos.length) {
    const ids = videos.map((v) => v.id);
    const { data: progressRows } = await supabase
      .from('og_progress')
      .select('resource_id, status, percent_watched, updated_at')
      .eq('user_email', userEmail)
      .in('resource_id', ids);

    const done = (progressRows || []).filter(
      (p) =>
        p.status === 'COMPLETED' ||
        p.status === 'SKIPPED' ||
        (p.percent_watched ?? 0) >= 90
    );
    pathProgress = {
      completed: done.length,
      total: videos.length,
      percent:
        videos.length > 0
          ? Math.round((done.length / videos.length) * 100)
          : 0,
    };

    const weekStart = new Date();
    const day = weekStart.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    weekStart.setUTCDate(weekStart.getUTCDate() - diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weeklyCompleted = done.filter((p) => {
      const t = new Date(p.updated_at).getTime();
      return !Number.isNaN(t) && t >= weekStart.getTime();
    }).length;
    const goal = weekGoal.weeklyGoal;
    weekGoal = {
      weeklyGoal: goal,
      weeklyCompleted,
      weeklyRemaining: Math.max(0, goal - weeklyCompleted),
      weeklyMet: weeklyCompleted >= goal,
    };
  }

  return {
    found: true,
    locked,
    isPremium,
    path: {
      id: path.id,
      slug: path.slug,
      title: path.title,
      isPremium: path.is_premium,
      weeklyGoal: weekGoal.weeklyGoal,
    },
    resource: sanitized,
    progress,
    siblings,
    pathProgress,
    weekGoal,
    youtubeVideoId: videoId,
  };
}
