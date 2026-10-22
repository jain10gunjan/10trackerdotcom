/**
 * Bank-only MHT-CET paper picker. Questions come from mhcetquestions,
 * with examtracker rows in the MHT-CET category as a fallback.
 * Shortfalls on chapter counts block creation. Difficulty targets are soft.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { encodeGateTopic } from '@/features/mock-test/lib/gateCseBlueprint';
import { addMockToMotdPool, getIstCalendarDate, istDayIndex } from '@/features/mock-test/lib/mockOfTheDay';
import {
  MHT_CET_CREATION_MODE,
  MHT_CET_INSTRUCTIONS,
  MHT_CET_PAPER,
  MHT_CET_SLUG,
  MHT_CET_STRATEGY,
  MHT_CET_SUBJECTS,
  getMhtSubjectBlueprint,
  mhtCetMarksForSubject,
  normalizeMhtChapterToken,
  resolveMhtSlotAliases,
  subjectMatchesMht,
} from '@/features/mock-test/lib/mhtCetBlueprint';

const MHCET_SELECT =
  'id, subject, topic, difficulty, options_A, options_B, options_C, options_D';
const EXAM_SELECT =
  '_id, subject, chapter, chapter_slug, topic, difficulty, category, options_A, options_B, options_C, options_D';

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeMhtDifficulty(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase();
  if (!s) return 'medium';
  if (s === 'e' || s.startsWith('easy')) return 'easy';
  if (s === 'h' || s.startsWith('hard') || s.includes('difficult')) return 'hard';
  return 'medium';
}

function isFourOptionMcq(row) {
  return ['A', 'B', 'C', 'D'].every((letter) => String(row?.[`options_${letter}`] || '').trim());
}

function rowChapterTokens(row) {
  return [
    normalizeMhtChapterToken(row.chapter),
    normalizeMhtChapterToken(row.chapter_slug),
    normalizeMhtChapterToken(row.topic),
  ].filter(Boolean);
}

function rowMatchesAliases(row, aliases) {
  if (!aliases?.length) return false;
  const tokens = rowChapterTokens(row);
  return aliases.some((alias) =>
    tokens.some(
      (token) =>
        token === alias ||
        (alias.length >= 6 && token.endsWith(`-${alias}`)) ||
        (token.length >= 6 && alias.endsWith(`-${token}`))
    )
  );
}

function normalizeBankRow(row, source) {
  const id = String(row._id ?? row.id ?? '').trim();
  if (!id) return null;
  return {
    _id: id,
    subject: row.subject || '',
    chapter: row.chapter || row.topic || '',
    chapter_slug: row.chapter_slug || '',
    topic: row.topic || row.chapter || '',
    difficulty: row.difficulty || 'medium',
    options_A: row.options_A,
    options_B: row.options_B,
    options_C: row.options_C,
    options_D: row.options_D,
    _source: source,
  };
}

async function fetchAllPages(runPage) {
  const all = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await runPage(from, from + page - 1);
    if (error) throw new Error(error.message || 'Failed to load question bank');
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return all;
}

export async function fetchMhtCetBank() {
  const supabase = getSupabaseAdmin();
  const merged = [];
  const seen = new Set();

  try {
    const mhcetRows = await fetchAllPages((from, to) =>
      supabase.from('mhcetquestions').select(MHCET_SELECT).range(from, to)
    );
    for (const row of mhcetRows) {
      const normalized = normalizeBankRow(row, 'mhcetquestions');
      if (!normalized || seen.has(normalized._id)) continue;
      seen.add(normalized._id);
      merged.push(normalized);
    }
  } catch (err) {
    console.error('mht-cet mhcetquestions bank', err.message || err);
  }

  const variants = getCategoryVariants(MHT_CET_SLUG);
  try {
    const examRows = await fetchAllPages((from, to) =>
      supabase
        .from('examtracker')
        .select(EXAM_SELECT)
        .in('category', variants)
        .range(from, to)
    );
    for (const row of examRows) {
      const normalized = normalizeBankRow(row, 'examtracker');
      if (!normalized || seen.has(normalized._id)) continue;
      seen.add(normalized._id);
      merged.push(normalized);
    }
  } catch (err) {
    console.error('mht-cet examtracker bank', err.message || err);
  }

  return merged.filter((row) => isFourOptionMcq(row));
}

function pickFromPool(pool, count, usedIds) {
  const available = pool.filter((row) => !usedIds.has(String(row._id)));
  if (available.length < count) {
    return { picks: [], shortfall: count - available.length, available: available.length };
  }
  const candidates = [...available];
  shuffleInPlace(candidates);
  const picks = candidates.slice(0, count);
  picks.forEach((row) => usedIds.add(String(row._id)));
  return { picks, shortfall: 0, available: available.length };
}

function difficultyCounts(picks) {
  const actual = { easy: 0, medium: 0, hard: 0 };
  picks.forEach((row) => {
    actual[normalizeMhtDifficulty(row.difficulty)] += 1;
  });
  return actual;
}

function balanceDifficulty(picks, slotPools, target, usedIds) {
  const order = ['easy', 'medium', 'hard'];
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const actual = difficultyCounts(picks);
    const over = order.find((level) => actual[level] > target[level]);
    const under = order.find((level) => actual[level] < target[level]);
    if (!over || !under) break;

    let swapped = false;
    for (let i = 0; i < picks.length; i += 1) {
      if (normalizeMhtDifficulty(picks[i].difficulty) !== over) continue;
      const pool = slotPools[picks[i]._blueprintKey] || [];
      const alt = pool.find(
        (row) =>
          !usedIds.has(String(row._id)) && normalizeMhtDifficulty(row.difficulty) === under
      );
      if (!alt) continue;
      usedIds.delete(String(picks[i]._id));
      usedIds.add(String(alt._id));
      picks[i] = {
        ...alt,
        _blueprintKey: picks[i]._blueprintKey,
        _classLevel: picks[i]._classLevel,
        _marks: picks[i]._marks,
        _slotLabel: picks[i]._slotLabel,
      };
      swapped = true;
      break;
    }
    if (!swapped) break;
  }
}

function emptyAudit(subject) {
  const target = MHT_CET_PAPER.difficultyTargets[subject] || { easy: 0, medium: 0, hard: 0 };
  return {
    subject,
    ok: false,
    chapterRows: [],
    classSplit: {
      target: { class11: MHT_CET_PAPER.class11PerSubject, class12: MHT_CET_PAPER.class12PerSubject },
      actual: { class11: 0, class12: 0 },
    },
    difficulty: { target: { ...target }, actual: { easy: 0, medium: 0, hard: 0 } },
    total: 0,
    errors: [],
  };
}

/**
 * Pick one subject (50 MCQs) from the bank.
 * @param {{ subject: string, bank?: Array, excludedIds?: string[], dayIndex?: number }} opts
 */
export async function previewMhtCetSubject({
  subject,
  bank = null,
  excludedIds = [],
  dayIndex = istDayIndex(getIstCalendarDate()),
} = {}) {
  const bp = getMhtSubjectBlueprint(subject);
  if (!bp) {
    return {
      ok: false,
      subject,
      picks: [],
      audit: { ...emptyAudit(subject), errors: [`Unknown subject: ${subject}`] },
      dayIndex,
    };
  }

  const rows = bank || (await fetchMhtCetBank());
  const subjectBank = rows.filter((row) => subjectMatchesMht(row.subject, bp.label));
  const usedIds = new Set((excludedIds || []).map(String));
  const audit = emptyAudit(bp.label);
  const errors = [];
  const slotPools = {};
  const subjectPicks = [];

  for (const slotDef of bp.slots) {
    const aliases = resolveMhtSlotAliases(slotDef, dayIndex);
    const pool = subjectBank.filter((row) => rowMatchesAliases(row, aliases));
    slotPools[slotDef.key] = pool;
    const { picks, shortfall, available } = pickFromPool(pool, slotDef.count, usedIds);
    const tagged = picks.map((row) => ({
      ...row,
      _blueprintKey: slotDef.key,
      _slotLabel: slotDef.label,
      _classLevel: slotDef.classLevel,
      _marks: bp.marks,
    }));
    subjectPicks.push(...tagged);
    audit.chapterRows.push({
      key: slotDef.key,
      label: slotDef.label,
      classLevel: slotDef.classLevel,
      target: slotDef.count,
      actual: tagged.length,
      available,
      shortfall,
      aliases,
    });
    if (shortfall > 0) {
      errors.push(
        `${slotDef.label} (Class ${slotDef.classLevel}): need ${slotDef.count}, bank has ${available} four-option MCQs`
      );
    }
  }

  const target = MHT_CET_PAPER.difficultyTargets[bp.label];
  if (target && errors.length === 0) {
    balanceDifficulty(subjectPicks, slotPools, target, usedIds);
  }

  audit.difficulty.actual = difficultyCounts(subjectPicks);
  audit.classSplit.actual = {
    class11: subjectPicks.filter((row) => row._classLevel === 11).length,
    class12: subjectPicks.filter((row) => row._classLevel === 12).length,
  };
  audit.total = subjectPicks.length;
  if (subjectPicks.length !== MHT_CET_PAPER.questionsPerSubject && errors.length === 0) {
    errors.push(
      `${bp.label}: picked ${subjectPicks.length}, expected ${MHT_CET_PAPER.questionsPerSubject}`
    );
  }
  audit.errors = errors;
  audit.ok = errors.length === 0;

  return {
    ok: audit.ok,
    subject: bp.label,
    picks: audit.ok ? subjectPicks : [],
    audit,
    dayIndex,
  };
}

export async function previewMhtCetPaper({ excludedIds = [], dayIndex } = {}) {
  const bank = await fetchMhtCetBank();
  const used = [...(excludedIds || [])];
  const subjects = [];
  const picks = [];
  for (const bp of Object.values(MHT_CET_SUBJECTS).sort((a, b) => a.order - b.order)) {
    const result = await previewMhtCetSubject({
      subject: bp.label,
      bank,
      excludedIds: used,
      dayIndex,
    });
    subjects.push(result);
    if (result.ok) {
      picks.push(...result.picks);
      result.picks.forEach((row) => used.push(String(row._id)));
    }
  }
  return {
    ok: subjects.every((subject) => subject.ok) && picks.length === MHT_CET_PAPER.totalQuestions,
    subjects,
    picks,
    dayIndex: dayIndex ?? istDayIndex(getIstCalendarDate()),
  };
}

function mapPickToTestQuestion(pick, order) {
  const marks = Number(pick._marks) === 2 ? 2 : mhtCetMarksForSubject(pick.subject);
  return {
    question_id: pick._id,
    question_order: order,
    subject: pick.subject || 'Unknown',
    topic: encodeGateTopic(marks, pick.topic || pick.chapter || ''),
    difficulty: normalizeMhtDifficulty(pick.difficulty),
  };
}

export async function createMhtCetMockFromPicks({
  picks,
  name,
  createdBy = 'admin',
  addToMotdPool = false,
} = {}) {
  if (!Array.isArray(picks) || picks.length !== MHT_CET_PAPER.totalQuestions) {
    throw new Error(
      `Expected ${MHT_CET_PAPER.totalQuestions} questions, got ${picks?.length || 0}`
    );
  }

  const ids = picks.map((pick) => String(pick._id || pick.question_id));
  if (new Set(ids).size !== ids.length) {
    throw new Error('Duplicate question IDs in pick set');
  }

  const supabase = getSupabaseAdmin();
  const istDate = getIstCalendarDate();
  const questionMarks = {};
  picks.forEach((pick) => {
    const id = String(pick._id || pick.question_id);
    questionMarks[id] = Number(pick._marks) === 2 ? 2 : mhtCetMarksForSubject(pick.subject);
  });

  const testPayload = {
    name: name || `MHT-CET Full Mock · ${istDate}`,
    description: `${MHT_CET_INSTRUCTIONS} ${MHT_CET_STRATEGY} 150Q, 180 min, 200 marks. creation_mode=${MHT_CET_CREATION_MODE}.`,
    duration: MHT_CET_PAPER.durationMinutes,
    total_questions: MHT_CET_PAPER.totalQuestions,
    difficulty: 'mixed',
    category: 'MHT-CET',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: MHT_CET_CREATION_MODE,
    weightage_config: {
      scheme: 'mht_cet',
      maxMarks: MHT_CET_PAPER.maxMarks,
      negativeMarking: 0,
      mhtCetQuestionMarks: questionMarks,
    },
  };

  const { data: savedTest, error: testError } = await insertWithSchemaFallback(
    supabase,
    'mock_tests',
    testPayload
  );

  if (testError || !savedTest?.id) {
    throw new Error(testError?.message || 'Failed to create mock test');
  }

  const rows = picks.map((pick, index) => mapPickToTestQuestion(pick, index + 1));
  const { error: qErr } = await supabase.from('mock_test_questions').insert(
    rows.map((row) => ({ ...row, test_id: savedTest.id }))
  );

  if (qErr) {
    await supabase.from('mock_tests').delete().eq('id', savedTest.id);
    throw new Error(`Failed to save questions: ${qErr.message}`);
  }

  let poolItem = null;
  let poolError = null;
  if (addToMotdPool) {
    const poolResult = await addMockToMotdPool({
      examCategory: MHT_CET_SLUG,
      mockTestId: savedTest.id,
    });
    poolItem = poolResult.item;
    poolError = poolResult.error;
  }

  return { test: savedTest, questionCount: rows.length, poolItem, poolError };
}

export async function generateAndCreateMhtCetMock({
  createdBy = 'cron',
  addToMotdPool = true,
  excludedIds = [],
  name,
} = {}) {
  const preview = await previewMhtCetPaper({ excludedIds });
  if (!preview.ok) {
    return {
      ok: false,
      preview,
      test: null,
      error: 'Blueprint shortfall — see audit',
    };
  }

  const created = await createMhtCetMockFromPicks({
    picks: preview.picks,
    name,
    createdBy,
    addToMotdPool,
  });

  return { ok: true, preview, ...created };
}

export async function fetchRecentMhtBlueprintQuestionIds({ limitTests = 15 } = {}) {
  const supabase = getSupabaseAdmin();
  let { data: tests, error } = await supabase
    .from('mock_tests')
    .select('id, creation_mode')
    .eq('category', 'MHT-CET')
    .eq('creation_mode', MHT_CET_CREATION_MODE)
    .order('created_at', { ascending: false })
    .limit(limitTests);

  if (error && /creation_mode/i.test(error.message || '')) {
    tests = [];
  } else if (error) {
    throw new Error(error.message);
  }

  const ids = (tests || []).map((test) => test.id).filter(Boolean);
  if (!ids.length) return [];

  const { data: rows, error: qErr } = await supabase
    .from('mock_test_questions')
    .select('question_id')
    .in('test_id', ids);

  if (qErr) throw new Error(qErr.message);
  return [...new Set((rows || []).map((row) => String(row.question_id)).filter(Boolean))];
}

export async function pickRecycledMhtBlueprintMock() {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from('mock_tests')
    .select('id, name, description, duration, total_questions, difficulty, creation_mode, is_active, category')
    .eq('category', 'MHT-CET')
    .eq('creation_mode', MHT_CET_CREATION_MODE)
    .eq('is_active', true)
    .eq('total_questions', MHT_CET_PAPER.totalQuestions);

  if (error && /creation_mode/i.test(error.message || '')) return null;
  if (error) throw new Error(error.message);

  const list = data || [];
  if (!list.length) return null;
  shuffleInPlace(list);
  return list[0];
}
