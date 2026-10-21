-- Activate GATE EC in platform_exams (admin mock-test hub).
-- Safe to re-run.

INSERT INTO public.platform_exams (
  slug,
  name,
  description,
  category,
  sort_order,
  is_active,
  updated_at
)
VALUES (
  'gate-ec',
  'GATE EC',
  'Graduate Aptitude Test in Engineering — EC (ECE) full mock blueprint (65Q / 100 marks).',
  'Engineering',
  15,
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = NOW();
