-- OG Trackers: on-platform practice chapters + mock tests
-- Run in Supabase SQL Editor after setup_og_trackers.sql. Safe to re-run.

-- Widen resource type CHECK
ALTER TABLE public.og_resources
  DROP CONSTRAINT IF EXISTS og_resources_type_check;

ALTER TABLE public.og_resources
  ADD CONSTRAINT og_resources_type_check
  CHECK (
    type IN (
      'VIDEO',
      'LEETCODE_PROBLEM',
      'CODESTUDIO_PROBLEM',
      'HACKERRANK_PROBLEM',
      'PRACTICE_CHAPTER',
      'MOCK_TEST'
    )
  );

-- Module grouping (Day 1 / Aptitude / …)
ALTER TABLE public.og_resources
  ADD COLUMN IF NOT EXISTS section_label TEXT;

-- Structured refs for platform resources
ALTER TABLE public.og_resources
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_og_resources_type_path
  ON public.og_resources (path_id, type);

CREATE INDEX IF NOT EXISTS idx_og_resources_section
  ON public.og_resources (path_id, section_label);
