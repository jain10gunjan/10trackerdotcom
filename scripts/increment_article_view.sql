-- Atomic page-view counter for published updates (articles).
-- Run once in the Supabase SQL Editor, then reload the API schema if needed.
-- View writes do not touch updated_at and do not bust the public article cache.

CREATE OR REPLACE FUNCTION public.increment_article_view(p_article_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_article_id
    AND status = 'published'
  RETURNING view_count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_article_view(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(bigint) TO service_role;
