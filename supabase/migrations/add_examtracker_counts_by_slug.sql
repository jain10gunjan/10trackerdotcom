-- Aggregate question counts by normalized exam slug for homepage / catalog metrics.
-- Safe to re-run. Maps GATE-CSE / GATE_CSE / gate-cse → gate-cse.

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
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

COMMENT ON FUNCTION public.examtracker_counts_by_slug() IS
  'Per-exam question counts keyed by normalized slug (lowercase, underscores → hyphens).';

GRANT EXECUTE ON FUNCTION public.examtracker_counts_by_slug() TO anon;
GRANT EXECUTE ON FUNCTION public.examtracker_counts_by_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.examtracker_counts_by_slug() TO service_role;
