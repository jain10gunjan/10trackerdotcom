/**
 * Sync ONLY questions attached to OG tracker resources.
 * - Incomplete resources only (already COMPLETED skipped)
 * - One judge call per platform with that path's slug list
 * - Optional pathId / resourceIds scope
 */

import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getUserPremiumState, markResourceCompleted } from '@/features/og-trackers/lib/ogTrackerService';
import { normalizeJudgeSlug } from '@/features/og-trackers/lib/judgeUrls';
import { leetcodeService } from '@/features/og-trackers/lib/leetcode';
import { codestudioService } from '@/features/og-trackers/lib/codestudio';
import { hackerrankService } from '@/features/og-trackers/lib/hackerrank';

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

const JUDGE_TYPES = ['LEETCODE_PROBLEM', 'CODESTUDIO_PROBLEM', 'HACKERRANK_PROBLEM'];

function judgeForType(type) {
  if (type === 'LEETCODE_PROBLEM') return leetcodeService;
  if (type === 'CODESTUDIO_PROBLEM') return codestudioService;
  if (type === 'HACKERRANK_PROBLEM') return hackerrankService;
  return null;
}

function usernameForType(premiumState, type) {
  if (type === 'LEETCODE_PROBLEM') return premiumState.leetcodeUsername;
  if (type === 'CODESTUDIO_PROBLEM') return premiumState.codestudioUsername;
  if (type === 'HACKERRANK_PROBLEM') return premiumState.hackerrankUsername;
  return null;
}

function resourceSlug(resource) {
  return (
    normalizeJudgeSlug(resource.external_slug) ||
    normalizeJudgeSlug(resource.external_url) ||
    null
  );
}

/**
 * Load incomplete judge resources for a user (optionally scoped).
 */
async function loadIncompleteJudgeResources(email, { pathId = null, resourceIds = null } = {}) {
  const userEmail = normalizeEmail(email);
  const supabase = db();

  let query = supabase
    .from('og_resources')
    .select('id, path_id, type, external_slug, external_url')
    .in('type', JUDGE_TYPES);

  if (pathId) query = query.eq('path_id', pathId);
  if (resourceIds?.length) query = query.in('id', resourceIds);

  const { data: resources, error } = await query;
  if (error) throw error;
  if (!resources?.length) return [];

  const ids = resources.map((r) => r.id);
  const { data: progress, error: pErr } = await supabase
    .from('og_progress')
    .select('resource_id, status')
    .eq('user_email', userEmail)
    .in('resource_id', ids);

  if (pErr) throw pErr;

  const completed = new Set(
    (progress || []).filter((p) => p.status === 'COMPLETED').map((p) => p.resource_id)
  );

  return resources
    .filter((r) => !completed.has(r.id))
    .map((r) => ({ ...r, slug: resourceSlug(r) }))
    .filter((r) => r.slug);
}

/**
 * Core: check only tracker question URLs/slugs → mark completed.
 */
export async function syncTrackerProblems(email, options = {}) {
  const userEmail = normalizeEmail(email);
  const premium = await getUserPremiumState(userEmail);
  if (!premium.isPremium) {
    return { ok: false, error: 'Premium required for judge sync', status: 403, updated: 0 };
  }

  const incomplete = await loadIncompleteJudgeResources(userEmail, options);
  if (!incomplete.length) {
    return { ok: true, updated: 0, checked: 0, status: 200 };
  }

  /** @type {Record<string, typeof incomplete>} */
  const byType = {};
  for (const r of incomplete) {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r);
  }

  let updated = 0;
  let checked = 0;
  const details = [];

  for (const type of Object.keys(byType)) {
    const judge = judgeForType(type);
    const username = usernameForType(premium, type);
    const rows = byType[type];
    if (!judge || !username) {
      details.push({
        type,
        skipped: true,
        reason: username ? 'No judge client' : 'Username not set',
        count: rows.length,
      });
      continue;
    }

    const slugs = [...new Set(rows.map((r) => r.slug))];
    checked += slugs.length;

    let statusMap;
    try {
      statusMap = await judge.checkProblems(username, slugs);
    } catch (err) {
      console.error(`[judgeSync] ${type}`, err.message);
      details.push({ type, error: err.message, count: rows.length });
      continue;
    }

    for (const r of rows) {
      const status = statusMap.get(r.slug);
      if (status === 'SOLVED') {
        await markResourceCompleted(userEmail, r.id);
        updated += 1;
      }
    }

    details.push({
      type,
      checked: slugs.length,
      solved: rows.filter((r) => statusMap.get(r.slug) === 'SOLVED').length,
    });
  }

  return { ok: true, updated, checked, details, status: 200 };
}

/**
 * Sync a single problem resource (Open problem / Check status).
 */
export async function syncSingleResource(email, resourceId) {
  const premium = await getUserPremiumState(email);
  if (!premium.isPremium) {
    return { ok: false, error: 'Premium required for judge sync', status: 403 };
  }

  const supabase = db();
  const { data: resource, error } = await supabase
    .from('og_resources')
    .select('id, type, external_slug, external_url')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) throw error;
  if (!resource) return { ok: false, error: 'Resource not found', status: 404 };

  const judge = judgeForType(resource.type);
  if (!judge) {
    return { ok: false, error: 'Not a judge problem resource', status: 400 };
  }

  const username = usernameForType(premium, resource.type);
  if (!username) {
    return { ok: false, error: 'Set your judge username in OG Trackers settings', status: 400 };
  }

  const slug = resourceSlug(resource);
  if (!slug) {
    return { ok: false, error: 'Resource missing problem URL/slug', status: 400 };
  }

  const statusMap = await judge.checkProblems(username, [slug]);
  const judgeStatus = statusMap.get(slug) || 'NOT_STARTED';

  if (judgeStatus === 'SOLVED') {
    await markResourceCompleted(email, resource.id);
    return { ok: true, status: 'COMPLETED', judgeStatus, slug };
  }

  return { ok: true, status: 'NOT_STARTED', judgeStatus, slug };
}

/** Full account refresh — all incomplete tracker problems. */
export async function syncUserJudges(email) {
  return syncTrackerProblems(email);
}

/** Path-scoped refresh — only questions on this OG tracker. */
export async function syncPathJudges(email, pathId) {
  if (!pathId) {
    return { ok: false, error: 'pathId required', status: 400, updated: 0 };
  }
  return syncTrackerProblems(email, { pathId });
}

export async function syncAllPremiumUsers() {
  const supabase = db();
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('user_email, leetcode_username, codestudio_username, hackerrank_username')
    .eq('is_premium', true);

  if (error) throw error;

  const results = [];
  for (const u of users || []) {
    if (!u.leetcode_username && !u.codestudio_username && !u.hackerrank_username) continue;
    try {
      const r = await syncTrackerProblems(u.user_email);
      results.push({ email: u.user_email, ...r });
    } catch (err) {
      results.push({ email: u.user_email, ok: false, error: err.message });
    }
  }

  return { ok: true, users: results.length, results };
}
