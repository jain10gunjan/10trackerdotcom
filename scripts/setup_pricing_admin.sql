-- Admin-managed pricing (credits + subscription plans)
-- Run in Supabase SQL Editor. Safe to re-run.
--
-- Security model (same as mock_tests):
--   • Students read pricing via Next.js API (/api/credits/wallet, /api/subscriptions/*)
--   • Admin edits via /api/admin/pricing after NextAuth admin check + anon key server client
--   • Do not expose admin credentials in the browser

-- ── Credit costs (singleton row) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_pricing_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  signup_bonus_credits INTEGER NOT NULL DEFAULT 60 CHECK (signup_bonus_credits >= 0),
  practice_question_cost INTEGER NOT NULL DEFAULT 1 CHECK (practice_question_cost >= 0),
  mock_test_cost INTEGER NOT NULL DEFAULT 5 CHECK (mock_test_cost >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.credit_pricing_settings (id, signup_bonus_credits, practice_question_cost, mock_test_cost)
VALUES (1, 60, 1, 5)
ON CONFLICT (id) DO NOTHING;

-- ── Subscription plan catalog ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_inr INTEGER NOT NULL CHECK (price_inr > 0),
  duration_hours INTEGER CHECK (duration_hours IS NULL OR duration_hours > 0),
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_plans_catalog_duration_chk CHECK (
    (duration_hours IS NOT NULL AND duration_days IS NULL)
    OR (duration_days IS NOT NULL AND duration_hours IS NULL)
  )
);

INSERT INTO public.subscription_plans_catalog
  (id, name, description, price_inr, duration_hours, duration_days, badge, is_active, sort_order)
VALUES
  (
    'day_pass',
    '24-Hour Unlimited',
    'Unlimited practice & mock tests for exactly 24 hours from purchase',
    5,
    24,
    NULL,
    'Try unlimited',
    true,
    1
  ),
  (
    'three_months',
    '3 Months Unlimited',
    'Full access for 90 days — best for serious prep',
    100,
    NULL,
    90,
    'Popular',
    true,
    2
  ),
  (
    'six_months',
    '6 Months Unlimited',
    'Full access for 180 days — maximum savings',
    149,
    NULL,
    180,
    'Best value',
    true,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.credit_pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans_catalog ENABLE ROW LEVEL SECURITY;

-- Public read (pricing page + wallet API use server; policies allow anon SELECT)
DROP POLICY IF EXISTS credit_pricing_settings_read ON public.credit_pricing_settings;
CREATE POLICY credit_pricing_settings_read ON public.credit_pricing_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS credit_pricing_settings_admin_write ON public.credit_pricing_settings;
CREATE POLICY credit_pricing_settings_admin_write ON public.credit_pricing_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS subscription_plans_catalog_read_active ON public.subscription_plans_catalog;
CREATE POLICY subscription_plans_catalog_read_active ON public.subscription_plans_catalog
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS subscription_plans_catalog_admin_select ON public.subscription_plans_catalog;
CREATE POLICY subscription_plans_catalog_admin_select ON public.subscription_plans_catalog
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS subscription_plans_catalog_admin_write ON public.subscription_plans_catalog;
CREATE POLICY subscription_plans_catalog_admin_write ON public.subscription_plans_catalog
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS subscription_plans_catalog_admin_update ON public.subscription_plans_catalog;
CREATE POLICY subscription_plans_catalog_admin_update ON public.subscription_plans_catalog
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.credit_pricing_settings TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.subscription_plans_catalog TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
