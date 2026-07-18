-- Quick fix: user_profiles.id → auth.users FK breaks Google / NextAuth sign-in
-- Run in Supabase SQL Editor, then retry profile save.

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles ALTER COLUMN id DROP DEFAULT;

DO $$
BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_email_unique ON public.user_profiles (user_email);

NOTIFY pgrst, 'reload schema';
