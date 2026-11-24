-- Draft / publish lifecycle for examtracker questions.
-- Existing rows stay live (published). New AI imports default to draft in app code.

ALTER TABLE public.examtracker
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.examtracker
SET status = 'published'
WHERE status IS NULL OR TRIM(status) = '';

ALTER TABLE public.examtracker
  ALTER COLUMN status SET DEFAULT 'published';

ALTER TABLE public.examtracker
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'examtracker_status_check'
      AND conrelid = 'public.examtracker'::regclass
  ) THEN
    ALTER TABLE public.examtracker
      ADD CONSTRAINT examtracker_status_check
      CHECK (status IN ('draft', 'published', 'rejected'));
  END IF;
END $$;

ALTER TABLE public.examtracker
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.examtracker
  ADD COLUMN IF NOT EXISTS published_by text;

UPDATE public.examtracker
SET published_at = COALESCE(published_at, now())
WHERE status = 'published'
  AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_examtracker_category_subject_chapter_status
  ON public.examtracker (category, subject, chapter, status);

CREATE INDEX IF NOT EXISTS idx_examtracker_status
  ON public.examtracker (status);

-- Syllabus counts: published only
CREATE OR REPLACE FUNCTION public.examtracker_subject_syllabus(p_category text)
RETURNS TABLE(
  subject text,
  topic text,
  chapter text,
  question_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NULLIF(TRIM(e.subject), '') AS subject,
    NULLIF(TRIM(e.topic), '') AS topic,
    NULLIF(TRIM(e.chapter), '') AS chapter,
    COUNT(*)::bigint AS question_count
  FROM public.examtracker e
  WHERE
    p_category IS NOT NULL
    AND TRIM(p_category) <> ''
    AND UPPER(TRIM(e.category)) = UPPER(TRIM(p_category))
    AND COALESCE(e.status, 'published') = 'published'
    AND e.subject IS NOT NULL
    AND TRIM(e.subject) <> ''
    AND e.topic IS NOT NULL
    AND TRIM(e.topic) <> ''
  GROUP BY 1, 2, 3
  ORDER BY 1, 2;
$$;

GRANT EXECUTE ON FUNCTION public.examtracker_subject_syllabus(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.examtracker_subject_syllabus(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.examtracker_subject_syllabus(text) TO anon;

-- Catalog counts: published only
CREATE OR REPLACE FUNCTION public.examtracker_counts_by_slug()
RETURNS TABLE (slug text, question_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(replace(trim(category), '_', '-')) AS slug,
    COUNT(*)::bigint AS question_count
  FROM public.examtracker
  WHERE category IS NOT NULL
    AND trim(category) <> ''
    AND COALESCE(status, 'published') = 'published'
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

COMMENT ON FUNCTION public.examtracker_counts_by_slug() IS
  'Per-exam published question counts keyed by normalized slug (lowercase, underscores → hyphens).';

GRANT EXECUTE ON FUNCTION public.examtracker_counts_by_slug() TO anon;
GRANT EXECUTE ON FUNCTION public.examtracker_counts_by_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.examtracker_counts_by_slug() TO service_role;
