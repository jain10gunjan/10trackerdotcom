import { normalizeEmail } from '@/lib/normalizeEmail';

function looksLikeEmail(value) {
  const v = String(value || '').trim();
  return v.includes('@') && v.includes('.');
}

function emptyUsageAccumulator() {
  return {
    totalPoints: 0,
    totalCompleted: 0,
    totalCorrect: 0,
    areas: {},
  };
}

function addProgressRow(usageByKey, userKey, row) {
  const key = String(userKey || '').trim();
  if (!key) return;

  const area = row.area || 'unknown';
  const topic = row.topic || 'unknown-topic';
  const completedCount = Array.isArray(row.completedquestions)
    ? row.completedquestions.length
    : 0;
  const correctCount = Array.isArray(row.correctanswers)
    ? row.correctanswers.length
    : 0;
  const points = row.points || 0;

  if (!usageByKey[key]) {
    usageByKey[key] = emptyUsageAccumulator();
  }

  const entry = usageByKey[key];
  entry.totalPoints += points;
  entry.totalCompleted += completedCount;
  entry.totalCorrect += correctCount;

  if (!entry.areas[area]) {
    entry.areas[area] = {
      area,
      topics: new Set(),
      completed: 0,
      correct: 0,
      points: 0,
    };
  }

  const areaEntry = entry.areas[area];
  areaEntry.topics.add(topic);
  areaEntry.completed += completedCount;
  areaEntry.correct += correctCount;
  areaEntry.points += points;
}

export function serializeUsage(rawUsage) {
  if (!rawUsage) return null;
  return {
    totalPoints: rawUsage.totalPoints,
    totalCompleted: rawUsage.totalCompleted,
    totalCorrect: rawUsage.totalCorrect,
    areas: Object.values(rawUsage.areas).map((a) => ({
      area: a.area,
      topicsCount: a.topics.size,
      completed: a.completed,
      correct: a.correct,
      points: a.points,
    })),
  };
}

export function buildUsageIndex(progressRows = []) {
  const usageByKey = {};

  for (const row of progressRows) {
    const userId = row.user_id;
    if (!userId) continue;

    const key = looksLikeEmail(userId) ? normalizeEmail(userId) : String(userId).trim();
    addProgressRow(usageByKey, key, row);
  }

  return usageByKey;
}

export function resolveUsageForKeys(usageByKey, keys = []) {
  const merged = emptyUsageAccumulator();
  const seenAreaTopics = new Map();

  for (const rawKey of keys) {
    const key = String(rawKey || '').trim();
    if (!key) continue;
    const raw = usageByKey[key];
    if (!raw) continue;

    merged.totalPoints += raw.totalPoints;
    merged.totalCompleted += raw.totalCompleted;
    merged.totalCorrect += raw.totalCorrect;

    for (const [area, areaEntry] of Object.entries(raw.areas)) {
      if (!merged.areas[area]) {
        merged.areas[area] = {
          area,
          topics: new Set(),
          completed: 0,
          correct: 0,
          points: 0,
        };
        seenAreaTopics.set(area, new Set());
      }
      const target = merged.areas[area];
      const topicSet = seenAreaTopics.get(area);
      areaEntry.topics.forEach((t) => topicSet.add(t));
      target.topics = topicSet;
      target.completed += areaEntry.completed;
      target.correct += areaEntry.correct;
      target.points += areaEntry.points;
    }
  }

  const hasData =
    merged.totalPoints > 0 ||
    merged.totalCompleted > 0 ||
    merged.totalCorrect > 0 ||
    Object.keys(merged.areas).length > 0;

  return hasData ? serializeUsage(merged) : null;
}

/** Legacy accounts from Clerk (paginated, max 500 per request). */
export async function fetchClerkUsers(clerkSecret) {
  if (!clerkSecret) {
    return { users: [], error: 'CLERK_SECRET_KEY is not configured' };
  }

  const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=500', {
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!clerkRes.ok) {
    const text = await clerkRes.text();
    console.error('Clerk users API error:', clerkRes.status, text);
    return { users: [], error: 'Failed to fetch users from Clerk' };
  }

  const clerkJson = await clerkRes.json();
  const clerkUsers = Array.isArray(clerkJson) ? clerkJson : clerkJson?.data || [];
  return { users: clerkUsers, error: null };
}

export function mapClerkUser(cu, { usageByKey, walletsByEmail }) {
  const primaryEmail =
    cu.primary_email_address?.email_address ||
    cu.email_addresses?.[0]?.email_address ||
    cu.email ||
    null;
  const normalizedEmail = primaryEmail ? normalizeEmail(primaryEmail) : null;
  const name =
    `${cu.first_name || ''} ${cu.last_name || ''}`.trim() ||
    primaryEmail ||
    cu.id;

  const usage = resolveUsageForKeys(usageByKey, [
    cu.id,
    normalizedEmail,
    primaryEmail,
  ]);

  const wallet = normalizedEmail ? walletsByEmail[normalizedEmail] || null : null;

  return {
    id: cu.id,
    email: primaryEmail,
    name,
    createdAt: cu.created_at || null,
    lastSignInAt: cu.last_sign_in_at || cu.updated_at || null,
    imageUrl: cu.profile_image_url || cu.image_url || null,
    authSource: 'clerk',
    usage,
    wallet,
  };
}

/**
 * Google / NextAuth users discovered from Supabase activity (excludes Clerk emails).
 */
export async function fetchOauthUsers(supabase, { clerkEmailSet, usageByKey, walletsByEmail }) {
  const oauthByEmail = new Map();

  const touch = (rawEmail, patch = {}) => {
    const email = normalizeEmail(rawEmail);
    if (!email || !looksLikeEmail(email)) return;
    if (clerkEmailSet.has(email)) return;

    const existing = oauthByEmail.get(email) || {
      id: email,
      email,
      name: email.split('@')[0],
      createdAt: null,
      lastActivityAt: null,
      imageUrl: null,
      authSource: 'oauth',
      hasProfile: false,
      activitySources: new Set(),
      usage: null,
      wallet: walletsByEmail[email] || null,
    };

    if (patch.name) existing.name = patch.name;
    if (patch.imageUrl) existing.imageUrl = patch.imageUrl;
    if (patch.createdAt) {
      if (!existing.createdAt || patch.createdAt < existing.createdAt) {
        existing.createdAt = patch.createdAt;
      }
    }
    if (patch.lastActivityAt) {
      if (!existing.lastActivityAt || patch.lastActivityAt > existing.lastActivityAt) {
        existing.lastActivityAt = patch.lastActivityAt;
      }
    }
    if (patch.hasProfile) existing.hasProfile = true;
    if (patch.activitySource) existing.activitySources.add(patch.activitySource);

    oauthByEmail.set(email, existing);
  };

  const [profilesRes, walletRes, attemptsRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_email, email, display_name, first_name, last_name, avatar_url, created_at, updated_at'),
    supabase.from('user_wallet').select('user_email, credits_balance, signup_bonus_granted, created_at, updated_at'),
    supabase
      .from('user_test_attempts')
      .select('user_email, started_at, created_at')
      .order('started_at', { ascending: false })
      .limit(5000),
  ]);

  if (profilesRes.error?.code !== '42P01' && !profilesRes.error) {
    for (const row of profilesRes.data || []) {
      const email = row.user_email || row.email;
      const name =
        row.display_name ||
        `${row.first_name || ''} ${row.last_name || ''}`.trim() ||
        undefined;
      touch(email, {
        name,
        imageUrl: row.avatar_url || null,
        createdAt: row.created_at || null,
        lastActivityAt: row.updated_at || row.created_at || null,
        hasProfile: true,
        activitySource: 'profile',
      });
    }
  }

  if (walletRes.error?.code !== '42P01' && !walletRes.error) {
    for (const row of walletRes.data || []) {
      touch(row.user_email, {
        createdAt: row.created_at || null,
        lastActivityAt: row.updated_at || row.created_at || null,
        activitySource: 'wallet',
      });
      const email = normalizeEmail(row.user_email);
      if (email && oauthByEmail.has(email)) {
        oauthByEmail.get(email).wallet = {
          credits: row.credits_balance ?? 0,
          signupBonusGranted: Boolean(row.signup_bonus_granted),
        };
      }
    }
  }

  if (attemptsRes.error?.code !== '42P01' && !attemptsRes.error) {
    for (const row of attemptsRes.data || []) {
      touch(row.user_email, {
        lastActivityAt: row.started_at || row.created_at || null,
        activitySource: 'mock_test',
      });
    }
  }

  // Emails with practice progress but no profile/wallet row yet
  for (const key of Object.keys(usageByKey)) {
    if (!looksLikeEmail(key)) continue;
    touch(key, { activitySource: 'practice' });
  }

  const oauthUsers = [...oauthByEmail.values()]
    .map((u) => {
      const usage = resolveUsageForKeys(usageByKey, [u.email, normalizeEmail(u.email)]);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
        lastSignInAt: u.lastActivityAt,
        imageUrl: u.imageUrl,
        authSource: 'oauth',
        hasProfile: u.hasProfile,
        activitySources: [...u.activitySources],
        usage,
        wallet: u.wallet,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastSignInAt || a.createdAt || '';
      const bTime = b.lastSignInAt || b.createdAt || '';
      return String(bTime).localeCompare(String(aTime));
    });

  return oauthUsers;
}

/** Merge Clerk + OAuth rows by email (one row per email; Clerk metadata wins on overlap). */
export function mergeAdminUsers(legacyUsers = [], oauthUsers = []) {
  const byEmail = new Map();
  const withoutEmail = [];

  for (const user of legacyUsers) {
    const email = user.email ? normalizeEmail(user.email) : null;
    if (!email) {
      withoutEmail.push({
        ...user,
        authSources: ['clerk'],
        legacyId: user.id,
      });
      continue;
    }

    byEmail.set(email, {
      ...user,
      id: email,
      email: user.email,
      authSources: ['clerk'],
      legacyId: user.id,
      hasProfile: user.hasProfile ?? null,
      activitySources: user.activitySources || [],
    });
  }

  for (const user of oauthUsers) {
    const email = user.email ? normalizeEmail(user.email) : null;
    if (!email) continue;

    const existing = byEmail.get(email);
    if (existing) {
      byEmail.set(email, {
        ...existing,
        name: existing.name || user.name,
        imageUrl: existing.imageUrl || user.imageUrl,
        authSources: [...new Set([...(existing.authSources || []), 'oauth'])],
        hasProfile: existing.hasProfile === true || user.hasProfile === true,
        activitySources: [
          ...new Set([...(existing.activitySources || []), ...(user.activitySources || [])]),
        ],
        lastSignInAt: maxIsoDate(existing.lastSignInAt, user.lastSignInAt),
        createdAt: minIsoDate(existing.createdAt, user.createdAt),
        wallet: existing.wallet || user.wallet,
        usage: existing.usage || user.usage,
      });
      continue;
    }

    byEmail.set(email, {
      ...user,
      id: email,
      authSources: ['oauth'],
      legacyId: null,
    });
  }

  const merged = [...byEmail.values(), ...withoutEmail];
  merged.sort((a, b) => {
    const aTime = a.lastSignInAt || a.createdAt || '';
    const bTime = b.lastSignInAt || b.createdAt || '';
    return String(bTime).localeCompare(String(aTime));
  });

  return merged;
}

function maxIsoDate(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return new Date(a) >= new Date(b) ? a : b;
}

function minIsoDate(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return new Date(a) <= new Date(b) ? a : b;
}

export async function fetchWalletsByEmail(supabase, emails = []) {
  const walletsByEmail = {};
  const unique = [...new Set(emails.map((e) => normalizeEmail(e)).filter(Boolean))];

  if (!unique.length) return walletsByEmail;

  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('user_wallet')
      .select('user_email, credits_balance, signup_bonus_granted')
      .in('user_email', chunk);

    if (error?.code === '42P01') break;
    if (error) {
      console.error('fetchWalletsByEmail', error);
      continue;
    }

    for (const w of data || []) {
      walletsByEmail[normalizeEmail(w.user_email)] = {
        credits: w.credits_balance ?? 0,
        signupBonusGranted: Boolean(w.signup_bonus_granted),
      };
    }
  }

  return walletsByEmail;
}

async function fetchInEmailChunks(supabase, table, select, emails) {
  const rows = [];
  const unique = [...new Set(emails.map((e) => normalizeEmail(e)).filter(Boolean))];
  if (!unique.length) return rows;

  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .in('user_email', chunk);

    if (error?.code === '42P01') break;
    if (error) {
      console.error(`fetchInEmailChunks ${table}`, error.message || error);
      continue;
    }
    rows.push(...(data || []));
  }

  return rows;
}

/** Full profile contact fields keyed by email. */
export async function fetchProfilesByEmail(supabase, emails = []) {
  const profilesByEmail = {};
  let rows = await fetchInEmailChunks(
    supabase,
    'user_profiles',
    'user_email, display_name, first_name, last_name, phone_number, city, state, country, target_exam, target_exams, avatar_url, profile_completed, created_at, updated_at',
    emails
  );

  // Older schemas may lack target_exams — retry without it.
  if (!rows.length && emails.length) {
    rows = await fetchInEmailChunks(
      supabase,
      'user_profiles',
      'user_email, display_name, first_name, last_name, phone_number, city, state, country, target_exam, avatar_url, profile_completed, created_at, updated_at',
      emails
    );
  }

  for (const row of rows) {
    const email = normalizeEmail(row.user_email);
    if (!email) continue;
    profilesByEmail[email] = {
      phoneNumber: row.phone_number || null,
      city: row.city || null,
      state: row.state || null,
      country: row.country || null,
      targetExam: row.target_exam || null,
      targetExams: Array.isArray(row.target_exams) ? row.target_exams : [],
      displayName: row.display_name || null,
      firstName: row.first_name || null,
      lastName: row.last_name || null,
      avatarUrl: row.avatar_url || null,
      profileCompleted: Boolean(row.profile_completed),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
    };
  }

  return profilesByEmail;
}

function pushIndexed(map, email, item) {
  const key = normalizeEmail(email);
  if (!key) return;
  if (!map[key]) map[key] = [];
  map[key].push(item);
}

function isCompletedStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'completed' || s === 'active' || s === 'paid' || s === 'success';
}

function isPendingOrFailedStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'pending' || s === 'failed' || s === 'created' || s === 'attempted';
}

function isActiveSubscription(row, now = Date.now()) {
  if (!row) return false;
  if (String(row.status || '').toLowerCase() !== 'active') return false;
  if (!row.expires_at) return true;
  const exp = new Date(row.expires_at).getTime();
  return !Number.isNaN(exp) && exp > now;
}

/**
 * Batch-load subscriptions + all purchase attempts (subscription, legacy, roadmap).
 */
export async function fetchBillingByEmail(supabase, emails = []) {
  const [
    subscriptions,
    subscriptionOrders,
    legacyOrders,
    roadmapOrders,
    roadmapPurchases,
  ] = await Promise.all([
    fetchInEmailChunks(
      supabase,
      'user_subscriptions',
      'id, user_email, plan_id, status, starts_at, expires_at, amount_paise, razorpay_order_id, razorpay_payment_id, created_at',
      emails
    ),
    fetchInEmailChunks(
      supabase,
      'subscription_orders',
      'id, user_email, plan_id, status, amount_paise, razorpay_order_id, razorpay_payment_id, created_at, updated_at',
      emails
    ),
    fetchInEmailChunks(
      supabase,
      'orders',
      'id, user_email, plan, status, amount, razorpay_order_id, razorpay_payment_id, created_at, updated_at',
      emails
    ),
    fetchInEmailChunks(
      supabase,
      'roadmap_orders',
      'id, user_email, roadmap_id, status, amount_paise, razorpay_order_id, razorpay_payment_id, created_at, updated_at',
      emails
    ),
    fetchInEmailChunks(
      supabase,
      'roadmap_purchases',
      'id, user_email, roadmap_id, amount_paise, razorpay_order_id, razorpay_payment_id, purchased_at',
      emails
    ),
  ]);

  const subscriptionsByEmail = {};
  const ordersByEmail = {};

  for (const row of subscriptions) {
    pushIndexed(subscriptionsByEmail, row.user_email, {
      id: row.id,
      planId: row.plan_id,
      status: row.status,
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
      amountPaise: row.amount_paise ?? null,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      createdAt: row.created_at,
    });
  }

  for (const row of subscriptionOrders) {
    pushIndexed(ordersByEmail, row.user_email, {
      source: 'subscription',
      id: row.id,
      planId: row.plan_id,
      status: row.status,
      amountPaise: row.amount_paise ?? 0,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      at: row.updated_at || row.created_at,
      createdAt: row.created_at,
    });
  }

  for (const row of legacyOrders) {
    pushIndexed(ordersByEmail, row.user_email, {
      source: 'legacy',
      id: row.id,
      planId: row.plan,
      status: row.status,
      amountPaise: row.amount ?? 0,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      at: row.updated_at || row.created_at,
      createdAt: row.created_at,
    });
  }

  for (const row of roadmapOrders) {
    pushIndexed(ordersByEmail, row.user_email, {
      source: 'roadmap',
      id: row.id,
      planId: row.roadmap_id,
      status: row.status,
      amountPaise: row.amount_paise ?? 0,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      at: row.updated_at || row.created_at,
      createdAt: row.created_at,
    });
  }

  // Purchases without a matching completed order still count as purchased
  for (const row of roadmapPurchases) {
    const email = normalizeEmail(row.user_email);
    const existing = ordersByEmail[email] || [];
    const already = existing.some(
      (o) =>
        o.source === 'roadmap' &&
        String(o.planId) === String(row.roadmap_id) &&
        isCompletedStatus(o.status)
    );
    if (already) continue;
    pushIndexed(ordersByEmail, row.user_email, {
      source: 'roadmap',
      id: row.id,
      planId: row.roadmap_id,
      status: 'completed',
      amountPaise: row.amount_paise ?? 0,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      at: row.purchased_at,
      createdAt: row.purchased_at,
    });
  }

  // Newest first
  for (const key of Object.keys(ordersByEmail)) {
    ordersByEmail[key].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  }
  for (const key of Object.keys(subscriptionsByEmail)) {
    subscriptionsByEmail[key].sort((a, b) =>
      String(b.expiresAt || b.createdAt || '').localeCompare(String(a.expiresAt || a.createdAt || ''))
    );
  }

  return { subscriptionsByEmail, ordersByEmail };
}

/**
 * Derive purchase status + active sub + sorted order timeline for one email.
 */
export function summarizeBilling(userEmail, { subscriptionsByEmail = {}, ordersByEmail = {} } = {}) {
  const email = normalizeEmail(userEmail);
  const subscriptions = email ? subscriptionsByEmail[email] || [] : [];
  const orders = email ? ordersByEmail[email] || [] : [];

  const now = Date.now();
  const activeSubscription =
    subscriptions.find((s) => isActiveSubscription(s, now)) || null;

  const hasPurchased =
    Boolean(activeSubscription) ||
    subscriptions.some((s) => isCompletedStatus(s.status) || isActiveSubscription(s, now)) ||
    orders.some((o) => isCompletedStatus(o.status));

  const hasTried =
    !hasPurchased &&
    orders.some((o) => isPendingOrFailedStatus(o.status));

  let purchaseStatus = 'none';
  if (hasPurchased) purchaseStatus = 'purchased';
  else if (hasTried) purchaseStatus = 'tried';

  const completedOrders = orders.filter((o) => isCompletedStatus(o.status));
  const revenuePaise = completedOrders.reduce(
    (sum, o) => sum + (Number(o.amountPaise) || 0),
    0
  );

  return {
    purchaseStatus,
    activeSubscription,
    subscriptions,
    orders,
    totals: {
      orderCount: orders.length,
      completedCount: completedOrders.length,
      pendingCount: orders.filter((o) => isPendingOrFailedStatus(o.status)).length,
      revenuePaise,
    },
  };
}

/** Aggregate billing stats across users for dashboard cards. */
export function summarizeBillingAcrossUsers(users = []) {
  let purchased = 0;
  let tried = 0;
  let none = 0;
  let activeSubs = 0;
  let revenuePaise = 0;

  for (const u of users) {
    const status = u.billing?.purchaseStatus || 'none';
    if (status === 'purchased') purchased += 1;
    else if (status === 'tried') tried += 1;
    else none += 1;

    if (u.billing?.activeSubscription) activeSubs += 1;
    revenuePaise += Number(u.billing?.totals?.revenuePaise) || 0;
  }

  return { purchased, tried, none, activeSubs, revenuePaise };
}

