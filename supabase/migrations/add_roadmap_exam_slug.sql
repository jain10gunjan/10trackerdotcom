-- Optional: tag roadmaps with a platform exam slug for catalog filtering.
-- Safe to re-run.

ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS exam_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_roadmaps_exam_slug ON public.roadmaps(exam_slug);

COMMENT ON COLUMN public.roadmaps.exam_slug IS
  'Optional platform_exams.slug for catalog exam-category filters';
