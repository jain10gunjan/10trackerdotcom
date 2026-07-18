-- Run this in the Supabase SQL editor when ready.
-- Adds canonical chapter_slug for reliable chapter practice lookups.
-- The app already falls back to chapter name candidates if this column is missing.

-- 1) Column
ALTER TABLE public.examtracker
  ADD COLUMN IF NOT EXISTS chapter_slug text;

-- 2) Backfill from chapter (spaces/underscores → hyphens, lowercased)
UPDATE public.examtracker
SET chapter_slug = lower(
  regexp_replace(
    regexp_replace(trim(coalesce(chapter, '')), '[_\s]+', '-', 'g'),
    '[^a-z0-9-]+',
    '',
    'g'
  )
)
WHERE chapter_slug IS NULL
  AND chapter IS NOT NULL
  AND trim(chapter) <> '';

-- 3) Index for lookups
CREATE INDEX IF NOT EXISTS examtracker_category_chapter_slug_idx
  ON public.examtracker (category, chapter_slug);

CREATE INDEX IF NOT EXISTS examtracker_category_chapter_slug_diff_idx
  ON public.examtracker (category, chapter_slug, difficulty);

-- Optional uniqueness if each slug is unique per category (commented — enable only if true for your data):
-- CREATE UNIQUE INDEX IF NOT EXISTS examtracker_category_chapter_slug_uidx
--   ON public.examtracker (category, chapter_slug)
--   WHERE chapter_slug IS NOT NULL AND chapter_slug <> '';
