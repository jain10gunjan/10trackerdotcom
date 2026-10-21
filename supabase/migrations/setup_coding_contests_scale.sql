-- =============================================================================
-- Coding contests — scale + reliability upgrades
-- Safe to re-run. Run after setup_coding_contests.sql
-- =============================================================================

-- Priority + faster claim path
ALTER TABLE public.coding_judge_jobs
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100;

CREATE INDEX IF NOT EXISTS idx_coding_judge_jobs_claim
  ON public.coding_judge_jobs (status, priority ASC, available_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_coding_submissions_inflight
  ON public.coding_submissions (user_id, status, created_at DESC)
  WHERE status IN ('queued', 'judging');

CREATE INDEX IF NOT EXISTS idx_coding_submissions_cooldown
  ON public.coding_submissions (problem_id, user_id, is_run_only, created_at DESC);

-- Lightweight API rate-limit counters (DB-backed; no Redis)
CREATE TABLE IF NOT EXISTS public.coding_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coding_rate_limits ENABLE ROW LEVEL SECURITY;

-- Claim up to N jobs (multi-worker safe via SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.claim_coding_judge_jobs(
  p_worker_id TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS SETOF public.coding_judge_jobs
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_limit, 5), 25));
BEGIN
  RETURN QUERY
  WITH cte AS (
    SELECT j.id
    FROM public.coding_judge_jobs j
    WHERE j.status = 'pending'
      AND j.available_at <= NOW()
    ORDER BY j.priority ASC, j.available_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT v_limit
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

-- Re-queue stale processing jobs (crashed workers)
CREATE OR REPLACE FUNCTION public.requeue_stale_coding_judge_jobs(
  p_stale_seconds INTEGER DEFAULT 120
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH upd AS (
    UPDATE public.coding_judge_jobs
    SET
      status = 'pending',
      locked_at = NULL,
      locked_by = NULL,
      available_at = NOW(),
      updated_at = NOW(),
      last_error = COALESCE(last_error, '') || ' [requeued: stale lock]'
    WHERE status = 'processing'
      AND locked_at IS NOT NULL
      AND locked_at < NOW() - make_interval(secs => GREATEST(30, COALESCE(p_stale_seconds, 120)))
      AND attempts < max_attempts
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_count FROM upd;
  RETURN v_count;
END;
$$;

-- Atomic rate-limit check (fixed window)
CREATE OR REPLACE FUNCTION public.hit_coding_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_row public.coding_rate_limits%ROWTYPE;
  v_window INTEGER := GREATEST(1, COALESCE(p_window_seconds, 60));
  v_limit INTEGER := GREATEST(1, COALESCE(p_limit, 60));
BEGIN
  INSERT INTO public.coding_rate_limits (bucket_key, window_started_at, hit_count, updated_at)
  VALUES (p_key, v_now, 0, v_now)
  ON CONFLICT (bucket_key) DO NOTHING;

  SELECT * INTO v_row
  FROM public.coding_rate_limits
  WHERE bucket_key = p_key
  FOR UPDATE;

  IF v_row.window_started_at + make_interval(secs => v_window) <= v_now THEN
    UPDATE public.coding_rate_limits
    SET window_started_at = v_now, hit_count = 1, updated_at = v_now
    WHERE bucket_key = p_key;
    allowed := true;
    remaining := v_limit - 1;
    reset_at := v_now + make_interval(secs => v_window);
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_row.hit_count >= v_limit THEN
    allowed := false;
    remaining := 0;
    reset_at := v_row.window_started_at + make_interval(secs => v_window);
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.coding_rate_limits
  SET hit_count = hit_count + 1, updated_at = v_now
  WHERE bucket_key = p_key;

  allowed := true;
  remaining := v_limit - (v_row.hit_count + 1);
  reset_at := v_row.window_started_at + make_interval(secs => v_window);
  RETURN NEXT;
END;
$$;

NOTIFY pgrst, 'reload schema';
