/**
 * Bank-only JEE Main paper picker with fail-closed blueprint audit.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { hasPopulatedOptions } from '@/lib/questionAnswerMode';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool, getIstCalendarDate, istDayIndex } from '@/features/mock-test/lib/mockOfTheDay';
import {
  JEE_MAIN_CREATION_MODE,
  JEE_MAIN_PAPER,
  JEE_MAIN_SLUG,
  JEE_MAIN_SUBJECTS,
  getSubjectBlueprint,
  normalizeDifficulty,
  normalizeJeeChapterToken,
  resolveSlotAliases,
} from '@/features/mock-test/lib/jeeMainBlueprint';

const BANK_SELECT =
  '_id, subject, chapter, chapter_slug, topic, difficulty, category, options_A, options_B, options_C, options_D';

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function difficultyRank(d) {
  const n = normalizeDifficulty(d);
  if (n === 'easy') return 0;
  if (n === 'hard') return 2;
  return 1;
}

function rowChapterTokens(row) {
  return [
    normalizeJeeChapterToken(row.chapter),
    normalizeJeeChapterToken(row.chapter_slug),
    normalizeJeeChapterToken(row.topic),
  ].filter(Boolean);
}

function rowMatchesAliases(row, aliases) {
  if (!aliases?.length) return false;
  const tokens = rowChapterTokens(row);
  return aliases.some((a) => tokens.includes(a) || tokens.some((t) => t.includes(a) || a.includes(t)));
}

function isMcqRow(row) {
  return hasPopulatedOptions(row);
}

async function fetchSubjectBank(subject) {
  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(JEE_MAIN_SLUG);
  const all = [];
  let from = 0;
  const page = 1000;

  while (true) {
    let query = supabase
      .from('examtracker')
      .select(BANK_SELECT)
      .in('category', variants)
      .ilike('subject', subject)
      .range(from, from + page - 1);

    let { data, error } = await query;
    if (error || !data?.length) {
      // fallback single category
      if (!all.length) {
        const retry = await supabase
          .from('examtracker')
          .select(BANK_SELECT)
          .eq('category', 'JEE-MAIN')
          .ilike('subject', subject)
          .range(from, from + page - 1);
        data = retry.data;
        error = retry.error;
      }
    }
    if (error) throw new Error(error.message || 'Failed to load examtracker bank');
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
    from += page;
  }

  return all.filter((r) => r?._id);
}

function pickFromPool(pool, count, usedIds, preferDiff = null) {
  const available = pool.filter((r) => !usedIds.has(String(r._id)));
  if (available.length < count) {
    return { picks: [], shortfall: count - available.length, available: available.length };
  }

  let candidates = [...available];
  if (preferDiff) {
    const preferred = candidates.filter((r) => normalizeDifficulty(r.difficulty) === preferDiff);
    const rest = candidates.filter((r) => normalizeDifficulty(r.difficulty) !== preferDiff);
    shuffleInPlace(preferred);
    shuffleInPlace(rest);
    candidates = [...preferred, ...rest];
  } else {
    shuffleInPlace(candidates);
  }

  const picks = candidates.slice(0, count);
  picks.forEach((p) => usedIds.add(String(p._id)));
  return { picks, shortfall: 0, available: available.length };
}

function emptyAudit(subject) {
  return {
    subject,
    ok: false,
    chapterRows: [],
    nvq: { target: JEE_MAIN_PAPER.nvqPerSubject, actual: 0, shortfall: JEE_MAIN_PAPER.nvqPerSubject },
    difficulty: { target: { ...JEE_MAIN_PAPER.difficultyTargets }, actual: { easy: 0, medium: 0, hard: 0 } },
    mcqCount: 0,
    nvqCount: 0,
    total: 0,
    errors: [],
  };
}

/**
 * Dry-run (or pick) one subject (25Q: 20 MCQ + 5 NVQ).
 * @param {{ subject: string, excludedIds?: string[], dayIndex?: number }} opts
 */
export async function previewJeeMainSubject({
  subject,
  excludedIds = [],
  dayIndex = istDayIndex(getIstCalendarDate()),
} = {}) {
  const bp = getSubjectBlueprint(subject);
  if (!bp) {
    return {
      ok: false,
      picks: [],
      audit: {
        ...emptyAudit(subject),
        errors: [`Unknown subject: ${subject}`],
      },
    };
  }

  const bank = await fetchSubjectBank(bp.label);
  const usedIds = new Set((excludedIds || []).map(String));
  const audit = emptyAudit(bp.label);
  const errors = [];
  const nvqPrefer = new Set(bp.nvqChapterKeys || []);
  let nvqStillNeeded = JEE_MAIN_PAPER.nvqPerSubject;

  /** @type {Array} */
  const subjectPicks = [];

  for (const slot of bp.mcqSlots) {
    const aliases = resolveSlotAliases(slot, dayIndex);
    let remaining = slot.count;
    let nvqGot = 0;
    let mcqGot = 0;

    // Prefer 1 NVQ from preferred chapters while we still need Section B seats
    if (nvqStillNeeded > 0 && nvqPrefer.has(slot.key) && remaining > 0) {
      const nvqPool = bank.filter((r) => !isMcqRow(r) && rowMatchesAliases(r, aliases));
      const { picks } = pickFromPool(nvqPool, 1, usedIds);
      if (picks.length) {
        subjectPicks.push({
          ...picks[0],
          _blueprintKey: slot.key,
          _section: 'B',
          _qType: 'nvq',
        });
        nvqGot = 1;
        nvqStillNeeded -= 1;
        remaining -= 1;
      }
    }

    if (remaining > 0) {
      const mcqPool = bank.filter((r) => isMcqRow(r) && rowMatchesAliases(r, aliases));
      const { picks, shortfall, available } = pickFromPool(mcqPool, remaining, usedIds);
      mcqGot = picks.length;
      audit.chapterRows.push({
        key: slot.key,
        type: 'mixed',
        target: slot.count,
        actual: nvqGot + mcqGot,
        available,
        aliases,
        shortfall: shortfall + Math.max(0, remaining - picks.length),
        nvq: nvqGot,
        mcq: mcqGot,
      });
      if (shortfall > 0) {
        errors.push(
          `${slot.key}: need ${slot.count}, got ${nvqGot + mcqGot} (MCQ unused ${available}; aliases: ${aliases.join(', ') || 'none'})`
        );
      }
      subjectPicks.push(
        ...picks.map((p) => ({
          ...p,
          _blueprintKey: slot.key,
          _section: 'A',
          _qType: 'mcq',
        }))
      );
    } else {
      audit.chapterRows.push({
        key: slot.key,
        type: 'mixed',
        target: slot.count,
        actual: nvqGot,
        available: nvqGot,
        aliases,
        shortfall: 0,
        nvq: nvqGot,
        mcq: 0,
      });
    }
  }

  // Fill remaining NVQ seats from preferred chapters, then any subject NVQ
  if (nvqStillNeeded > 0) {
    for (const key of bp.nvqChapterKeys || []) {
      if (nvqStillNeeded <= 0) break;
      const slot = bp.mcqSlots.find((s) => s.key === key);
      const aliases = slot ? resolveSlotAliases(slot, dayIndex) : [];
      const pool = bank.filter((r) => !isMcqRow(r) && rowMatchesAliases(r, aliases));
      const { picks } = pickFromPool(pool, 1, usedIds);
      if (!picks.length) continue;
      // Swap: drop one MCQ from same key if present, else from any MCQ
      const mcqIdx = subjectPicks.findIndex(
        (p) => p._qType === 'mcq' && p._blueprintKey === key
      );
      const anyMcqIdx =
        mcqIdx >= 0 ? mcqIdx : subjectPicks.findIndex((p) => p._qType === 'mcq');
      if (anyMcqIdx < 0) break;
      const removed = subjectPicks.splice(anyMcqIdx, 1)[0];
      usedIds.delete(String(removed._id));
      // re-mark removed id as free only if we don't keep it — already removed from picks
      subjectPicks.push({
        ...picks[0],
        _blueprintKey: key,
        _section: 'B',
        _qType: 'nvq',
      });
      nvqStillNeeded -= 1;
    }
  }

  if (nvqStillNeeded > 0) {
    const pool = bank.filter((r) => !isMcqRow(r));
    const { picks, shortfall, available } = pickFromPool(pool, nvqStillNeeded, usedIds);
    audit.chapterRows.push({
      key: '_nvq_fill',
      type: 'nvq',
      target: nvqStillNeeded,
      actual: picks.length,
      available,
      aliases: ['*'],
      shortfall,
    });
    for (const p of picks) {
      const anyMcqIdx = subjectPicks.findIndex((x) => x._qType === 'mcq');
      if (anyMcqIdx < 0) break;
      subjectPicks.splice(anyMcqIdx, 1);
      subjectPicks.push({
        ...p,
        _blueprintKey: 'nvq_fill',
        _section: 'B',
        _qType: 'nvq',
      });
      nvqStillNeeded -= 1;
    }
    if (nvqStillNeeded > 0) {
      errors.push(
        `NVQ Section B: still short ${nvqStillNeeded} (subject NVQ unused pool ${available})`
      );
    }
  }

  const mcqPicks = subjectPicks.filter((p) => p._qType === 'mcq');
  const nvqPicks = subjectPicks.filter((p) => p._qType === 'nvq');

  audit.nvq = {
    target: JEE_MAIN_PAPER.nvqPerSubject,
    actual: nvqPicks.length,
    shortfall: Math.max(0, JEE_MAIN_PAPER.nvqPerSubject - nvqPicks.length),
  };
  audit.mcqCount = mcqPicks.length;
  audit.nvqCount = nvqPicks.length;
  audit.total = subjectPicks.length;
  audit.errors = errors;

  const diffActual = { easy: 0, medium: 0, hard: 0 };
  subjectPicks.forEach((p) => {
    diffActual[normalizeDifficulty(p.difficulty)] += 1;
  });
  audit.difficulty = {
    target: { ...JEE_MAIN_PAPER.difficultyTargets },
    actual: diffActual,
  };

  const ok =
    errors.length === 0 &&
    mcqPicks.length === JEE_MAIN_PAPER.mcqPerSubject &&
    nvqPicks.length === JEE_MAIN_PAPER.nvqPerSubject &&
    subjectPicks.length === 25;

  audit.ok = ok;

  mcqPicks.sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty));
  nvqPicks.sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty));
  const ordered = [...mcqPicks, ...nvqPicks];

  return {
    ok,
    picks: ordered,
    audit,
    dayIndex,
    subject: bp.label,
  };
}

/**
 * Preview full paper (all 3 subjects). Fails closed if any subject fails.
 */
export async function previewJeeMainPaper({
  excludedIds = [],
  dayIndex = istDayIndex(getIstCalendarDate()),
} = {}) {
  const used = [...excludedIds.map(String)];
  const subjects = [];
  const allPicks = [];
  let ok = true;

  for (const name of JEE_MAIN_PAPER.subjects) {
    const result = await previewJeeMainSubject({
      subject: name,
      excludedIds: used,
      dayIndex,
    });
    subjects.push(result);
    if (!result.ok) ok = false;
    result.picks.forEach((p) => {
      used.push(String(p._id));
      allPicks.push(p);
    });
  }

  return {
    ok,
    picks: ok ? allPicks : [],
    subjects,
    dayIndex,
    paper: { ...JEE_MAIN_PAPER },
  };
}

function mapPickToTestQuestion(pick, order) {
  return {
    question_id: pick._id,
    question_order: order,
    subject: pick.subject || 'Unknown',
    topic: pick.topic || pick.chapter || '',
    difficulty: normalizeDifficulty(pick.difficulty),
  };
}

/**
 * Create a JEE Main mock from picks (must be 75). Re-validates counts.
 */
export async function createJeeMainMockFromPicks({
  picks,
  name,
  createdBy = 'admin',
  addToMotdPool = false,
} = {}) {
  if (!Array.isArray(picks) || picks.length !== JEE_MAIN_PAPER.totalQuestions) {
    throw new Error(
      `Expected ${JEE_MAIN_PAPER.totalQuestions} questions, got ${picks?.length || 0}`
    );
  }

  const ids = picks.map((p) => String(p._id || p.question_id));
  if (new Set(ids).size !== ids.length) {
    throw new Error('Duplicate question IDs in pick set');
  }

  const supabase = getSupabaseAdmin();
  const istDate = getIstCalendarDate();
  const testPayload = {
    name: name || `JEE Main Full Mock · ${istDate}`,
    description: `JEE Main blueprint mock (75Q, 180 min, +4/−1). creation_mode=${JEE_MAIN_CREATION_MODE}.`,
    duration: JEE_MAIN_PAPER.durationMinutes,
    total_questions: JEE_MAIN_PAPER.totalQuestions,
    difficulty: 'mixed',
    category: 'JEE-MAIN',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: JEE_MAIN_CREATION_MODE,
  };

  const { data: savedTest, error: testError } = await insertWithSchemaFallback(
    supabase,
    'mock_tests',
    testPayload
  );

  if (testError || !savedTest?.id) {
    throw new Error(testError?.message || 'Failed to create mock test');
  }

  const rows = picks.map((p, index) => mapPickToTestQuestion(p, index + 1));

  const { error: qErr } = await supabase.from('mock_test_questions').insert(
    rows.map((r) => ({ ...r, test_id: savedTest.id }))
  );

  if (qErr) {
    await supabase.from('mock_tests').delete().eq('id', savedTest.id);
    throw new Error(`Failed to save questions: ${qErr.message}`);
  }

  let poolItem = null;
  let poolError = null;
  if (addToMotdPool) {
    const poolResult = await addMockToMotdPool({
      examCategory: JEE_MAIN_SLUG,
      mockTestId: savedTest.id,
    });
    poolItem = poolResult.item;
    poolError = poolResult.error;
  }

  return { test: savedTest, questionCount: rows.length, poolItem, poolError };
}

/**
 * Generate full paper from bank and create mock (for cron / one-shot).
 */
export async function generateAndCreateJeeMainMock({
  createdBy = 'cron',
  addToMotdPool = true,
  excludedIds = [],
  name,
} = {}) {
  const preview = await previewJeeMainPaper({ excludedIds });
  if (!preview.ok) {
    return {
      ok: false,
      preview,
      test: null,
      error: 'Blueprint shortfall — see audit',
    };
  }

  const created = await createJeeMainMockFromPicks({
    picks: preview.picks,
    name,
    createdBy,
    addToMotdPool,
  });

  return { ok: true, preview, ...created };
}

/**
 * IDs already used in recent JEE blueprint mocks (to reduce reuse).
 */
export async function fetchRecentJeeBlueprintQuestionIds({ limitTests = 20 } = {}) {
  const supabase = getSupabaseAdmin();
  let { data: tests, error } = await supabase
    .from('mock_tests')
    .select('id, creation_mode')
    .eq('category', 'JEE-MAIN')
    .eq('creation_mode', JEE_MAIN_CREATION_MODE)
    .order('created_at', { ascending: false })
    .limit(limitTests);

  if (error && /creation_mode/i.test(error.message || '')) {
    tests = [];
  } else if (error) {
    throw new Error(error.message);
  }

  const ids = (tests || []).map((t) => t.id).filter(Boolean);
  if (!ids.length) return [];

  const { data: rows, error: qErr } = await supabase
    .from('mock_test_questions')
    .select('question_id')
    .in('test_id', ids);

  if (qErr) throw new Error(qErr.message);
  return [...new Set((rows || []).map((r) => String(r.question_id)).filter(Boolean))];
}

export async function pickRecycledJeeBlueprintMock() {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from('mock_tests')
    .select('id, name, description, duration, total_questions, difficulty, creation_mode, is_active, category')
    .eq('category', 'JEE-MAIN')
    .eq('creation_mode', JEE_MAIN_CREATION_MODE)
    .eq('is_active', true)
    .eq('total_questions', JEE_MAIN_PAPER.totalQuestions);

  if (error && /creation_mode/i.test(error.message || '')) {
    return null;
  }
  if (error) throw new Error(error.message);

  const list = data || [];
  if (!list.length) return null;
  shuffleInPlace(list);
  return list[0];
}

export { JEE_MAIN_SUBJECTS, JEE_MAIN_PAPER, JEE_MAIN_CREATION_MODE, JEE_MAIN_SLUG };
