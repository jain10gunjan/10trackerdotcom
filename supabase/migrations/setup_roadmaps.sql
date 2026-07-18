-- Roadmaps: admin-managed study plans with one-time Razorpay purchase + free preview days
-- Run in Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_inr INTEGER NOT NULL CHECK (price_inr > 0),
  free_preview_days INTEGER NOT NULL DEFAULT 0 CHECK (free_preview_days >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_required TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (roadmap_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_days_roadmap ON public.roadmap_days(roadmap_id, day_number);

CREATE TABLE IF NOT EXISTS public.roadmap_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  terms_version TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, roadmap_id)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_purchases_email ON public.roadmap_purchases(user_email);

CREATE TABLE IF NOT EXISTS public.roadmap_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  terms_version TEXT NOT NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_user_progress (
  user_id TEXT NOT NULL,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_completed' CHECK (status IN ('not_completed', 'completed')),
  user_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, roadmap_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user ON public.roadmap_user_progress(user_id, roadmap_id);

-- ── RLS (anon key + Next.js server routes; same model as mock_tests) ─────────
-- If you already ran an older version of this script (RLS with no policies),
-- run scripts/fix_roadmaps_rls_secure.sql instead of re-running this block.

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmaps_read_active ON public.roadmaps;
CREATE POLICY roadmaps_read_active ON public.roadmaps
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS roadmaps_admin_select ON public.roadmaps;
CREATE POLICY roadmaps_admin_select ON public.roadmaps
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS roadmaps_admin_insert ON public.roadmaps;
CREATE POLICY roadmaps_admin_insert ON public.roadmaps
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS roadmaps_admin_update ON public.roadmaps;
CREATE POLICY roadmaps_admin_update ON public.roadmaps
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS roadmaps_admin_delete ON public.roadmaps;
CREATE POLICY roadmaps_admin_delete ON public.roadmaps
  FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.roadmap_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_days_read ON public.roadmap_days;
CREATE POLICY roadmap_days_read ON public.roadmap_days
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_days.roadmap_id AND r.is_active = true
    )
  );

DROP POLICY IF EXISTS roadmap_days_admin_select ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_select ON public.roadmap_days
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS roadmap_days_admin_insert ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_insert ON public.roadmap_days
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS roadmap_days_admin_update ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_update ON public.roadmap_days
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS roadmap_days_admin_delete ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_delete ON public.roadmap_days
  FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.roadmap_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_purchases_server ON public.roadmap_purchases;
CREATE POLICY roadmap_purchases_server ON public.roadmap_purchases
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.roadmap_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_orders_server ON public.roadmap_orders;
CREATE POLICY roadmap_orders_server ON public.roadmap_orders
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.roadmap_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_user_progress_server ON public.roadmap_user_progress;
CREATE POLICY roadmap_user_progress_server ON public.roadmap_user_progress
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmaps TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_days TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_purchases TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_orders TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_user_progress TO anon, authenticated, service_role;

-- Optional exam tag for catalog filters (see scripts/add_roadmap_exam_slug.sql)
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS exam_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_roadmaps_exam_slug ON public.roadmaps(exam_slug);

NOTIFY pgrst, 'reload schema';
