-- Extension: SKIPPED status + last-device stamp on og_progress

ALTER TABLE public.og_progress
  DROP CONSTRAINT IF EXISTS og_progress_status_check;

ALTER TABLE public.og_progress
  ADD CONSTRAINT og_progress_status_check
  CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'SKIPPED', 'COMPLETED'));

ALTER TABLE public.og_progress
  ADD COLUMN IF NOT EXISTS last_device_label TEXT;

ALTER TABLE public.og_progress
  ADD COLUMN IF NOT EXISTS last_token_id UUID;
