-- Mock of the Day pool (admin-managed, IST daily rotation per exam).
-- Run in Supabase SQL Editor after setup_mock_tests_supabase.sql.
-- Also ensures creation_mode exists (safe if already present).

ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS creation_mode TEXT;

CREATE TABLE IF NOT EXISTS public.mock_of_day_pool (
  id BIGSERIAL PRIMARY KEY,
  exam_category TEXT NOT NULL,
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_category, mock_test_id)
);

CREATE INDEX IF NOT EXISTS idx_motd_pool_exam_active
  ON public.mock_of_day_pool (exam_category, is_active, sort_order, created_at);

ALTER TABLE public.mock_of_day_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mock_of_day_pool_read ON public.mock_of_day_pool;
CREATE POLICY mock_of_day_pool_read ON public.mock_of_day_pool
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mock_of_day_pool_admin_write ON public.mock_of_day_pool;
CREATE POLICY mock_of_day_pool_admin_write ON public.mock_of_day_pool
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON public.mock_of_day_pool TO anon, authenticated;
GRANT ALL ON public.mock_of_day_pool TO service_role;

COMMENT ON TABLE public.mock_of_day_pool IS
  'Active pool of mocks rotated daily (IST) as Mock of the Day per exam_category slug';

COMMENT ON COLUMN public.mock_tests.creation_mode IS
  'How the mock was created: manual, auto, topic_auto, motd_pool, etc.';
