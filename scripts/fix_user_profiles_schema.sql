-- Same as ensure_user_profiles.sql — run in Supabase SQL Editor (safe to re-run).

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS user_email TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'email'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_email'
  ) THEN
    UPDATE public.user_profiles
    SET user_email = email
    WHERE (user_email IS NULL OR TRIM(user_email) = '') AND email IS NOT NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'email'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE public.user_profiles RENAME COLUMN email TO user_email;
  END IF;
END $$;

UPDATE public.user_profiles
SET user_email = COALESCE(NULLIF(TRIM(user_email), ''), 'unknown-' || gen_random_uuid()::text)
WHERE user_email IS NULL OR TRIM(user_email) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_profiles'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.user_profiles ADD PRIMARY KEY (user_email);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'PK on user_email not added.';
END $$;

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS target_exam TEXT;

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
UPDATE public.user_profiles SET display_name = '' WHERE display_name IS NULL;
ALTER TABLE public.user_profiles ALTER COLUMN display_name SET DEFAULT '';
ALTER TABLE public.user_profiles ALTER COLUMN display_name SET NOT NULL;

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Legacy id column: often FK → auth.users (breaks NextAuth / Google sign-in)
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

DO $$
DECLARE pk_name text;
BEGIN
  SELECT c.conname INTO pk_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
  WHERE c.conrelid = 'public.user_profiles'::regclass
    AND c.contype = 'p'
    AND a.attname = 'id'
  LIMIT 1;

  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_profiles DROP CONSTRAINT %I', pk_name);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not drop primary key on id: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.user_profiles ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.user_profiles ALTER COLUMN id DROP NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not relax id column: %', SQLERRM;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_email_unique ON public.user_profiles (user_email);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_profiles'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.user_profiles ADD PRIMARY KEY (user_email);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add PK on user_email: %', SQLERRM;
END $$;

UPDATE public.user_profiles
SET profile_completed = false
WHERE first_name IS NULL OR TRIM(COALESCE(first_name, '')) = ''
   OR last_name IS NULL OR TRIM(COALESCE(last_name, '')) = ''
   OR country IS NULL OR TRIM(COALESCE(country, '')) = ''
   OR phone_number IS NULL OR TRIM(COALESCE(phone_number, '')) = '';

UPDATE public.user_profiles
SET display_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE (display_name IS NULL OR TRIM(display_name) = '')
  AND first_name IS NOT NULL AND TRIM(first_name) <> '';

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY user_profiles_read ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY user_profiles_insert ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY user_profiles_update ON public.user_profiles FOR UPDATE USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_user_profiles_completed ON public.user_profiles (profile_completed);

NOTIFY pgrst, 'reload schema';
