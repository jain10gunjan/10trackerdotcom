-- Run once in Supabase SQL Editor if admin test creation fails with RLS (42501).
-- Required when SUPABASE_SERVICE_ROLE_KEY is missing or not the real service_role JWT.

-- mock_tests: allow writes (admin UI uses NextAuth + anon/server client)
DROP POLICY IF EXISTS mock_tests_admin_insert ON public.mock_tests;
CREATE POLICY mock_tests_admin_insert ON public.mock_tests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS mock_tests_admin_update ON public.mock_tests;
CREATE POLICY mock_tests_admin_update ON public.mock_tests
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS mock_tests_admin_delete ON public.mock_tests;
CREATE POLICY mock_tests_admin_delete ON public.mock_tests
  FOR DELETE USING (true);

-- mock_test_questions: allow writes when linking questions to a test
DROP POLICY IF EXISTS mock_test_questions_admin_insert ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_insert ON public.mock_test_questions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS mock_test_questions_admin_update ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_update ON public.mock_test_questions
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS mock_test_questions_admin_delete ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_delete ON public.mock_test_questions
  FOR DELETE USING (true);
