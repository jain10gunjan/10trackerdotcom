-- Private AI playlist trackers.
-- Run in the Supabase SQL editor. Safe to re-run.
-- Catalog paths stay owner_email NULL and remain public.
-- Personal paths are readable only through the service role.

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'catalog';

ALTER TABLE public.og_paths
  ADD COLUMN IF NOT EXISTS playlist_id TEXT;

CREATE INDEX IF NOT EXISTS idx_og_paths_owner
  ON public.og_paths (owner_email, created_at DESC)
  WHERE owner_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_og_resources_youtube
  ON public.og_resources (youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

-- Hide personal paths from the public catalog policies.
DROP POLICY IF EXISTS og_paths_public_read ON public.og_paths;
CREATE POLICY og_paths_public_read ON public.og_paths
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND owner_email IS NULL);

DROP POLICY IF EXISTS og_resources_public_read ON public.og_resources;
CREATE POLICY og_resources_public_read ON public.og_resources
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.og_paths p
      WHERE p.id = path_id
        AND p.is_active = true
        AND p.owner_email IS NULL
    )
  );

-- Playlist snapshot shared across users. Keyed by playlist id + video-order hash.
CREATE TABLE IF NOT EXISTS public.og_playlist_snapshots (
  playlist_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_count INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, content_hash)
);

-- Topic decision shared across users. One row per video per exam family.
CREATE TABLE IF NOT EXISTS public.og_video_topic_cache (
  video_id TEXT NOT NULL,
  exam_family TEXT NOT NULL DEFAULT 'gate-cse',
  chapter_slug TEXT,
  source TEXT NOT NULL DEFAULT 'lexicon',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (video_id, exam_family)
);

CREATE TABLE IF NOT EXISTS public.og_ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  playlist_url TEXT NOT NULL DEFAULT '',
  content_hash TEXT,
  exam_family TEXT NOT NULL DEFAULT 'gate-cse',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'aligning', 'writing', 'completed', 'rejected', 'failed')),
  error_code TEXT,
  error_message TEXT,
  path_id UUID REFERENCES public.og_paths(id) ON DELETE SET NULL,
  videos_total INTEGER NOT NULL DEFAULT 0,
  videos_done INTEGER NOT NULL DEFAULT 0,
  quota_month TEXT NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT false,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.og_ai_jobs
  ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.og_ai_jobs
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.og_ai_jobs
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_og_ai_jobs_user_month
  ON public.og_ai_jobs (user_email, quota_month)
  WHERE consumed = true;

CREATE INDEX IF NOT EXISTS idx_og_ai_jobs_user_status
  ON public.og_ai_jobs (user_email, status, created_at DESC);

ALTER TABLE public.og_playlist_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.og_video_topic_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.og_ai_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS og_playlist_snapshots_service_all ON public.og_playlist_snapshots;
CREATE POLICY og_playlist_snapshots_service_all ON public.og_playlist_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS og_video_topic_cache_service_all ON public.og_video_topic_cache;
CREATE POLICY og_video_topic_cache_service_all ON public.og_video_topic_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS og_ai_jobs_service_all ON public.og_ai_jobs;
CREATE POLICY og_ai_jobs_service_all ON public.og_ai_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.og_playlist_snapshots TO service_role;
GRANT ALL ON public.og_video_topic_cache TO service_role;
GRANT ALL ON public.og_ai_jobs TO service_role;
