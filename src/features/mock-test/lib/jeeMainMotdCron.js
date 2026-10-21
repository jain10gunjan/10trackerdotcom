/**
 * JEE Main auto Mock of the Day: generate blueprint paper or recycle prior mock.
 */

import {
  fetchRecentJeeBlueprintQuestionIds,
  generateAndCreateJeeMainMock,
  pickRecycledJeeBlueprintMock,
} from '@/features/mock-test/lib/jeeMainGenerator';
import { JEE_MAIN_SLUG } from '@/features/mock-test/lib/jeeMainBlueprint';
import { addMockToMotdPool, getIstCalendarDate } from '@/features/mock-test/lib/mockOfTheDay';
import {
  getMotdSettings,
  pinMotdForToday,
  recordMotdCronFailure,
} from '@/features/mock-test/lib/motdSettings';

/**
 * Run once per IST day (Hostinger cron).
 * @param {{ force?: boolean, createdBy?: string }} [opts]
 */
export async function runJeeMainMotdCron(opts = {}) {
  const { force = false, createdBy = 'cron' } = opts;
  const slug = JEE_MAIN_SLUG;
  const istDate = getIstCalendarDate();

  const { settings, setupRequired, setupHint, error: settingsErr } =
    await getMotdSettings(slug);

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
    return {
      ok: true,
      skipped: true,
      reason: 'auto_daily_disabled',
      date: istDate,
    };
  }

  // Already pinned for today
  if (
    !force &&
    settings?.pinned_date === istDate &&
    settings?.pinned_mock_test_id
  ) {
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
      excludedIds = await fetchRecentJeeBlueprintQuestionIds({ limitTests: 15 });
    } catch {
      excludedIds = [];
    }

    const generated = await generateAndCreateJeeMainMock({
      createdBy,
      addToMotdPool: true,
      excludedIds,
      name: `Mock of the Day · JEE Main · ${istDate}`,
    });

    if (generated.ok && generated.test?.id) {
      await pinMotdForToday(
        slug,
        generated.test.id,
        `generated ${generated.questionCount}Q`
      );
      return {
        ok: true,
        mode: 'generated',
        date: istDate,
        mockTestId: generated.test.id,
        test: generated.test,
      };
    }

    // Recycle prior blueprint mock
    const recycled = await pickRecycledJeeBlueprintMock();
    if (!recycled?.id) {
      const msg =
        generated.error ||
        'Blueprint shortfall and no prior JEE blueprint mocks to recycle';
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
    return {
      ok: false,
      mode: 'failed',
      date: istDate,
      error: err.message || 'cron error',
    };
  }
}
