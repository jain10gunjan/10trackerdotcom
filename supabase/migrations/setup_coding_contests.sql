-- =============================================================================
-- Vendor coding contests (Judge0)
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS / additive).
-- Does NOT touch college "contests" / practice-test MCQ tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Languages (synced from Judge0 /languages)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  judge0_language_id INTEGER NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_languages_enabled
  ON public.coding_languages (enabled);

-- ---------------------------------------------------------------------------
-- Contests (scoped to vendor)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  scoring_mode TEXT NOT NULL DEFAULT 'icpc'
    CHECK (scoring_mode IN ('icpc', 'points')),
  stop_on_first_fail BOOLEAN NOT NULL DEFAULT true,
  ignore_ce_penalty BOOLEAN NOT NULL DEFAULT true,
  wrong_penalty_minutes INTEGER NOT NULL DEFAULT 20,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_contests_vendor_status
  ON public.coding_contests (vendor_id, status);

-- ---------------------------------------------------------------------------
-- Problems
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.coding_contests (id) ON DELETE CASCADE,
  slug TEXT,
  title TEXT NOT NULL,
  statement TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 100,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cpu_time_limit REAL NOT NULL DEFAULT 2,
  wall_time_limit REAL NOT NULL DEFAULT 5,
  memory_limit_kb INTEGER NOT NULL DEFAULT 128000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_problems_contest
  ON public.coding_problems (contest_id, sort_order);

-- ---------------------------------------------------------------------------
-- Test cases (hidden cases never sent to clients)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.coding_problems (id) ON DELETE CASCADE,
  input TEXT NOT NULL DEFAULT '',
  expected_output TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_test_cases_problem
  ON public.coding_test_cases (problem_id, sort_order);

-- ---------------------------------------------------------------------------
-- Participants (must also be active vendor_members — enforced in app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.coding_contests (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_email TEXT,
  display_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coding_participants_unique UNIQUE (contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coding_participants_user
  ON public.coding_participants (user_id);

-- ---------------------------------------------------------------------------
-- Submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.coding_contests (id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.coding_problems (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  language_id UUID NOT NULL REFERENCES public.coding_languages (id),
  source_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'judging', 'done', 'error')),
  verdict TEXT,
  score REAL NOT NULL DEFAULT 0,
  time_ms INTEGER,
  memory_kb INTEGER,
  is_run_only BOOLEAN NOT NULL DEFAULT false,
  custom_stdin TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coding_submissions_contest_user
  ON public.coding_submissions (contest_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_problem_user
  ON public.coding_submissions (problem_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_status
  ON public.coding_submissions (status)
  WHERE status IN ('queued', 'judging');

-- ---------------------------------------------------------------------------
-- Per-test-case results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_submission_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.coding_submissions (id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES public.coding_test_cases (id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT true,
  status TEXT,
  verdict TEXT,
  time_ms REAL,
  memory_kb INTEGER,
  stdout TEXT,
  stderr TEXT,
  judge0_token TEXT,
  judge0_status_id INTEGER,
  finished BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coding_submission_results_token_unique UNIQUE (judge0_token)
);

CREATE INDEX IF NOT EXISTS idx_coding_submission_results_submission
  ON public.coding_submission_results (submission_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_coding_submission_results_unfinished
  ON public.coding_submission_results (finished)
  WHERE finished = false;

-- ---------------------------------------------------------------------------
-- Leaderboard (materialized per participant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.coding_contests (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT,
  user_email TEXT,
  solved_count INTEGER NOT NULL DEFAULT 0,
  penalty_minutes INTEGER NOT NULL DEFAULT 0,
  score REAL NOT NULL DEFAULT 0,
  last_accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coding_leaderboard_unique UNIQUE (contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coding_leaderboard_contest
  ON public.coding_leaderboard_entries (contest_id, solved_count DESC, penalty_minutes ASC);

-- ---------------------------------------------------------------------------
-- DB-backed job queue (no Redis for v1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_judge_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL
    CHECK (job_type IN ('judge_submission', 'poll_submission', 'run_custom')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 8,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_judge_jobs_poll
  ON public.coding_judge_jobs (status, available_at)
  WHERE status = 'pending';

-- Claim next job (SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.claim_coding_judge_job(p_worker_id TEXT)
RETURNS SETOF public.coding_judge_jobs
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH cte AS (
    SELECT j.id
    FROM public.coding_judge_jobs j
    WHERE j.status = 'pending'
      AND j.available_at <= NOW()
    ORDER BY j.available_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.coding_judge_jobs j
  SET
    status = 'processing',
    locked_at = NOW(),
    locked_by = p_worker_id,
    attempts = j.attempts + 1,
    updated_at = NOW()
  FROM cte
  WHERE j.id = cte.id
  RETURNING j.*;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS: deny direct anon/authenticated access; server uses service_role.
-- ---------------------------------------------------------------------------
ALTER TABLE public.coding_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submission_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_judge_jobs ENABLE ROW LEVEL SECURITY;

-- No permissive policies for anon/authenticated — API routes use service_role.

NOTIFY pgrst, 'reload schema';
