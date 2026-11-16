-- Activate CAT in platform_exams (safe to re-run).
UPDATE public.platform_exams
SET is_active = true,
    updated_at = NOW()
WHERE slug = 'cat';
