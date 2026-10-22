/**
 * CAT auto Mock of the Day: full 68Q blueprint, or recycle a prior mock.
 */

import {
  fetchRecentCatBlueprintQuestionIds,
  generateAndCreateCatMock,
  pickRecycledCatBlueprintMock,
} from '@/features/mock-test/lib/catGenerator';
import { CAT_SLUG } from '@/features/mock-test/lib/catBlueprint';
import { addMockToMotdPool, getIstCalendarDate } from '@/features/mock-test/lib/mockOfTheDay';
import {
  getMotdSettings,
  pinMotdForToday,
  recordMotdCronFailure,
} from '@/features/mock-test/lib/motdSettings';

export async function runCatMotdCron(opts = {}) {
  const { force = false, createdBy = 'cron' } = opts;
  const slug = CAT_SLUG;
  const istDate = getIstCalendarDate();
  const { settings, setupRequired, setupHint, error: settingsErr } = await getMotdSettings(slug);

  if (setupRequired) {
    return {
      ok: false,
      skipped: true,
      reason: 'settings_table_missing',
      setupHint,
      error: settingsErr?.message,
    };
  }
  if (!force && !settings?.auto_daily_enabled) {
    return { ok: true, skipped: true, reason: 'auto_daily_disabled', date: istDate };
  }
  if (!force && settings?.pinned_date === istDate && settings?.pinned_mock_test_id) {
    return {
      ok: true,
      skipped: true,
      reason: 'already_pinned_today',
      date: istDate,
      mockTestId: settings.pinned_mock_test_id,
    };
  }

  try {
    let excludedIds = [];
    try {
      excludedIds = await fetchRecentCatBlueprintQuestionIds({ limitTests: 15 });
    } catch {
      excludedIds = [];
    }

    const generated = await generateAndCreateCatMock({
      createdBy,
      addToMotdPool: true,
      excludedIds,
      name: `Mock of the Day · CAT · ${istDate}`,
    });

    if (generated.ok && generated.test?.id) {
      await pinMotdForToday(slug, generated.test.id, `generated ${generated.questionCount}Q`);
      return {
        ok: true,
        mode: 'generated',
        date: istDate,
        mockTestId: generated.test.id,
        test: generated.test,
      };
    }

    const recycled = await pickRecycledCatBlueprintMock();
    if (!recycled?.id) {
      const msg = generated.error || 'Blueprint shortfall and no prior CAT mocks to recycle';
      await recordMotdCronFailure(slug, msg);
      return {
        ok: false,
        mode: 'failed',
        date: istDate,
        error: msg,
        audit: generated.preview?.subjects?.map((s) => ({
          subject: s.subject,
          ok: s.ok,
          errors: s.audit?.errors,
        })),
      };
    }

    await addMockToMotdPool({ examCategory: slug, mockTestId: recycled.id });
    await pinMotdForToday(slug, recycled.id, `recycled ${recycled.name}`);
    return {
      ok: true,
      mode: 'recycled',
      date: istDate,
      mockTestId: recycled.id,
      test: recycled,
    };
  } catch (err) {
    await recordMotdCronFailure(slug, err.message || 'cron error');
    return { ok: false, mode: 'failed', date: istDate, error: err.message || 'cron error' };
  }
}
