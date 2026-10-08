-- Ensure mock_tests.creation_mode exists (topic / MOTD markers).
-- Safe to run if the column is already present.

ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS creation_mode TEXT;

COMMENT ON COLUMN public.mock_tests.creation_mode IS
  'How the mock was created: manual, auto, topic_auto, motd_pool, etc.';
