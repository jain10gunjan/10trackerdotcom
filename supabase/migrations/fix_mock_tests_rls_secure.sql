-- mock_tests RLS for NextAuth admin API + NEXT_PUBLIC_SUPABASE_ANON_KEY (server-side)
-- Run in Supabase SQL Editor.
--
-- Security model:
--   • Browser students: SELECT active tests only (catalog / attempts)
--   • Admin writes: ONLY through your Next.js API (/api/mock-test/admin/*)
--     which verifies NextAuth admin, then calls Supabase with the anon key
--   • RLS policies below allow anon SELECT/INSERT/UPDATE so deactivate (is_active=false)
--     and admin list (incl. inactive) work. Do not expose admin API keys in the client.
--
-- Optional: if you later add SUPABASE_SERVICE_ROLE_KEY, admin API auto-upgrades and
-- service_role bypasses RLS (you may tighten anon write policies then).

-- ── mock_tests ────────────────────────────────────────────────────────────────
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

-- Student catalog: active tests only
DROP POLICY IF EXISTS mock_tests_read_active ON public.mock_tests;
CREATE POLICY mock_tests_read_active ON public.mock_tests
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin list / edit / soft-delete RETURNING (includes inactive rows)
DROP POLICY IF EXISTS mock_tests_admin_select ON public.mock_tests;
CREATE POLICY mock_tests_admin_select ON public.mock_tests
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS mock_tests_admin_insert ON public.mock_tests;
CREATE POLICY mock_tests_admin_insert ON public.mock_tests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS mock_tests_admin_update ON public.mock_tests;
CREATE POLICY mock_tests_admin_update ON public.mock_tests
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Hard delete not used (soft delete only); keep for cleanup scripts if needed
DROP POLICY IF EXISTS mock_tests_admin_delete ON public.mock_tests;
CREATE POLICY mock_tests_admin_delete ON public.mock_tests
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── mock_test_questions ───────────────────────────────────────────────────────
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mock_test_questions_read ON public.mock_test_questions;
CREATE POLICY mock_test_questions_read ON public.mock_test_questions
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mock_tests mt
      WHERE mt.id = mock_test_questions.test_id
        AND mt.is_active = true
    )
  );

DROP POLICY IF EXISTS mock_test_questions_admin_select ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_select ON public.mock_test_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS mock_test_questions_admin_insert ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_insert ON public.mock_test_questions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS mock_test_questions_admin_update ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_update ON public.mock_test_questions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS mock_test_questions_admin_delete ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_delete ON public.mock_test_questions
  FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT ALL ON public.mock_tests TO anon, authenticated;
GRANT ALL ON public.mock_test_questions TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
