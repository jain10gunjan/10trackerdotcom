-- =============================================================================
-- Mock test system (current app) — run in Supabase SQL Editor if tables are missing
-- Safe to run: uses IF NOT EXISTS. Does NOT drop gate_cse_* tables.
-- =============================================================================

-- 1) mock_tests
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 180,
  total_questions INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT DEFAULT 'mixed',
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  creation_mode TEXT,
  include_general_aptitude BOOLEAN DEFAULT true,
  include_engineering_math BOOLEAN DEFAULT true,
  custom_weightage BOOLEAN DEFAULT false,
  weightage_config JSONB DEFAULT '[]'::jsonb,
  question_distribution JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_category ON public.mock_tests (category);
CREATE INDEX IF NOT EXISTS idx_mock_tests_is_active ON public.mock_tests (is_active);

-- 2) mock_test_questions (pinned question set per test)
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.mock_tests (id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  subject TEXT,
  topic TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mock_test_questions_test_id ON public.mock_test_questions (test_id);

-- 3) user_test_attempts
CREATE TABLE IF NOT EXISTS public.user_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.mock_tests (id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  total_questions INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  duration_taken INTEGER,
  status TEXT DEFAULT 'in_progress',
  is_completed BOOLEAN DEFAULT false,
  examcategory TEXT,
  attempted_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  unanswered INTEGER DEFAULT 0,
  score NUMERIC,
  percentage NUMERIC,
  completion_type TEXT,
  answers JSONB DEFAULT '[]'::jsonb,
  answer2 JSONB DEFAULT '{}'::jsonb,
  all_questions JSONB DEFAULT '[]'::jsonb,
  quick_stats JSONB DEFAULT '{}'::jsonb,
  final_stats JSONB DEFAULT '{}'::jsonb,
  subject_performance JSONB DEFAULT '{}'::jsonb,
  avg_time_per_question INTEGER,
  total_interactions INTEGER,
  completion_rate NUMERIC,
  marked_for_review_count INTEGER DEFAULT 0,
  navigation_pattern JSONB DEFAULT '{}'::jsonb,
  time_spent INTEGER,
  last_updated TIMESTAMPTZ,
  current_question_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_test_attempts_user_email ON public.user_test_attempts (user_email);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_test_id ON public.user_test_attempts (test_id);
CREATE INDEX IF NOT EXISTS idx_user_test_attempts_completed ON public.user_test_attempts (is_completed);

-- 4) user_question_responses (per-question rows on submit)
CREATE TABLE IF NOT EXISTS public.user_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.user_test_attempts (id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_order INTEGER,
  user_answer TEXT,
  correct_answer TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN DEFAULT false,
  time_taken INTEGER DEFAULT 0,
  marked_for_review BOOLEAN DEFAULT false,
  subject TEXT,
  topic TEXT,
  difficulty TEXT,
  response_type TEXT,
  is_unanswered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_question_responses_attempt ON public.user_question_responses (attempt_id);

-- =============================================================================
-- RLS (Row Level Security)
-- The app uses NextAuth + anon key in the browser (not Supabase Auth).
-- Adjust these policies to match how you secure Supabase today.
-- =============================================================================

ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_responses ENABLE ROW LEVEL SECURITY;

-- Public read for active tests (student catalog)
DROP POLICY IF EXISTS mock_tests_read_active ON public.mock_tests;
CREATE POLICY mock_tests_read_active ON public.mock_tests
  FOR SELECT USING (is_active = true);

-- Questions for tests: read for anyone (tighten in production if needed)
DROP POLICY IF EXISTS mock_test_questions_read ON public.mock_test_questions;
CREATE POLICY mock_test_questions_read ON public.mock_test_questions
  FOR SELECT USING (true);

-- Attempts: allow insert/update/select for anon (browser client)
-- Tighten later e.g. with service role only for writes + Edge Functions
DROP POLICY IF EXISTS user_test_attempts_all_anon ON public.user_test_attempts;
CREATE POLICY user_test_attempts_all_anon ON public.user_test_attempts
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_question_responses_all_anon ON public.user_question_responses;
CREATE POLICY user_question_responses_all_anon ON public.user_question_responses
  FOR ALL USING (true) WITH CHECK (true);

-- Admin writes: prefer SUPABASE_SERVICE_ROLE_KEY (service_role JWT) on the server.
-- If you use NextAuth + anon key only, run scripts/fix_mock_tests_rls_policies.sql for INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS mock_tests_admin_insert ON public.mock_tests;
CREATE POLICY mock_tests_admin_insert ON public.mock_tests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS mock_tests_admin_update ON public.mock_tests;
CREATE POLICY mock_tests_admin_update ON public.mock_tests FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS mock_tests_admin_delete ON public.mock_tests;
CREATE POLICY mock_tests_admin_delete ON public.mock_tests FOR DELETE USING (true);

DROP POLICY IF EXISTS mock_test_questions_admin_insert ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_insert ON public.mock_test_questions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS mock_test_questions_admin_update ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_update ON public.mock_test_questions FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS mock_test_questions_admin_delete ON public.mock_test_questions;
CREATE POLICY mock_test_questions_admin_delete ON public.mock_test_questions FOR DELETE USING (true);

GRANT ALL ON public.mock_tests TO anon, authenticated;
GRANT ALL ON public.mock_test_questions TO anon, authenticated;
GRANT ALL ON public.user_test_attempts TO anon, authenticated;
GRANT ALL ON public.user_question_responses TO anon, authenticated;
