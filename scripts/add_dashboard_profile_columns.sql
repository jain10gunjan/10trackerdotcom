-- =============================================================================
-- STEP 2 of 3 — Profile column for multi-exam selection (run AFTER setup_platform_exams.sql).
-- Uses TEXT[] (slug list). Safe if column already exists as text[].
-- Run alone. Wait for success before step 3.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'target_exams'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN target_exams TEXT[] DEFAULT '{}'::text[];
  END IF;
END $$;

UPDATE public.user_profiles
SET target_exams = '{}'::text[]
WHERE target_exams IS NULL;

DO $$
BEGIN
  ALTER TABLE public.user_profiles
    ALTER COLUMN target_exams SET DEFAULT '{}'::text[];
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set target_exams default: %', SQLERRM;
END $$;
