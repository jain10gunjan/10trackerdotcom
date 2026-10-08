-- Allow source = 'json' on vendor_questions (safe to re-run)
ALTER TABLE public.vendor_questions
  DROP CONSTRAINT IF EXISTS vendor_questions_source_check;

ALTER TABLE public.vendor_questions
  ADD CONSTRAINT vendor_questions_source_check
  CHECK (source IN ('manual', 'csv', 'json', 'copied_from_platform'));
