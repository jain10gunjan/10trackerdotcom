-- =============================================================================
-- Vendor practice-tests multi-tenancy (Phase A)
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS / additive).
-- Does NOT drop or rewrite existing examtracker / mock_tests / user_test_attempts.
-- =============================================================================
-- BEFORE RUN: review this file. After run: Dashboard → Settings → API → Reload schema
--             or: NOTIFY pgrst, 'reload schema';
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) vendors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT,
  contact_email TEXT,
  city TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendors_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_custom_domain
  ON public.vendors (custom_domain)
  WHERE custom_domain IS NOT NULL AND TRIM(custom_domain) <> '';

-- ---------------------------------------------------------------------------
-- 2) vendor_access_settings (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_access_settings (
  vendor_id UUID PRIMARY KEY REFERENCES public.vendors (id) ON DELETE CASCADE,
  access_mode TEXT NOT NULL DEFAULT 'domain_and_allowlist'
    CHECK (access_mode IN (
      'domain_only',
      'domain_and_allowlist',
      'allowlist_only',
      'open_to_all'
    )),
  auto_enroll BOOLEAN NOT NULL DEFAULT true,
  allow_subdomains BOOLEAN NOT NULL DEFAULT false,
  require_workspace_hd BOOLEAN NOT NULL DEFAULT false,
  allow_gmail_auto_enroll BOOLEAN NOT NULL DEFAULT false,
  enrollment_min_length INTEGER NOT NULL DEFAULT 1,
  enrollment_max_length INTEGER NOT NULL DEFAULT 64,
  enrollment_digits_only BOOLEAN NOT NULL DEFAULT false,
  enrollment_prefix TEXT,
  enrollment_hint TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3) vendor_allowed_domains
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_allowed_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_allowed_domains_unique UNIQUE (vendor_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_vendor_allowed_domains_vendor
  ON public.vendor_allowed_domains (vendor_id);

-- ---------------------------------------------------------------------------
-- 4) vendor_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('vendor_admin', 'vendor_staff', 'student')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'revoked')),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('domain', 'allowlist', 'manual')),
  roll_no TEXT,
  branch TEXT,
  batch TEXT,
  year TEXT,
  display_name TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_members_email_unique UNIQUE (vendor_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_vendor_members_vendor_status
  ON public.vendor_members (vendor_id, status, role);
CREATE INDEX IF NOT EXISTS idx_vendor_members_email
  ON public.vendor_members (user_email);

-- Enrollment / roll unique per vendor (case-insensitive, trimmed; blanks ignored)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_members_roll_unique
  ON public.vendor_members (vendor_id, lower(trim(roll_no)))
  WHERE roll_no IS NOT NULL AND trim(roll_no) <> '';

-- ---------------------------------------------------------------------------
-- 5) vendor_audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors (id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_audit_logs_vendor_created
  ON public.vendor_audit_logs (vendor_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 6) vendor_access_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_vendor_access_requests_vendor
  ON public.vendor_access_requests (vendor_id, status);

-- ---------------------------------------------------------------------------
-- 7) vendor_questions (same shape as examtracker + vendor_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_questions (
  _id TEXT PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  year INTEGER,
  subject TEXT,
  chapter TEXT,
  question TEXT NOT NULL,
  -- Lowercase names: Postgres folds unquoted mixed-case; PostgREST keys must match.
  options_a TEXT,
  options_b TEXT,
  options_c TEXT,
  options_d TEXT,
  correct_option TEXT,
  solution TEXT,
  solutiontext TEXT,
  directionhtml TEXT,
  questionimage TEXT,
  questioncode TEXT,
  topiclist TEXT,
  order_index INTEGER,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'csv', 'json', 'copied_from_platform')),
  source_question_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_questions_vendor_topic
  ON public.vendor_questions (vendor_id, topic);
CREATE INDEX IF NOT EXISTS idx_vendor_questions_vendor_category
  ON public.vendor_questions (vendor_id, category);

-- ---------------------------------------------------------------------------
-- 8) vendor_tests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  total_marks NUMERIC,
  passing_marks NUMERIC,
  negative_marking NUMERIC NOT NULL DEFAULT 0,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_options BOOLEAN NOT NULL DEFAULT false,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  result_release TEXT NOT NULL DEFAULT 'instant'
    CHECK (result_release IN ('instant', 'after_window', 'manual')),
  results_released BOOLEAN NOT NULL DEFAULT false,
  anti_cheat_enabled BOOLEAN NOT NULL DEFAULT true,
  max_focus_violations INTEGER NOT NULL DEFAULT 4,
  total_questions INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_tests_vendor_status
  ON public.vendor_tests (vendor_id, status);

-- ---------------------------------------------------------------------------
-- 9) vendor_test_questions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.vendor_tests (id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.vendor_questions (_id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  marks NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_test_questions_unique UNIQUE (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_test_questions_test
  ON public.vendor_test_questions (test_id);

-- ---------------------------------------------------------------------------
-- 10) vendor_attempts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.vendor_tests (id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN (
      'in_progress',
      'submitted',
      'auto_submitted',
      'frozen_access_revoked'
    )),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  duration_taken INTEGER,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  marked_for_review JSONB NOT NULL DEFAULT '[]'::jsonb,
  anti_cheat_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  focus_violation_count INTEGER NOT NULL DEFAULT 0,
  cheated BOOLEAN NOT NULL DEFAULT false,
  score NUMERIC,
  max_score NUMERIC,
  percentage NUMERIC,
  correct_count INTEGER,
  incorrect_count INTEGER,
  skipped_count INTEGER,
  rank INTEGER,
  dense_rank INTEGER,
  final_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_attempts_vendor_test_user
  ON public.vendor_attempts (vendor_id, test_id, user_email);
CREATE INDEX IF NOT EXISTS idx_vendor_attempts_test_status
  ON public.vendor_attempts (test_id, status);

-- ---------------------------------------------------------------------------
-- 11) vendor_attempt_responses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_attempt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES public.vendor_attempts (id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_order INTEGER,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded NUMERIC NOT NULL DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  marked_for_review BOOLEAN DEFAULT false,
  subject TEXT,
  topic TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_attempt_responses_unique UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_attempt_responses_attempt
  ON public.vendor_attempt_responses (attempt_id);

-- ---------------------------------------------------------------------------
-- 12) Optional additive column on platform mock_tests (null = platform)
-- ---------------------------------------------------------------------------
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mock_tests_vendor_id
  ON public.mock_tests (vendor_id)
  WHERE vendor_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 13) RLS: deny anon/authenticated direct access; app uses service_role
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_access_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_attempt_responses ENABLE ROW LEVEL SECURITY;

-- No permissive policies for anon/authenticated → only service_role bypasses RLS.
-- (If you need a public marketing snippet later, add a narrow SELECT policy.)

GRANT ALL ON public.vendors TO service_role;
GRANT ALL ON public.vendor_access_settings TO service_role;
GRANT ALL ON public.vendor_allowed_domains TO service_role;
GRANT ALL ON public.vendor_members TO service_role;
GRANT ALL ON public.vendor_audit_logs TO service_role;
GRANT ALL ON public.vendor_access_requests TO service_role;
GRANT ALL ON public.vendor_questions TO service_role;
GRANT ALL ON public.vendor_tests TO service_role;
GRANT ALL ON public.vendor_test_questions TO service_role;
GRANT ALL ON public.vendor_attempts TO service_role;
GRANT ALL ON public.vendor_attempt_responses TO service_role;

-- ---------------------------------------------------------------------------
-- 14) Seed: IPS Academy Indore
-- ---------------------------------------------------------------------------
INSERT INTO public.vendors (name, slug, status, contact_email, city, theme_color)
VALUES (
  'IPS Academy Indore',
  'ips-academy-indore',
  'active',
  'contact@ipsacademy.org',
  'Indore',
  '#0F766E'
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  status = 'active',
  updated_at = NOW();

INSERT INTO public.vendor_access_settings (
  vendor_id, access_mode, auto_enroll, allow_subdomains, require_workspace_hd
)
SELECT v.id, 'domain_and_allowlist', true, false, false
FROM public.vendors v
WHERE v.slug = 'ips-academy-indore'
ON CONFLICT (vendor_id) DO UPDATE
SET
  access_mode = 'domain_and_allowlist',
  auto_enroll = true,
  allow_subdomains = false,
  updated_at = NOW();

INSERT INTO public.vendor_allowed_domains (vendor_id, domain, created_by)
SELECT v.id, 'ipsacademy.org', 'seed'
FROM public.vendors v
WHERE v.slug = 'ips-academy-indore'
ON CONFLICT (vendor_id, domain) DO NOTHING;

INSERT INTO public.vendor_members (
  vendor_id, user_email, role, status, source, created_by, display_name
)
SELECT
  v.id,
  'jain10gunjan@gmail.com',
  'vendor_admin',
  'active',
  'manual',
  'seed',
  'Platform Super Admin'
FROM public.vendors v
WHERE v.slug = 'ips-academy-indore'
ON CONFLICT (vendor_id, user_email) DO UPDATE
SET
  role = 'vendor_admin',
  status = 'active',
  updated_at = NOW();

INSERT INTO public.vendor_audit_logs (vendor_id, actor_email, action, entity_type, details)
SELECT
  v.id,
  'seed',
  'vendor.seeded',
  'vendor',
  jsonb_build_object('slug', 'ips-academy-indore', 'domain', 'ipsacademy.org')
FROM public.vendors v
WHERE v.slug = 'ips-academy-indore';

-- ---------------------------------------------------------------------------
-- 15) Proctoring limit + Gmail auto-entry (safe to re-run)
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_tests
  ADD COLUMN IF NOT EXISTS max_focus_violations INTEGER NOT NULL DEFAULT 4;

ALTER TABLE public.vendor_attempts
  ADD COLUMN IF NOT EXISTS focus_violation_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.vendor_attempts
  ADD COLUMN IF NOT EXISTS cheated BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS allow_gmail_auto_enroll BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS enrollment_min_length INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS enrollment_max_length INTEGER NOT NULL DEFAULT 64;
ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS enrollment_digits_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS enrollment_prefix TEXT;
ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS enrollment_hint TEXT;

ALTER TABLE public.vendor_members DROP CONSTRAINT IF EXISTS vendor_members_source_check;
ALTER TABLE public.vendor_members
  ADD CONSTRAINT vendor_members_source_check
  CHECK (source IN ('domain', 'allowlist', 'manual', 'gmail'));

NOTIFY pgrst, 'reload schema';
