-- Chrome extension API tokens + one-time connect codes for OG Trackers sync.
-- Run in Supabase SQL Editor. Safe to re-run.
-- NextAuth identity: tokens keyed by user_email (not auth.users UUID).

-- ── Long-lived extension Bearer tokens (store SHA-256 hash only) ─────────────
CREATE TABLE IF NOT EXISTS public.extension_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT 'Chrome extension',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_extension_api_tokens_email_active
  ON public.extension_api_tokens (user_email)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_extension_api_tokens_hash
  ON public.extension_api_tokens (token_hash)
  WHERE revoked_at IS NULL;

-- ── One-time connect codes (exchange → API token) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.extension_connect_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Chrome extension',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_extension_connect_codes_email
  ON public.extension_connect_codes (user_email);

-- ── Lookup index for extension by-youtube API ───────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_og_resources_youtube_video_id
  ON public.og_resources (youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

-- ── RLS: deny anon; service_role only (server uses service role after auth) ──
ALTER TABLE public.extension_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_connect_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS extension_api_tokens_deny_anon ON public.extension_api_tokens;
CREATE POLICY extension_api_tokens_deny_anon ON public.extension_api_tokens
  FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS extension_api_tokens_service_all ON public.extension_api_tokens;
CREATE POLICY extension_api_tokens_service_all ON public.extension_api_tokens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS extension_connect_codes_deny_anon ON public.extension_connect_codes;
CREATE POLICY extension_connect_codes_deny_anon ON public.extension_connect_codes
  FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS extension_connect_codes_service_all ON public.extension_connect_codes;
CREATE POLICY extension_connect_codes_service_all ON public.extension_connect_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.extension_api_tokens TO service_role;
GRANT ALL ON public.extension_connect_codes TO service_role;
