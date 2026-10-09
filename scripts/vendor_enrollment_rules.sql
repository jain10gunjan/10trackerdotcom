-- Enrollment number rules for vendor portals.
-- Run in the Supabase SQL Editor, then reload the API schema.
-- Safe to re-run.

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

NOTIFY pgrst, 'reload schema';
