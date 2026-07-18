-- =============================================================================
-- user_progress: scalable uniqueness + indexes for high traffic (100k+ users)
--
-- Run in Supabase Dashboard → SQL Editor (once). Take a backup first.
--
-- What this does:
-- 1) Normalizes NULL area (Postgres UNIQUE treats NULLs as distinct — avoid dup rows)
-- 2) Deletes duplicate rows for the same (user_id, topic, area), keeps highest points
-- 3) Drops legacy UNIQUE(user_id, topic) if present (so the same topic can exist per area)
-- 4) Adds UNIQUE (user_id, topic, area) for correct PostgREST upserts
-- 5) Adds btree indexes for common read patterns
-- =============================================================================

BEGIN;

-- 0) Deterministic area for uniqueness (app should always send lowercase area)
UPDATE public.user_progress SET area = '' WHERE area IS NULL;

-- 1) Dedupe: one row per (user_id, topic, area)
DELETE FROM public.user_progress u
USING (
  SELECT ctid,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, topic, area
      ORDER BY COALESCE(points, 0) DESC, ctid DESC
    ) AS rn
  FROM public.user_progress
) d
WHERE u.ctid = d.ctid AND d.rn > 1;

-- 2) Drop old 2-column unique constraints that do NOT include area
DO $$
DECLARE
  r RECORD;
  col_count int;
  has_area boolean;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid, c.conkey
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'user_progress'
      AND n.nspname = 'public'
      AND c.contype = 'u'
  LOOP
    SELECT COUNT(*) INTO col_count FROM unnest(r.conkey) AS x(attnum);
    SELECT EXISTS (
      SELECT 1
      FROM unnest(r.conkey) AS x(attnum)
      JOIN pg_attribute a ON a.attrelid = r.conrelid AND a.attnum = x.attnum
      WHERE a.attname = 'area'
    ) INTO has_area;

    IF col_count = 2 AND NOT has_area THEN
      EXECUTE format('ALTER TABLE public.user_progress DROP CONSTRAINT %I', r.conname);
    END IF;
  END LOOP;
END $$;

-- 3) Unique target for: onConflict: "user_id,topic,area"
CREATE UNIQUE INDEX IF NOT EXISTS user_progress_user_topic_area_uidx
  ON public.user_progress (user_id, topic, area);

-- 4) Read paths: chapter/topic lists under one exam area, admin aggregates by user
CREATE INDEX IF NOT EXISTS idx_user_progress_user_area
  ON public.user_progress (user_id, area);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_area_topic
  ON public.user_progress (user_id, area, topic);

ANALYZE public.user_progress;

COMMIT;

-- If legacy rows still have area = '' but belong to MH-CET / UPSC Firebase flows only,
-- run a targeted UPDATE once (example — adjust predicates to your data):
-- UPDATE public.user_progress SET area = 'mhcet' WHERE area = '' AND ...;
-- UPDATE public.user_progress SET area = 'upsc' WHERE area = '' AND ...;

-- Optional: after verifying every client sends area, enforce NOT NULL:
-- ALTER TABLE public.user_progress ALTER COLUMN area SET DEFAULT '';
-- ALTER TABLE public.user_progress ALTER COLUMN area SET NOT NULL;
