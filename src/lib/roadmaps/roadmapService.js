import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  calculateRoadmapProgress,
  progressMapFromRows,
  sanitizeDayForClient,
  isDayUnlocked,
} from '@/lib/roadmaps/progressUtils';

export const ROADMAPS_SETUP_HINT =
  'Run scripts/setup_roadmaps.sql and scripts/fix_roadmaps_rls_secure.sql in Supabase SQL Editor, then reload the API schema.';

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

export async function buildRoadmapDetail(slug, userEmail = null) {
  const roadmap = await getRoadmapBySlug(slug);
  if (!roadmap || (!roadmap.is_active && !userEmail)) {
    return null;
  }

  const userId = userEmail ? normalizeEmail(userEmail) : null;
  const purchased = userId ? await userHasPurchased(userId, roadmap.id) : false;
  const daysRaw = await fetchRoadmapDays(roadmap.id);
  const progressMap = userId ? await getUserProgress(userId, roadmap.id) : {};

  const days = daysRaw.map((day) =>
    sanitizeDayForClient(day, isDayUnlocked(day.day_number, roadmap.free_preview_days, purchased))
  );

  const progress = calculateRoadmapProgress(daysRaw, progressMap);
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
    days,
    progressMap: userId ? progressMap : null,
  };
}

export async function listUserPurchasedRoadmaps(userEmail) {
  const email = normalizeEmail(userEmail);
  if (!email) return [];

  const supabase = db();
  const { data: purchases, error } = await supabase
    .from('roadmap_purchases')
    .select('roadmap_id, purchased_at, amount_paise')
    .eq('user_email', email)
    .order('purchased_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  if (!purchases?.length) return [];

  const roadmapIds = purchases.map((p) => p.roadmap_id);
  const { data: roadmaps, error: rErr } = await supabase
    .from('roadmaps')
    .select('id, slug, title, description')
    .in('id', roadmapIds);

  if (rErr) throw rErr;

  const byId = Object.fromEntries((roadmaps || []).map((r) => [r.id, r]));
  const userId = email;

  const results = [];
  for (const p of purchases) {
    const meta = byId[p.roadmap_id];
    if (!meta) continue;
    const daysRaw = await fetchRoadmapDays(meta.id);
    const progressMap = await getUserProgress(userId, meta.id);
    const progress = calculateRoadmapProgress(daysRaw, progressMap);
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
