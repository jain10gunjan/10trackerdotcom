-- Fast DISTINCT filters for admin MCQ extractor (run once in Supabase SQL Editor).
-- Re-run ONLY if this file changes (new version), NOT when examtracker row count grows.
-- DISTINCT always reads live data; new rows appear in filters automatically.

CREATE OR REPLACE FUNCTION public.examtracker_distinct_values(
  p_field text,
  p_category text DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_chapter text DEFAULT NULL
)
RETURNS TABLE(val text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT v
  FROM (
    SELECT CASE p_field
      WHEN 'category' THEN NULLIF(TRIM(category), '')
      WHEN 'subject' THEN NULLIF(TRIM(subject), '')
      WHEN 'chapter' THEN NULLIF(TRIM(chapter), '')
      WHEN 'topic' THEN NULLIF(TRIM(topic), '')
      ELSE NULL
    END AS v
    FROM examtracker e
    WHERE
      (p_field <> 'category' OR (category IS NOT NULL AND TRIM(category) <> ''))
      AND (p_field <> 'subject' OR (subject IS NOT NULL AND TRIM(subject) <> ''))
      AND (p_field <> 'chapter' OR (chapter IS NOT NULL AND TRIM(chapter) <> ''))
      AND (p_field <> 'topic' OR (topic IS NOT NULL AND TRIM(topic) <> ''))
      AND (p_category IS NULL OR p_category = '' OR UPPER(TRIM(e.category)) = UPPER(TRIM(p_category)))
      AND (p_subject IS NULL OR p_subject = '' OR TRIM(e.subject) = TRIM(p_subject))
      AND (p_chapter IS NULL OR p_chapter = '' OR TRIM(e.chapter) = TRIM(p_chapter))
  ) sub
  WHERE v IS NOT NULL
  ORDER BY v;
$$;

GRANT EXECUTE ON FUNCTION public.examtracker_distinct_values(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.examtracker_distinct_values(text, text, text, text) TO authenticated;
