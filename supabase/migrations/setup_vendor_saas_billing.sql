-- Vendor SaaS billing (plans + orders). Safe to re-run.
-- Reuses Razorpay patterns from B2C subscriptions; no custom domains yet.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (plan_status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coding_contests_addon BOOLEAN NOT NULL DEFAULT false;

UPDATE public.vendors
SET trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '14 days')
WHERE plan_id = 'trial' AND trial_ends_at IS NULL;

CREATE TABLE IF NOT EXISTS public.vendor_subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_subscription_orders_vendor
  ON public.vendor_subscription_orders (vendor_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_subscription_orders_razorpay
  ON public.vendor_subscription_orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

ALTER TABLE public.vendor_subscription_orders ENABLE ROW LEVEL SECURITY;
-- Service-role only (same pattern as other vendor tables).
