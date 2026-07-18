-- =============================================================================
-- STEP 3 of 3 — Practice activity timestamp for heatmap (run AFTER step 2).
-- Run alone. Then refresh schema in Supabase: Settings → API → Reload schema
-- (or run the NOTIFY line below once).
-- =============================================================================

ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.user_progress
SET updated_at = NOW()
WHERE updated_at IS NULL;

NOTIFY pgrst, 'reload schema';
