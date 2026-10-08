-- OG Trackers: learning paths (YouTube + LeetCode + CodeStudio)
-- Run in Supabase SQL Editor. Safe to re-run.
-- NextAuth identity: progress keyed by user_email (not auth.users UUID).

-- ── Profile extensions ───────────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS leetcode_username TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS codestudio_username TEXT;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_premium
  ON public.user_profiles (is_premium)
  WHERE is_premium = true;

-- ── Paths ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.og_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  icon TEXT NOT NULL DEFAULT 'Map',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_og_paths_active_sort
  ON public.og_paths (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_og_paths_category
  ON public.og_paths (category);
CREATE INDEX IF NOT EXISTS idx_og_paths_tags
  ON public.og_paths USING GIN (tags);

-- ── Resources ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.og_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES public.og_paths(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('VIDEO', 'LEETCODE_PROBLEM', 'CODESTUDIO_PROBLEM', 'HACKERRANK_PROBLEM')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  youtube_video_id TEXT,
  duration_seconds INTEGER,
  external_slug TEXT,
  difficulty TEXT,
  external_url TEXT,
  is_premium BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_og_resources_path
  ON public.og_resources (path_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_og_resources_slug_type
  ON public.og_resources (type, external_slug)
  WHERE external_slug IS NOT NULL;

-- ── Progress (email-keyed for NextAuth) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.og_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.og_resources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  percent_watched INTEGER NOT NULL DEFAULT 0
    CHECK (percent_watched >= 0 AND percent_watched <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_og_progress_email
  ON public.og_progress (user_email);
CREATE INDEX IF NOT EXISTS idx_og_progress_resource
  ON public.og_progress (resource_id);

-- ── Premium purchase orders (global OG Trackers unlock) ────────────────────
CREATE TABLE IF NOT EXISTS public.og_premium_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_og_premium_orders_email
  ON public.og_premium_orders (user_email);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Catalog readable by anon; all writes via service role after NextAuth.

ALTER TABLE public.og_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.og_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.og_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.og_premium_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS og_paths_public_read ON public.og_paths;
CREATE POLICY og_paths_public_read ON public.og_paths
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS og_paths_service_all ON public.og_paths;
CREATE POLICY og_paths_service_all ON public.og_paths
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS og_resources_public_read ON public.og_resources;
CREATE POLICY og_resources_public_read ON public.og_resources
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.og_paths p
      WHERE p.id = path_id AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS og_resources_service_all ON public.og_resources;
CREATE POLICY og_resources_service_all ON public.og_resources
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Progress: no anon DML/SELECT (server uses service role)
DROP POLICY IF EXISTS og_progress_deny_anon ON public.og_progress;
CREATE POLICY og_progress_deny_anon ON public.og_progress
  FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS og_progress_service_all ON public.og_progress;
CREATE POLICY og_progress_service_all ON public.og_progress
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS og_premium_orders_deny_anon ON public.og_premium_orders;
CREATE POLICY og_premium_orders_deny_anon ON public.og_premium_orders
  FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS og_premium_orders_service_all ON public.og_premium_orders;
CREATE POLICY og_premium_orders_service_all ON public.og_premium_orders
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.og_paths TO anon, authenticated;
GRANT SELECT ON public.og_resources TO anon, authenticated;
GRANT ALL ON public.og_paths TO service_role;
GRANT ALL ON public.og_resources TO service_role;
GRANT ALL ON public.og_progress TO service_role;
GRANT ALL ON public.og_premium_orders TO service_role;
