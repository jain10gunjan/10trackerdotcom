-- Proctoring switch limit + Gmail auto-entry.
-- Run in Supabase SQL Editor, then reload the API schema.
-- Safe to re-run.

ALTER TABLE public.vendor_tests
  ADD COLUMN IF NOT EXISTS max_focus_violations INTEGER NOT NULL DEFAULT 4;

ALTER TABLE public.vendor_attempts
  ADD COLUMN IF NOT EXISTS focus_violation_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.vendor_attempts
  ADD COLUMN IF NOT EXISTS cheated BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.vendor_access_settings
  ADD COLUMN IF NOT EXISTS allow_gmail_auto_enroll BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.vendor_members DROP CONSTRAINT IF EXISTS vendor_members_source_check;
ALTER TABLE public.vendor_members
  ADD CONSTRAINT vendor_members_source_check
  CHECK (source IN ('domain', 'allowlist', 'manual', 'gmail'));

NOTIFY pgrst, 'reload schema';
