-- OG Trackers: study path settings (sequential unlock + weekly goal)
-- Run after add_og_trackers_platform_resources.sql. Safe to re-run.

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS sequential_unlock BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS weekly_goal INTEGER NOT NULL DEFAULT 3
  CHECK (weekly_goal >= 1 AND weekly_goal <= 50);

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS unlock_threshold INTEGER NOT NULL DEFAULT 70
  CHECK (unlock_threshold >= 1 AND unlock_threshold <= 100);

-- Enable study flow defaults on Discrete Mathematics path if present
UPDATE public.og_paths
SET
  sequential_unlock = true,
  weekly_goal = 3,
  unlock_threshold = 70,
  updated_at = NOW()
WHERE slug = 'gate-cse-discrete-mathematics';
