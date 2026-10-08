-- Add category, tags, and icon to OG Trackers (flat multi-tracker catalog).
-- Safe to re-run after setup_og_trackers.sql.

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'Map';

CREATE INDEX IF NOT EXISTS idx_og_paths_category
  ON public.og_paths (category);

CREATE INDEX IF NOT EXISTS idx_og_paths_tags
  ON public.og_paths USING GIN (tags);

COMMENT ON COLUMN public.og_paths.category IS 'Primary category label e.g. Java, Web Dev, DSA';
COMMENT ON COLUMN public.og_paths.tags IS 'Optional filter tags e.g. beginner, interview';
COMMENT ON COLUMN public.og_paths.icon IS 'Lucide icon name shown on catalog cards';
