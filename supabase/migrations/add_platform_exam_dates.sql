-- Admin-managed exam countdown for signed-in home.
-- Run in Supabase SQL Editor after setup_platform_exams.sql.

ALTER TABLE public.platform_exams
  ADD COLUMN IF NOT EXISTS exam_date DATE,
  ADD COLUMN IF NOT EXISTS exam_date_label TEXT,
  ADD COLUMN IF NOT EXISTS exam_date_visible BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.platform_exams.exam_date IS
  'Next official exam date used for homepage days-left countdown';
COMMENT ON COLUMN public.platform_exams.exam_date_label IS
  'Optional display label override (e.g. May 2026)';
COMMENT ON COLUMN public.platform_exams.exam_date_visible IS
  'When false, countdown is hidden on the student homepage';
