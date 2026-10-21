/**
 * mock_of_day_settings helpers (auto-daily + IST pin).
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeMotdExamSlug, getIstCalendarDate } from '@/features/mock-test/lib/mockOfTheDay';

export const MOTD_SETTINGS_HINT =
  'Run supabase/migrations/add_mock_of_day_settings.sql in Supabase SQL Editor';

function isMissingSettingsTable(error) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /mock_of_day_settings/i.test(error.message || '')
  );
}

export async function getMotdSettings(examCategory) {
  const slug = normalizeMotdExamSlug(examCategory);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('mock_of_day_settings')
    .select('*')
    .eq('exam_category', slug)
    .maybeSingle();

  if (error) {
    if (isMissingSettingsTable(error)) {
      return {
        settings: null,
        setupRequired: true,
        setupHint: MOTD_SETTINGS_HINT,
        error,
      };
    }
    return { settings: null, setupRequired: false, error };
  }

  return {
    settings: data || {
      exam_category: slug,
      auto_daily_enabled: false,
      pinned_mock_test_id: null,
      pinned_date: null,
    },
    setupRequired: false,
    error: null,
  };
}

export async function upsertMotdSettings(examCategory, patch = {}) {
  const slug = normalizeMotdExamSlug(examCategory);
  const supabase = getSupabaseAdmin();
  const row = {
    exam_category: slug,
    updated_at: new Date().toISOString(),
    ...patch,
  };

  const { data, error } = await supabase
    .from('mock_of_day_settings')
    .upsert(row, { onConflict: 'exam_category' })
    .select()
    .single();

  if (error) {
    return {
      settings: null,
      error,
      setupRequired: isMissingSettingsTable(error),
      setupHint: isMissingSettingsTable(error) ? MOTD_SETTINGS_HINT : null,
    };
  }
  return { settings: data, error: null, setupRequired: false };
}

export async function pinMotdForToday(examCategory, mockTestId, message = 'ok') {
  const date = getIstCalendarDate();
  return upsertMotdSettings(examCategory, {
    pinned_mock_test_id: mockTestId,
    pinned_date: date,
    last_cron_at: new Date().toISOString(),
    last_cron_status: 'ok',
    last_cron_message: message,
  });
}

export async function recordMotdCronFailure(examCategory, message) {
  return upsertMotdSettings(examCategory, {
    last_cron_at: new Date().toISOString(),
    last_cron_status: 'error',
    last_cron_message: String(message || 'error').slice(0, 500),
  });
}
