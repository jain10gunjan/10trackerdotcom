-- Credits + subscriptions for 10tracker (run in Supabase SQL Editor, safe to re-run)

CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_email TEXT PRIMARY KEY,
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  signup_bonus_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_idempotency_key
  ON public.credit_ledger (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS credit_ledger_user_email_idx ON public.credit_ledger (user_email);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount_paise INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_email_idx ON public.user_subscriptions (user_email);
CREATE INDEX IF NOT EXISTS user_subscriptions_expires_idx ON public.user_subscriptions (expires_at);

CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  business_name TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal columns for existing deployments
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS terms_version TEXT;
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS gstin TEXT;

ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_wallet_all ON public.user_wallet;
CREATE POLICY user_wallet_all ON public.user_wallet FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_ledger_all ON public.credit_ledger;
CREATE POLICY credit_ledger_all ON public.credit_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_subscriptions_all ON public.user_subscriptions;
CREATE POLICY user_subscriptions_all ON public.user_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS subscription_orders_all ON public.subscription_orders;
CREATE POLICY subscription_orders_all ON public.subscription_orders FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.user_wallet TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.credit_ledger TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.subscription_orders TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
