import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  getSupabaseAdmin,
  formatAdminDbError,
  SUPABASE_ADMIN_SETUP_HINT,
} from '@/lib/supabaseAdmin';
import {
  getPricingConfig,
  invalidatePricingCache,
} from '@/features/credits/lib/pricingService';

const PRICING_SETUP_HINT =
  'Run scripts/setup_pricing_admin.sql in Supabase SQL Editor for admin-managed pricing tables and RLS.';

function adminErrorResponse(err, status = 500) {
  const message = formatAdminDbError(err);
  const setupHint =
    /row-level security|42P01|does not exist/i.test(message)
      ? `${PRICING_SETUP_HINT} ${SUPABASE_ADMIN_SETUP_HINT}`
      : PRICING_SETUP_HINT;
  return NextResponse.json(
    { success: false, error: message, setupHint },
    { status }
  );
}

/** GET — current credit costs + subscription plans (incl. inactive for admin) */
export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const [settingsRes, plansRes] = await Promise.all([
      supabase.from('credit_pricing_settings').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('subscription_plans_catalog')
        .select('*')
        .order('sort_order', { ascending: true }),
    ]);

    if (settingsRes.error?.code === '42P01' || plansRes.error?.code === '42P01') {
      const fallback = await getPricingConfig({ force: true });
      return NextResponse.json({
        success: true,
        usingFallback: true,
        setupHint: PRICING_SETUP_HINT,
        creditSettings: {
          signup_bonus_credits: fallback.signupBonus,
          practice_question_cost: fallback.costs.practice_question,
          mock_test_cost: fallback.costs.mock_test,
        },
        plans: (fallback.planList || []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price_inr: p.priceInr,
          duration_hours: p.durationHours ?? null,
          duration_days: p.durationDays ?? null,
          badge: p.badge,
          is_active: p.isActive !== false,
          sort_order: p.sortOrder ?? 0,
        })),
      });
    }

    if (settingsRes.error) throw settingsRes.error;
    if (plansRes.error) throw plansRes.error;

    return NextResponse.json({
      success: true,
      creditSettings: settingsRes.data,
      plans: plansRes.data || [],
    });
  } catch (err) {
    console.error('[admin pricing GET]', err);
    return adminErrorResponse(err);
  }
}

/** PATCH — update credit settings and/or plan rows */
export async function PATCH(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (body.creditSettings && typeof body.creditSettings === 'object') {
      const cs = body.creditSettings;
      const patch = { updated_at: now };

      if (cs.signup_bonus_credits !== undefined) {
        const v = Number(cs.signup_bonus_credits);
        if (!Number.isFinite(v) || v < 0 || v > 10_000) {
          return NextResponse.json(
            { success: false, error: 'signup_bonus_credits must be 0–10000' },
            { status: 400 }
          );
        }
        patch.signup_bonus_credits = Math.round(v);
      }
      if (cs.practice_question_cost !== undefined) {
        const v = Number(cs.practice_question_cost);
        if (!Number.isFinite(v) || v < 0 || v > 100) {
          return NextResponse.json(
            { success: false, error: 'practice_question_cost must be 0–100' },
            { status: 400 }
          );
        }
        patch.practice_question_cost = Math.round(v);
      }
      if (cs.mock_test_cost !== undefined) {
        const v = Number(cs.mock_test_cost);
        if (!Number.isFinite(v) || v < 0 || v > 500) {
          return NextResponse.json(
            { success: false, error: 'mock_test_cost must be 0–500' },
            { status: 400 }
          );
        }
        patch.mock_test_cost = Math.round(v);
      }

      const { error } = await supabase
        .from('credit_pricing_settings')
        .upsert({ id: 1, ...patch }, { onConflict: 'id' });

      if (error) throw error;
    }

    if (Array.isArray(body.plans)) {
      for (const row of body.plans) {
        const planId = row?.id ? String(row.id).trim() : '';
        if (!planId) continue;

        const patch = { updated_at: now };
        if (row.name !== undefined) {
          const name = String(row.name).trim();
          if (!name) {
            return NextResponse.json(
              { success: false, error: `Plan ${planId}: name cannot be empty` },
              { status: 400 }
            );
          }
          patch.name = name;
        }
        if (row.description !== undefined) patch.description = String(row.description).trim();
        if (row.price_inr !== undefined) {
          const price = Number(row.price_inr);
          if (!Number.isFinite(price) || price <= 0 || price > 100_000) {
            return NextResponse.json(
              { success: false, error: `Plan ${planId}: price_inr must be 1–100000` },
              { status: 400 }
            );
          }
          patch.price_inr = Math.round(price);
        }
        if (row.duration_hours !== undefined) {
          const hours = row.duration_hours === null ? null : Number(row.duration_hours);
          if (hours !== null && (!Number.isFinite(hours) || hours <= 0)) {
            return NextResponse.json(
              { success: false, error: `Plan ${planId}: invalid duration_hours` },
              { status: 400 }
            );
          }
          patch.duration_hours = hours;
          if (hours !== null) patch.duration_days = null;
        }
        if (row.duration_days !== undefined) {
          const days = row.duration_days === null ? null : Number(row.duration_days);
          if (days !== null && (!Number.isFinite(days) || days <= 0)) {
            return NextResponse.json(
              { success: false, error: `Plan ${planId}: invalid duration_days` },
              { status: 400 }
            );
          }
          patch.duration_days = days;
          if (days !== null) patch.duration_hours = null;
        }
        if (row.badge !== undefined) patch.badge = row.badge ? String(row.badge).trim() : null;
        if (row.is_active !== undefined) patch.is_active = Boolean(row.is_active);
        if (row.sort_order !== undefined) patch.sort_order = Math.round(Number(row.sort_order) || 0);

        const { error } = await supabase
          .from('subscription_plans_catalog')
          .update(patch)
          .eq('id', planId);

        if (error) throw error;
      }
    }

    invalidatePricingCache();

    const config = await getPricingConfig({ force: true });
    return NextResponse.json({
      success: true,
      costs: config.costs,
      signupBonus: config.signupBonus,
      planList: config.planList,
    });
  } catch (err) {
    console.error('[admin pricing PATCH]', err);
    return adminErrorResponse(err);
  }
}
