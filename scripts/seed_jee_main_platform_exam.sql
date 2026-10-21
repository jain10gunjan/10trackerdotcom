-- Activate JEE Main in platform_exams (admin mock-test hub).
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
  'jee-main',
  'JEE Mains',
  'Joint Entrance Examination for Engineering — full mock blueprint (75Q).',
  'Engineering',
  40,
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = NOW();
