-- Phase F+/scalability: single set-based rank recompute for a vendor test
CREATE OR REPLACE FUNCTION public.recompute_vendor_test_ranks(
  p_vendor_id uuid,
  p_test_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  WITH ranked AS (
    SELECT
      id,
      DENSE_RANK() OVER (ORDER BY COALESCE(score, 0) DESC) AS d_rank,
      ROW_NUMBER() OVER (
        ORDER BY COALESCE(score, 0) DESC,
                 COALESCE(duration_taken, 2147483647) ASC,
                 id ASC
      ) AS r_num
    FROM public.vendor_attempts
    WHERE vendor_id = p_vendor_id
      AND test_id = p_test_id
      AND status IN ('submitted', 'auto_submitted')
  ),
  upd AS (
    UPDATE public.vendor_attempts va
    SET
      dense_rank = ranked.d_rank,
      rank = ranked.r_num,
      updated_at = NOW()
    FROM ranked
    WHERE va.id = ranked.id
      AND va.vendor_id = p_vendor_id
    RETURNING va.id
  )
  SELECT COUNT(*)::integer INTO updated_count FROM upd;

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_vendor_test_ranks(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_vendor_test_ranks(uuid, uuid) TO authenticated;
