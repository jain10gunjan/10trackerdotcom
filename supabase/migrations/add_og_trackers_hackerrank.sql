-- OG Trackers: HackerRank username + resource type
-- Run in Supabase SQL Editor after setup_og_trackers.sql

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;

-- Expand og_resources.type check to include HackerRank
ALTER TABLE public.og_resources
  DROP CONSTRAINT IF EXISTS og_resources_type_check;

ALTER TABLE public.og_resources
  ADD CONSTRAINT og_resources_type_check
  CHECK (type IN (
    'VIDEO',
    'LEETCODE_PROBLEM',
    'CODESTUDIO_PROBLEM',
    'HACKERRANK_PROBLEM'
  ));
