-- Fast subject/topic syllabus for exam hubs + dashboard.
-- Replaces paging every examtracker row in JS (which times out on large banks).

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

-- Hot path for syllabus / practice filters
CREATE INDEX IF NOT EXISTS idx_examtracker_category_subject_topic
  ON public.examtracker (category, subject, topic);
