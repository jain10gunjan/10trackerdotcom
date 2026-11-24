-- 10Tracker audit lockdown — run in Supabase SQL Editor (safe to re-run).
-- Order: run this AFTER setup_og_ai_playlist.sql and setup_credits_subscriptions.sql
-- if those have never been applied on this project.

-- ---------------------------------------------------------------------------
-- 1) Private AI playlists: allow the same YouTube video on many paths
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_og_resources_youtube_video_id;
CREATE INDEX IF NOT EXISTS idx_og_resources_youtube
  ON public.og_resources (youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) Credits / subscriptions: service role only (revoke public anon writes)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.user_wallet FROM anon, authenticated;
REVOKE ALL ON public.credit_ledger FROM anon, authenticated;
REVOKE ALL ON public.user_subscriptions FROM anon, authenticated;
REVOKE ALL ON public.subscription_orders FROM anon, authenticated;

GRANT ALL ON public.user_wallet TO service_role;
GRANT ALL ON public.credit_ledger TO service_role;
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT ALL ON public.subscription_orders TO service_role;

DROP POLICY IF EXISTS user_wallet_all ON public.user_wallet;
CREATE POLICY user_wallet_service ON public.user_wallet
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_ledger_all ON public.credit_ledger;
CREATE POLICY credit_ledger_service ON public.credit_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_subscriptions_all ON public.user_subscriptions;
CREATE POLICY user_subscriptions_service ON public.user_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS subscription_orders_all ON public.subscription_orders;
CREATE POLICY subscription_orders_service ON public.subscription_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3) Admin grant columns (no-op if already present)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'checkout';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS granted_by TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'checkout';
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS granted_by TEXT;
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS list_amount_paise INTEGER;
ALTER TABLE public.subscription_orders ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- ---------------------------------------------------------------------------
-- 4) Free-credits kill switch for later admin control
--    App reads this: free_credits_enabled = false → no signup bonus, paywall requires plan
--    Skip this block if credit_pricing_settings does not exist yet
--    (run setup_pricing_admin.sql first, or rely on FREE_CREDITS_ENABLED=false in code).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_pricing_settings'
  ) THEN
    ALTER TABLE public.credit_pricing_settings
      ADD COLUMN IF NOT EXISTS free_credits_enabled BOOLEAN NOT NULL DEFAULT false;
    UPDATE public.credit_pricing_settings
    SET free_credits_enabled = false, signup_bonus_credits = 0
    WHERE id = 1;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
