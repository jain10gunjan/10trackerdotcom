-- Demo OG Trackers paths for dogfooding.
-- Idempotent: re-running resets demo path resources.
-- Requires setup_og_trackers.sql (+ add_og_trackers_platform_resources.sql if DB was created earlier).
-- Optional: setup_extension_tokens.sql for Chrome extension.

DO $$
DECLARE
  path_uuid UUID;
  study_uuid UUID;
BEGIN
  -- ── YouTube-only demo (extension) ──────────────────────────────────────────
  INSERT INTO public.og_paths (
    slug,
    title,
    description,
    category,
    tags,
    icon,
    sort_order,
    is_premium,
    is_active
  )
  VALUES (
    'demo-dsa-youtube',
    'Demo DSA YouTube Path',
    'Free sample path for testing YouTube progress sync (in-app player + Chrome extension).',
    'DSA',
    ARRAY['demo', 'youtube', 'dsa']::text[],
    'Map',
    0,
    false,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    is_premium = false,
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO path_uuid;

  IF path_uuid IS NULL THEN
    SELECT id INTO path_uuid FROM public.og_paths WHERE slug = 'demo-dsa-youtube';
  END IF;

  DELETE FROM public.og_resources WHERE path_id = path_uuid;

  INSERT INTO public.og_resources (
    path_id,
    type,
    sort_order,
    title,
    youtube_video_id,
    duration_seconds,
    is_premium,
    section_label,
    meta
  ) VALUES
    (
      path_uuid,
      'VIDEO',
      1,
      'Algorithms & Data Structures — Full Course (freeCodeCamp)',
      '8hly31xKli0',
      NULL,
      false,
      'Watch',
      '{}'::jsonb
    ),
    (
      path_uuid,
      'VIDEO',
      2,
      'Data Structures — Easy to Advanced Course',
      'RBSGKlAvoiM',
      NULL,
      false,
      'Watch',
      '{}'::jsonb
    ),
    (
      path_uuid,
      'VIDEO',
      3,
      'Dynamic Programming — Learn to Solve Algorithmic Problems',
      'oBt53YbR9Kk',
      NULL,
      false,
      'Watch',
      '{}'::jsonb
    ),
    (
      path_uuid,
      'VIDEO',
      4,
      'Big O Notation — Full Course',
      'Mo4vesAut8M',
      NULL,
      false,
      'Watch',
      '{}'::jsonb
    );

  -- ── Full study-path demo (video → practice → mock) ─────────────────────────
  INSERT INTO public.og_paths (
    slug,
    title,
    description,
    category,
    tags,
    icon,
    sort_order,
    is_premium,
    is_active
  )
  VALUES (
    'demo-study-path',
    'Demo Study Path',
    'Sample module path: watch a video, practice a chapter on 10Tracker, then take a mock. Replace practice/mock meta with real chapters and test IDs in admin.',
    'Placement',
    ARRAY['demo', 'study', 'practice', 'mock']::text[],
    'Map',
    1,
    false,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    is_premium = false,
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO study_uuid;

  IF study_uuid IS NULL THEN
    SELECT id INTO study_uuid FROM public.og_paths WHERE slug = 'demo-study-path';
  END IF;

  DELETE FROM public.og_resources WHERE path_id = study_uuid;

  INSERT INTO public.og_resources (
    path_id,
    type,
    sort_order,
    title,
    youtube_video_id,
    duration_seconds,
    external_slug,
    external_url,
    is_premium,
    section_label,
    meta
  ) VALUES
    (
      study_uuid,
      'VIDEO',
      1,
      'Watch: Intro to Algorithms (MIT OpenCourseWare)',
      'HtSuA80QTyo',
      NULL,
      NULL,
      NULL,
      false,
      'Day 1',
      '{}'::jsonb
    ),
    (
      study_uuid,
      'PRACTICE_CHAPTER',
      2,
      'Practice: chapter on platform',
      NULL,
      NULL,
      'gate-cse/engineering-mathematics/linear-algebra',
      '/gate-cse/engineering-mathematics/linear-algebra/practice',
      false,
      'Day 1',
      jsonb_build_object(
        'area', 'gate-cse',
        'subject', 'engineering-mathematics',
        'chapter', 'linear-algebra',
        'completionPercent', 70
      )
    ),
    (
      study_uuid,
      'MOCK_TEST',
      3,
      'Mock: replace testId in admin with a real mock UUID',
      NULL,
      NULL,
      '00000000-0000-4000-8000-000000000001',
      '/mock-test/gate-cse/attempt/00000000-0000-4000-8000-000000000001',
      false,
      'Day 1',
      jsonb_build_object(
        'examCategory', 'gate-cse',
        'testId', '00000000-0000-4000-8000-000000000001'
      )
    );
END $$;
