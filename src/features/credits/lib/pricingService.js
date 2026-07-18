import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import {
  SIGNUP_BONUS_CREDITS,
  CREDIT_COST,
  SUBSCRIPTION_PLANS,
} from '@/features/credits/lib/constants';

const CACHE_MS = 30_000;

let cache = null;
let cacheAt = 0;

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

function defaultConfig() {
  return {
    signupBonus: SIGNUP_BONUS_CREDITS,
    costs: { ...CREDIT_COST },
    plans: { ...SUBSCRIPTION_PLANS },
    planList: Object.values(SUBSCRIPTION_PLANS),
    source: 'constants',
  };
}

function mapPlanRow(row) {
  if (!row?.id) return null;
  const plan = {
    id: row.id,
    name: row.name,
    description: row.description || '',
    priceInr: row.price_inr,
    badge: row.badge || null,
    isActive: row.is_active !== false,
    sortOrder: row.sort_order ?? 0,
  };
  if (row.duration_hours) {
    plan.durationHours = row.duration_hours;
  } else if (row.duration_days) {
    plan.durationDays = row.duration_days;
  }
  return plan;
}

function buildFromDb(settingsRow, planRows) {
  const costs = {
    practice_question:
      settingsRow?.practice_question_cost ?? CREDIT_COST.practice_question,
    mock_test: settingsRow?.mock_test_cost ?? CREDIT_COST.mock_test,
  };

  const planList = (planRows || [])
    .map(mapPlanRow)
    .filter(Boolean)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const plans = {};
  for (const plan of planList) {
    const { isActive, sortOrder, ...rest } = plan;
    plans[plan.id] = rest;
  }

  return {
    signupBonus: settingsRow?.signup_bonus_credits ?? SIGNUP_BONUS_CREDITS,
    costs,
    plans,
    planList,
    source: 'database',
  };
}

/** Load pricing from DB with short in-memory cache; falls back to constants.js. */
export async function getPricingConfig({ force = false } = {}) {
  if (!force && cache && Date.now() - cacheAt < CACHE_MS) {
    return cache;
  }

  try {
    const supabase = db();
    const [settingsRes, plansRes] = await Promise.all([
      supabase.from('credit_pricing_settings').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('subscription_plans_catalog')
        .select('*')
        .order('sort_order', { ascending: true }),
    ]);

    const settingsMissing = settingsRes.error?.code === '42P01';
    const plansMissing = plansRes.error?.code === '42P01';

    if (settingsMissing || plansMissing) {
      cache = defaultConfig();
      cacheAt = Date.now();
      return cache;
    }

    if (settingsRes.error) console.error('getPricingConfig settings', settingsRes.error);
    if (plansRes.error) console.error('getPricingConfig plans', plansRes.error);

    const hasDbData = settingsRes.data || (plansRes.data || []).length > 0;
    cache = hasDbData
      ? buildFromDb(settingsRes.data, plansRes.data)
      : defaultConfig();
    cacheAt = Date.now();
    return cache;
  } catch (err) {
    console.error('getPricingConfig', err);
    return defaultConfig();
  }
}

export function invalidatePricingCache() {
  cache = null;
  cacheAt = 0;
}

export async function getCreditCost(type) {
  const config = await getPricingConfig();
  return config.costs[type] ?? CREDIT_COST[type] ?? null;
}

export async function getActivePlansForCheckout() {
  const config = await getPricingConfig();
  return (config.planList || []).filter((p) => p.isActive !== false);
}

export async function getPlanById(planId) {
  const config = await getPricingConfig();
  const fromList = (config.planList || []).find((p) => p.id === planId);
  if (fromList) return fromList;
  const fallback = config.plans[planId] || SUBSCRIPTION_PLANS[planId];
  return fallback ? { ...fallback, isActive: true } : null;
}

export function planAmountPaiseFromConfig(plan) {
  if (!plan?.priceInr) return null;
  return plan.priceInr * 100;
}
