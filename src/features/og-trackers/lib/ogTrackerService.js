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
  return error?.code === '42P01' || /does not exist/i.test(String(error?.message || ''));
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
  const base = {
    id: resource.id,
    pathId: resource.path_id,
    type: resource.type,
    sortOrder: resource.sort_order,
    title: resource.title,
    difficulty: resource.difficulty || null,
    durationSeconds: resource.duration_seconds ?? null,
    isPremium: resource.is_premium,
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

export async function getPathBySlug(slug, email = null) {
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
      };
    }
  }

  const lockedPath = pathIsLocked(path, isPremium);
  const sanitized = (resources || []).map((r) => {
    const locked = resourceIsLocked(path, r, isPremium);
    return {
      ...sanitizeResource(r, locked),
      progress: progressByResource[r.id] || {
        status: 'NOT_STARTED',
        percentWatched: 0,
        updatedAt: null,
      },
    };
  });

  const completed = sanitized.filter((r) => r.progress?.status === 'COMPLETED').length;

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
      totalResources: sanitized.length,
      completedResources: completed,
      percent:
        sanitized.length > 0
          ? Math.round((completed / sanitized.length) * 100)
          : 0,
    },
    resources: sanitized,
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
  for (const r of resources || []) {
    if (r.type === 'VIDEO') videosCompleted += 1;
    else if (r.type === 'LEETCODE_PROBLEM') leetcodeSolved += 1;
    else if (r.type === 'CODESTUDIO_PROBLEM') codestudioSolved += 1;
    else if (r.type === 'HACKERRANK_PROBLEM') hackerrankSolved += 1;
  }

  return {
    videosCompleted,
    leetcodeSolved,
    codestudioSolved,
    hackerrankSolved,
    isPremium,
  };
}

/**
 * Upsert progress — never regress percent_watched.
 */
export async function upsertProgress(email, { resourceId, percentWatched, status }) {
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
    percentWatched != null ? Math.max(0, Math.min(100, Math.floor(Number(percentWatched)))) : prevPercent;
  if (nextPercent < prevPercent) nextPercent = prevPercent;

  let nextStatus = status || existing?.status || 'NOT_STARTED';
  if (nextPercent >= 90) nextStatus = 'COMPLETED';
  else if (nextPercent > 0 && nextStatus === 'NOT_STARTED') nextStatus = 'IN_PROGRESS';

  const { data, error } = await supabase
    .from('og_progress')
    .upsert(
      {
        user_email: userEmail,
        resource_id: resourceId,
        percent_watched: nextPercent,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,resource_id' }
    )
    .select('resource_id, status, percent_watched, updated_at')
    .single();

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
  const { data, error } = await supabase
    .from('og_paths')
    .insert({
      slug,
      title: String(input.title || '').trim(),
      description: String(input.description || '').trim(),
      category: normalizeCategory(input.category),
      tags: normalizeTags(input.tags),
      icon: normalizeIcon(input.icon),
      sort_order: Number(input.sortOrder) || 0,
      is_premium: Boolean(input.isPremium),
      is_active: input.isActive !== false,
    })
    .select('*')
    .single();

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
  if (input.isPremium != null) patch.is_premium = Boolean(input.isPremium);
  if (input.isActive != null) patch.is_active = Boolean(input.isActive);
  if (input.slug != null) {
    const slug = normalizeSlug(input.slug);
    if (!isValidSlug(slug)) throw new Error('Invalid slug');
    patch.slug = slug;
  }

  const { data, error } = await supabase
    .from('og_paths')
    .update(patch)
    .eq('id', pathId)
    .select('*')
    .single();

  if (error) throw error;
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
  if (type !== 'VIDEO') {
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

  const touchingExternal =
    input.externalSlug !== undefined || input.externalUrl !== undefined || input.type != null;
  if (touchingExternal) {
    const { data: existing } = await supabase
      .from('og_resources')
      .select('type, external_slug, external_url')
      .eq('id', resourceId)
      .maybeSingle();

    const nextType = patch.type || existing?.type;
    if (nextType && nextType !== 'VIDEO') {
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
    } else {
      if (input.externalSlug !== undefined) patch.external_slug = input.externalSlug || null;
      if (input.externalUrl !== undefined) patch.external_url = input.externalUrl || null;
    }
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
