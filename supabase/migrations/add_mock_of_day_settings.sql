-- Mock of the Day auto-daily settings + optional pin for today's mock (IST).
-- Run in Supabase SQL Editor after add_mock_of_day_pool.sql.

CREATE TABLE IF NOT EXISTS public.mock_of_day_settings (
  exam_category TEXT PRIMARY KEY,
  auto_daily_enabled BOOLEAN NOT NULL DEFAULT false,
  pinned_mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE SET NULL,
  pinned_date TEXT,
  last_cron_at TIMESTAMPTZ,
  last_cron_status TEXT,
  last_cron_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_motd_settings_auto
  ON public.mock_of_day_settings (auto_daily_enabled);

ALTER TABLE public.mock_of_day_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mock_of_day_settings_read ON public.mock_of_day_settings;
CREATE POLICY mock_of_day_settings_read ON public.mock_of_day_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mock_of_day_settings_admin_write ON public.mock_of_day_settings;
CREATE POLICY mock_of_day_settings_admin_write ON public.mock_of_day_settings
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON public.mock_of_day_settings TO anon, authenticated;
GRANT ALL ON public.mock_of_day_settings TO service_role;

COMMENT ON TABLE public.mock_of_day_settings IS
  'Per-exam MOTD auto-daily flag and IST pin (pinned_date YYYY-MM-DD)';
