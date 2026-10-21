/**
 * GATE CSE auto Mock of the Day: generate blueprint paper or recycle prior mock.
 */

import {
  fetchRecentGateBlueprintQuestionIds,
  generateAndCreateGateCseMock,
  pickRecycledGateBlueprintMock,
} from '@/features/mock-test/lib/gateCseGenerator';
import { GATE_CSE_SLUG } from '@/features/mock-test/lib/gateCseBlueprint';
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
export async function runGateCseMotdCron(opts = {}) {
  const { force = false, createdBy = 'cron' } = opts;
  const slug = GATE_CSE_SLUG;
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
      excludedIds = await fetchRecentGateBlueprintQuestionIds({ limitTests: 15 });
    } catch {
      excludedIds = [];
    }

    const generated = await generateAndCreateGateCseMock({
      createdBy,
      addToMotdPool: true,
      excludedIds,
      name: `Mock of the Day · GATE CSE · ${istDate}`,
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

    const recycled = await pickRecycledGateBlueprintMock();
    if (!recycled?.id) {
      const msg =
        generated.error ||
        'Blueprint shortfall and no prior GATE blueprint mocks to recycle';
      await recordMotdCronFailure(slug, msg);
      return {
        ok: false,
        mode: 'failed',
        date: istDate,
        error: msg,
        audit: generated.preview?.blocks?.map((b) => ({
          blockId: b.blockId,
          subject: b.subject,
          ok: b.ok,
          errors: b.audit?.errors,
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
