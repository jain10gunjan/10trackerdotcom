-- roadmaps RLS for NextAuth admin API + server routes with NEXT_PUBLIC_SUPABASE_ANON_KEY
-- Run in Supabase SQL Editor after setup_roadmaps.sql.
-- Safe to re-run.
--
-- Security model (same as mock_tests / pricing admin):
--   • Students: read active roadmaps + days via Next.js API (/api/roadmaps/*)
--   • Purchases & progress: server routes after NextAuth session check
--   • Admin writes: ONLY through /api/admin/roadmaps/* after NextAuth admin check
--   • RLS allows anon SELECT/INSERT/UPDATE so server routes work with the anon key
--   • Do not expose admin credentials in the browser
--
-- Optional: if SUPABASE_SERVICE_ROLE_KEY is set (valid service_role JWT), server code
-- auto-upgrades and service_role bypasses RLS.

-- ── roadmaps ──────────────────────────────────────────────────────────────────
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmaps_read_active ON public.roadmaps;
CREATE POLICY roadmaps_read_active ON public.roadmaps
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS roadmaps_admin_select ON public.roadmaps;
CREATE POLICY roadmaps_admin_select ON public.roadmaps
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS roadmaps_admin_insert ON public.roadmaps;
CREATE POLICY roadmaps_admin_insert ON public.roadmaps
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS roadmaps_admin_update ON public.roadmaps;
CREATE POLICY roadmaps_admin_update ON public.roadmaps
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS roadmaps_admin_delete ON public.roadmaps;
CREATE POLICY roadmaps_admin_delete ON public.roadmaps
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── roadmap_days ─────────────────────────────────────────────────────────────
ALTER TABLE public.roadmap_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_days_read ON public.roadmap_days;
CREATE POLICY roadmap_days_read ON public.roadmap_days
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_days.roadmap_id
        AND r.is_active = true
    )
  );

DROP POLICY IF EXISTS roadmap_days_admin_select ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_select ON public.roadmap_days
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS roadmap_days_admin_insert ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_insert ON public.roadmap_days
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS roadmap_days_admin_update ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_update ON public.roadmap_days
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS roadmap_days_admin_delete ON public.roadmap_days;
CREATE POLICY roadmap_days_admin_delete ON public.roadmap_days
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── roadmap_purchases (server-only writes after payment verify) ───────────────
ALTER TABLE public.roadmap_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_purchases_server ON public.roadmap_purchases;
CREATE POLICY roadmap_purchases_server ON public.roadmap_purchases
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── roadmap_orders (server-only writes during checkout) ───────────────────────
ALTER TABLE public.roadmap_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_orders_server ON public.roadmap_orders;
CREATE POLICY roadmap_orders_server ON public.roadmap_orders
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── roadmap_user_progress (server-only writes after session check) ────────────
ALTER TABLE public.roadmap_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_user_progress_server ON public.roadmap_user_progress;
CREATE POLICY roadmap_user_progress_server ON public.roadmap_user_progress
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmaps TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_days TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_purchases TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_orders TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_user_progress TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
