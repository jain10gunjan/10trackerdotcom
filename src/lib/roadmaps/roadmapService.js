import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  calculateRoadmapProgress,
  progressMapFromRows,
  sanitizeDayForClient,
  isDayUnlocked,
  buildDaySummary,
} from '@/lib/roadmaps/progressUtils';
import { getOrSetCached, invalidateCached } from '@/lib/cache/serverTtlCache';
import { ROADMAP_DAYS_PAGE_SIZE } from '@/lib/roadmaps/constants';

export const ROADMAPS_SETUP_HINT =
  'Run scripts/setup_roadmaps.sql and scripts/fix_roadmaps_rls_secure.sql in Supabase SQL Editor, then reload the API schema.';

const ROADMAP_DAYS_CACHE_TTL_MS = 60 * 1000;

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

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

export async function listActiveRoadmaps() {
  const supabase = db();
  const { data, error } = await supabase
    .from('roadmaps')
    .select('id, slug, title, description, price_inr, free_preview_days, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    if (error.code === '42P01') return { roadmaps: [], setupRequired: true, error };
    throw error;
  }
  return { roadmaps: data || [], setupRequired: false };
}

export async function getRoadmapBySlug(slug) {
  const supabase = db();
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function userHasPurchased(userEmail, roadmapId) {
  if (!userEmail || !roadmapId) return false;
  const supabase = db();
  const { data, error } = await supabase
    .from('roadmap_purchases')
    .select('id')
    .eq('user_email', normalizeEmail(userEmail))
    .eq('roadmap_id', roadmapId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getUserProgress(userId, roadmapId) {
  const supabase = db();
  const { data, error } = await supabase
    .from('roadmap_user_progress')
    .select('task_id, status, user_notes')
    .eq('user_id', userId)
    .eq('roadmap_id', roadmapId);

  if (error) throw error;
  return progressMapFromRows(data);
}

export async function fetchRoadmapDays(roadmapId) {
  const supabase = db();
  const { data, error } = await supabase
    .from('roadmap_days')
    .select('*')
    .eq('roadmap_id', roadmapId)
    .order('day_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchRoadmapDaysCached(roadmapId) {
  return getOrSetCached(
    `roadmap-days:${roadmapId}`,
    ROADMAP_DAYS_CACHE_TTL_MS,
    () => fetchRoadmapDays(roadmapId)
  );
}

export function invalidateRoadmapDaysCache(roadmapId) {
  invalidateCached(`roadmap-days:${roadmapId}`);
}

function dayMatchesFocus(day, focusArea) {
  if (!focusArea) return true;
  const target = focusArea.toLowerCase();
  return (day.focus_areas || []).some((fa) => fa.focus_area?.toLowerCase() === target);
}

function dayMatchesSearch(day, search, unlocked) {
  if (!search) return true;
  const q = search.trim().toLowerCase();
  if (`day ${day.day_number}`.includes(q)) return true;
  if (!unlocked) {
    return (day.focus_areas || []).some((fa) => fa.focus_area?.toLowerCase().includes(q));
  }
  return (day.focus_areas || []).some(
    (fa) =>
      fa.focus_area?.toLowerCase().includes(q) ||
      (fa.tasks || []).some((t) => t.task?.toLowerCase().includes(q))
  );
}

function filterDaysRaw(daysRaw, { focusArea, search, dayNumber, purchased, freePreviewDays }) {
  return daysRaw.filter((day) => {
    if (dayNumber != null && day.day_number !== dayNumber) return false;
    const unlocked = isDayUnlocked(day.day_number, freePreviewDays, purchased);
    if (focusArea && !dayMatchesFocus(day, focusArea)) return false;
    if (search && !dayMatchesSearch(day, search, unlocked)) return false;
    return true;
  });
}

function buildSummariesFromRaw(daysRaw, roadmap, purchased, progressMap) {
  return daysRaw.map((day) => {
    const unlocked = isDayUnlocked(day.day_number, roadmap.free_preview_days, purchased);
    return buildDaySummary(day, unlocked, progressMap);
  });
}

function sanitizeDaysPage(daysRaw, roadmap, purchased) {
  return daysRaw.map((day) =>
    sanitizeDayForClient(
      day,
      isDayUnlocked(day.day_number, roadmap.free_preview_days, purchased)
    )
  );
}

function extractFocusAreaList(summaries) {
  const set = new Set();
  for (const s of summaries) {
    if (s.locked) {
      for (const l of s.focus_area_labels || []) if (l) set.add(l);
    } else {
      for (const fa of s.focus_areas || []) if (fa.focus_area) set.add(fa.focus_area);
    }
  }
  return [...set].sort();
}

/**
 * Paginated viewer payload — summaries for all days (slim), full days for one page only.
 */
export async function buildRoadmapViewerPayload(
  slug,
  userEmail = null,
  { dayOffset = 0, dayLimit = ROADMAP_DAYS_PAGE_SIZE, focusArea = null, search = null } = {}
) {
  const roadmap = await getRoadmapBySlug(slug);
  if (!roadmap || (!roadmap.is_active && !userEmail)) {
    return null;
  }

  const userId = userEmail ? normalizeEmail(userEmail) : null;
  const purchased = userId ? await userHasPurchased(userId, roadmap.id) : false;
  const daysRaw = await fetchRoadmapDaysCached(roadmap.id);
  const progressMap = userId ? await getUserProgress(userId, roadmap.id) : {};

  const daySummaries = buildSummariesFromRaw(daysRaw, roadmap, purchased, progressMap);
  const focusAreas = extractFocusAreaList(daySummaries);

  const filtered = filterDaysRaw(daysRaw, {
    focusArea,
    search,
    purchased,
    freePreviewDays: roadmap.free_preview_days,
  });

  const totalFiltered = filtered.length;
  const pageRaw = filtered.slice(dayOffset, dayOffset + dayLimit);
  const days = sanitizeDaysPage(pageRaw, roadmap, purchased);

  const unlockedDaysRaw = daysRaw.filter((d) =>
    isDayUnlocked(d.day_number, roadmap.free_preview_days, purchased)
  );
  const progress = calculateRoadmapProgress(unlockedDaysRaw, progressMap);
  const totalDays = daysRaw.length;
  const unlockedDayCount = purchased
    ? totalDays
    : daysRaw.filter((d) => d.day_number <= roadmap.free_preview_days).length;

  return {
    roadmap: {
      id: roadmap.id,
      slug: roadmap.slug,
      title: roadmap.title,
      description: roadmap.description,
      price_inr: roadmap.price_inr,
      free_preview_days: roadmap.free_preview_days,
      is_active: roadmap.is_active,
    },
    purchased,
    progress,
    totalDays,
    unlockedDayCount,
    daySummaries,
    focusAreas,
    days,
    pagination: {
      offset: dayOffset,
      limit: dayLimit,
      total: totalFiltered,
      hasMore: dayOffset + dayLimit < totalFiltered,
      filtered: Boolean(focusArea || search),
    },
    progressMap: userId ? progressMap : null,
  };
}

export async function fetchRoadmapDaysPage(
  slug,
  userEmail,
  { dayOffset = 0, dayLimit = ROADMAP_DAYS_PAGE_SIZE, focusArea = null, search = null, dayNumber = null } = {}
) {
  const roadmap = await getRoadmapBySlug(slug);
  if (!roadmap) return null;

  const userId = userEmail ? normalizeEmail(userEmail) : null;
  const purchased = userId ? await userHasPurchased(userId, roadmap.id) : false;
  const daysRaw = await fetchRoadmapDaysCached(roadmap.id);

  const filtered = filterDaysRaw(daysRaw, {
    focusArea,
    search,
    dayNumber: dayNumber != null ? Number(dayNumber) : null,
    purchased,
    freePreviewDays: roadmap.free_preview_days,
  });

  const pageRaw = dayNumber != null ? filtered : filtered.slice(dayOffset, dayOffset + dayLimit);
  const days = sanitizeDaysPage(pageRaw, roadmap, purchased);

  return {
    days,
    pagination: {
      offset: dayOffset,
      limit: dayLimit,
      total: filtered.length,
      hasMore: dayNumber == null && dayOffset + dayLimit < filtered.length,
    },
  };
}

export async function buildRoadmapDetail(slug, userEmail = null) {
  const payload = await buildRoadmapViewerPayload(slug, userEmail, {
    dayOffset: 0,
    dayLimit: ROADMAP_DAYS_PAGE_SIZE,
  });
  if (!payload) return null;

  return {
    roadmap: payload.roadmap,
    purchased: payload.purchased,
    progress: payload.progress,
    totalDays: payload.totalDays,
    unlockedDayCount: payload.unlockedDayCount,
    daySummaries: payload.daySummaries,
    focusAreas: payload.focusAreas,
    days: payload.days,
    pagination: payload.pagination,
    progressMap: payload.progressMap,
  };
}

/** Lightweight summaries for catalog "My roadmaps" strip — batched queries, no N+1. */
export async function listUserRoadmapSummaries(userEmail) {
  const email = normalizeEmail(userEmail);
  if (!email) return [];

  const supabase = db();
  const { data: purchases, error } = await supabase
    .from('roadmap_purchases')
    .select('roadmap_id, purchased_at')
    .eq('user_email', email)
    .order('purchased_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  if (!purchases?.length) return [];

  const roadmapIds = purchases.map((p) => p.roadmap_id);

  const [{ data: roadmaps, error: rErr }, { data: daysRaw, error: dErr }, { data: progressRows, error: pErr }] =
    await Promise.all([
      supabase
        .from('roadmaps')
        .select('id, slug, title, description')
        .in('id', roadmapIds),
      supabase
        .from('roadmap_days')
        .select('roadmap_id, day_number, focus_areas')
        .in('roadmap_id', roadmapIds)
        .order('day_number', { ascending: true }),
      supabase
        .from('roadmap_user_progress')
        .select('roadmap_id, task_id, status, user_notes')
        .eq('user_id', email)
        .in('roadmap_id', roadmapIds),
    ]);

  if (rErr) throw rErr;
  if (dErr) throw dErr;
  if (pErr) throw pErr;

  const metaById = Object.fromEntries((roadmaps || []).map((r) => [r.id, r]));
  const daysByRoadmap = {};
  for (const day of daysRaw || []) {
    if (!daysByRoadmap[day.roadmap_id]) daysByRoadmap[day.roadmap_id] = [];
    daysByRoadmap[day.roadmap_id].push(day);
  }

  const progressByRoadmap = {};
  for (const row of progressRows || []) {
    if (!progressByRoadmap[row.roadmap_id]) progressByRoadmap[row.roadmap_id] = [];
    progressByRoadmap[row.roadmap_id].push(row);
  }

  const results = [];
  for (const p of purchases) {
    const meta = metaById[p.roadmap_id];
    if (!meta) continue;
    const days = daysByRoadmap[p.roadmap_id] || [];
    const progressMap = progressMapFromRows(progressByRoadmap[p.roadmap_id] || []);
    const progress = calculateRoadmapProgress(days, progressMap);
    results.push({
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      purchasedAt: p.purchased_at,
      progressPercent: progress.percent,
      href: `/roadmaps/${meta.slug}`,
    });
  }
  return results;
}

/** @deprecated Use listUserRoadmapSummaries — kept as alias for compatibility. */
export async function listUserPurchasedRoadmaps(userEmail) {
  return listUserRoadmapSummaries(userEmail);
}

export async function upsertTaskProgress(userId, roadmapId, taskId, patch) {
  const supabase = db();
  const row = {
    user_id: userId,
    roadmap_id: roadmapId,
    task_id: taskId,
    status: patch.status || 'not_completed',
    user_notes: patch.user_notes ?? '',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('roadmap_user_progress').upsert(row, {
    onConflict: 'user_id,roadmap_id,task_id',
  });

  if (error) throw error;
}

export async function upsertTaskProgressBatch(userId, roadmapId, tasks) {
  if (!tasks?.length) return;
  const supabase = db();
  const now = new Date().toISOString();
  const rows = tasks.map(({ taskId, status, userNotes }) => ({
    user_id: userId,
    roadmap_id: roadmapId,
    task_id: taskId,
    status: status === 'completed' ? 'completed' : 'not_completed',
    user_notes: typeof userNotes === 'string' ? userNotes : '',
    updated_at: now,
  }));

  const { error } = await supabase.from('roadmap_user_progress').upsert(rows, {
    onConflict: 'user_id,roadmap_id,task_id',
  });

  if (error) throw error;
}

export async function assertCanEditTask(userEmail, roadmap, dayNumber) {
  const purchased = await userHasPurchased(userEmail, roadmap.id);
  if (purchased) return true;
  return dayNumber <= (roadmap.free_preview_days || 0);
}

export async function recordPurchase({
  userEmail,
  roadmapId,
  amountPaise,
  razorpayOrderId,
  razorpayPaymentId,
  termsAcceptedAt,
  termsVersion,
}) {
  const supabase = db();
  const { error } = await supabase.from('roadmap_purchases').upsert(
    {
      user_email: normalizeEmail(userEmail),
      roadmap_id: roadmapId,
      amount_paise: amountPaise,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      terms_accepted_at: termsAcceptedAt,
      terms_version: termsVersion,
      purchased_at: new Date().toISOString(),
    },
    { onConflict: 'user_email,roadmap_id' }
  );

  if (error) throw error;
}
