-- Profile terms acceptance (run once in Supabase SQL Editor)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Legacy rows get terms_version = 'legacy' — they will be prompted to re-accept
-- when TERMS_VERSION in src/lib/billing/legal.js differs from their stored version.
UPDATE public.user_profiles
SET
  terms_accepted_at = COALESCE(terms_accepted_at, updated_at, created_at, NOW()),
  terms_version = COALESCE(terms_version, 'legacy')
WHERE profile_completed = true
  AND terms_accepted_at IS NULL;

NOTIFY pgrst, 'reload schema';
