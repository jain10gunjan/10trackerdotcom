/**
 * Bank-only CAT paper picker.
 * Prefers examtracker rows in the CAT category, then general aptitude,
 * and JEE Main for QA only. MCQ and TITA shortfalls block creation.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool, getIstCalendarDate, istDayIndex } from '@/features/mock-test/lib/mockOfTheDay';
import {
  CAT_CREATION_MODE,
  CAT_INSTRUCTIONS,
  CAT_PAPER,
  CAT_SECTIONS,
  CAT_SLUG,
  CAT_STRATEGY,
  CAT_SUBJECTS,
  getCatSubjectBlueprint,
  normalizeCatToken,
  subjectMatchesCat,
} from '@/features/mock-test/lib/catBlueprint';

const BANK_SELECT =
  '_id, subject, chapter, chapter_slug, topic, difficulty, category, options_A, options_B, options_C, options_D';

const SUBJECT_FILTERS = {
  VARC: ['%varc%', '%verbal%', '%english%', '%reading%'],
  DILR: ['%dilr%', '%data%', '%logical%', '%reason%', '%aptitude%'],
  QA: ['%quant%', '%math%', '%arithmetic%', '%algebra%', '%qa%'],
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeCatDifficulty(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase();
  if (!s) return 'medium';
  if (s === 'e' || s.startsWith('easy')) return 'easy';
  if (s === 'h' || s.startsWith('hard') || s.includes('difficult')) return 'hard';
  return 'medium';
}

export function isCatTitaRow(row) {
  return !['A', 'B', 'C', 'D'].some((letter) => String(row?.[`options_${letter}`] || '').trim());
}

function isCatMcqRow(row) {
  return ['A', 'B', 'C', 'D'].every((letter) => String(row?.[`options_${letter}`] || '').trim());
}

function rowChapterTokens(row) {
  return [row.chapter, row.chapter_slug, row.topic].map(normalizeCatToken).filter(Boolean);
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

function isPreferredCategory(row) {
  const category = normalizeCatToken(row.category);
  return category === 'cat' || category.startsWith('cat-') || category.endsWith('-cat');
}

async function fetchFilter(categories, subjectLike) {
  const supabase = getSupabaseAdmin();
  const variants = [...new Set(categories.flatMap((slug) => getCategoryVariants(slug)))];
  const rows = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('examtracker').or('verification_status.is.null,verification_status.not.in.(unpublished_draft,publish_rejected)')
      .select(BANK_SELECT)
      .in('category', variants)
      .ilike('subject', subjectLike)
      .range(from, from + page - 1);
    if (error) throw new Error(error.message || 'Failed to load examtracker bank');
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

export async function fetchCatSubjectBank(subjectLabel) {
  const bp = getCatSubjectBlueprint(subjectLabel);
  if (!bp) return [];
  const filters = SUBJECT_FILTERS[bp.label] || [`%${bp.label}%`];
  const seen = new Set();
  const merged = [];
  for (const filter of filters) {
    const rows = await fetchFilter(bp.bankCategories, filter);
    for (const row of rows) {
      const id = String(row._id || '').trim();
      if (!id || seen.has(id)) continue;
      if (!isCatMcqRow(row) && !isCatTitaRow(row)) continue;
      if (!subjectMatchesCat(row.subject, bp.label)) continue;
      seen.add(id);
      merged.push(row);
    }
  }
  return merged;
}

export async function fetchCatBank() {
  const all = [];
  const seen = new Set();
  for (const bp of Object.values(CAT_SUBJECTS)) {
    const rows = await fetchCatSubjectBank(bp.label);
    for (const row of rows) {
      const id = String(row._id);
      if (seen.has(id)) continue;
      seen.add(id);
      all.push(row);
    }
  }
  return all;
}

function pickTyped(pool, { count, tita, usedIds }) {
  const available = pool.filter((row) => !usedIds.has(String(row._id)));
  const titaNeed = Math.max(0, Number(tita) || 0);
  const mcqNeed = count - titaNeed;
  const titaRows = available.filter(isCatTitaRow);
  const mcqRows = available.filter(isCatMcqRow);
  if (titaRows.length < titaNeed || mcqRows.length < mcqNeed) {
    return {
      picks: [],
      shortfall: Math.max(0, titaNeed - titaRows.length) + Math.max(0, mcqNeed - mcqRows.length),
      available: available.length,
      availableTita: titaRows.length,
      availableMcq: mcqRows.length,
    };
  }
  const take = (rows, n) => {
    const preferred = rows.filter(isPreferredCategory);
    const rest = rows.filter((row) => !isPreferredCategory(row));
    shuffleInPlace(preferred);
    shuffleInPlace(rest);
    return [...preferred, ...rest].slice(0, n);
  };
  const titaPicks = take(titaRows, titaNeed).map((row) => ({ ...row, _isTita: true }));
  const mcqPicks = take(mcqRows, mcqNeed).map((row) => ({ ...row, _isTita: false }));
  const picks = [...mcqPicks, ...titaPicks];
  picks.forEach((row) => usedIds.add(String(row._id)));
  return {
    picks,
    shortfall: 0,
    available: available.length,
    availableTita: titaRows.length,
    availableMcq: mcqRows.length,
  };
}

function difficultyCounts(picks) {
  const actual = { easy: 0, medium: 0, hard: 0 };
  picks.forEach((row) => {
    actual[normalizeCatDifficulty(row.difficulty)] += 1;
  });
  return actual;
}

function balanceDifficulty(picks, slotPools, target, usedIds) {
  const order = ['easy', 'medium', 'hard'];
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const actual = difficultyCounts(picks);
    const over = order.find((level) => actual[level] > (target[level] || 0));
    const under = order.find((level) => actual[level] < (target[level] || 0));
    if (!over || !under) break;
    let swapped = false;
    for (let i = 0; i < picks.length; i += 1) {
      if (normalizeCatDifficulty(picks[i].difficulty) !== over) continue;
      const pool = slotPools[picks[i]._blueprintKey] || [];
      const wantTita = Boolean(picks[i]._isTita);
      const alt = pool.find(
        (row) =>
          !usedIds.has(String(row._id)) &&
          normalizeCatDifficulty(row.difficulty) === under &&
          isCatTitaRow(row) === wantTita
      );
      if (!alt) continue;
      usedIds.delete(String(picks[i]._id));
      usedIds.add(String(alt._id));
      picks[i] = {
        ...alt,
        _blueprintKey: picks[i]._blueprintKey,
        _slotLabel: picks[i]._slotLabel,
        _isTita: wantTita,
      };
      swapped = true;
      break;
    }
    if (!swapped) break;
  }
}

function emptyAudit(subject, count) {
  const target = CAT_PAPER.difficultyTargets[subject] || { easy: 0, medium: 0, hard: 0 };
  const types = CAT_PAPER.typeTargets[subject] || { mcq: 0, tita: 0 };
  return {
    subject,
    ok: false,
    chapterRows: [],
    difficulty: { target: { ...target }, actual: { easy: 0, medium: 0, hard: 0 } },
    types: { target: { ...types }, actual: { mcq: 0, tita: 0 } },
    total: 0,
    target: count,
    errors: [],
  };
}

export async function previewCatSubject({
  subject,
  bank = null,
  excludedIds = [],
  dayIndex = istDayIndex(getIstCalendarDate()),
} = {}) {
  const bp = getCatSubjectBlueprint(subject);
  if (!bp) {
    return {
      ok: false,
      subject,
      picks: [],
      audit: { ...emptyAudit(subject, 0), errors: [`Unknown subject: ${subject}`] },
      dayIndex,
    };
  }

  const rows = (bank || (await fetchCatSubjectBank(bp.label))).filter((row) =>
    subjectMatchesCat(row.subject, bp.label)
  );
  const usedIds = new Set((excludedIds || []).map(String));
  const audit = emptyAudit(bp.label, bp.count);
  const errors = [];
  const slotPools = {};
  const subjectPicks = [];

  for (const slotDef of bp.slots) {
    const aliases = (slotDef.aliases || []).map(normalizeCatToken);
    const pool = rows.filter((row) => rowMatchesAliases(row, aliases));
    slotPools[slotDef.key] = pool;
    const tita = Number(slotDef.tita) || 0;
    const picked = pickTyped(pool, { count: slotDef.count, tita, usedIds });
    const tagged = picked.picks.map((row) => ({
      ...row,
      _blueprintKey: slotDef.key,
      _slotLabel: slotDef.label,
      subject: bp.label,
    }));
    subjectPicks.push(...tagged);
    audit.chapterRows.push({
      key: slotDef.key,
      label: slotDef.label,
      group: slotDef.group || '',
      target: slotDef.count,
      tita,
      mcq: slotDef.count - tita,
      actual: tagged.length,
      available: picked.available,
      availableMcq: picked.availableMcq,
      availableTita: picked.availableTita,
      shortfall: picked.shortfall,
      aliases,
    });
    if (picked.shortfall > 0) {
      errors.push(
        `${slotDef.label}: need ${slotDef.count - tita} MCQ and ${tita} TITA, bank has ${picked.availableMcq} MCQ and ${picked.availableTita} TITA`
      );
    }
  }

  const target = CAT_PAPER.difficultyTargets[bp.label];
  if (target && errors.length === 0) {
    balanceDifficulty(subjectPicks, slotPools, target, usedIds);
  }

  const actualTypes = { mcq: 0, tita: 0 };
  subjectPicks.forEach((row) => {
    actualTypes[row._isTita ? 'tita' : 'mcq'] += 1;
  });
  audit.types.actual = actualTypes;
  audit.difficulty.actual = difficultyCounts(subjectPicks);
  audit.total = subjectPicks.length;
  const typeTarget = CAT_PAPER.typeTargets[bp.label];
  if (
    errors.length === 0 &&
    typeTarget &&
    (actualTypes.mcq !== typeTarget.mcq || actualTypes.tita !== typeTarget.tita)
  ) {
    errors.push(
      `${bp.label} picked ${actualTypes.mcq} MCQ / ${actualTypes.tita} TITA, expected ${typeTarget.mcq} / ${typeTarget.tita}`
    );
  }
  if (subjectPicks.length !== bp.count && errors.length === 0) {
    errors.push(`${bp.label}: picked ${subjectPicks.length}, expected ${bp.count}`);
  }
  audit.errors = errors;
  audit.ok = errors.length === 0;

  return {
    ok: audit.ok,
    subject: bp.label,
    count: bp.count,
    picks: audit.ok ? subjectPicks : [],
    audit,
    dayIndex,
  };
}

export async function previewCatPaper({ excludedIds = [], dayIndex } = {}) {
  const used = [...(excludedIds || [])];
  const subjects = [];
  const picks = [];
  for (const bp of Object.values(CAT_SUBJECTS).sort((a, b) => a.order - b.order)) {
    const result = await previewCatSubject({
      subject: bp.label,
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
    ok: subjects.every((subject) => subject.ok) && picks.length === CAT_PAPER.totalQuestions,
    subjects,
    picks,
    dayIndex: dayIndex ?? istDayIndex(getIstCalendarDate()),
  };
}

export async function createCatMockFromPicks({
  picks,
  name,
  createdBy = 'admin',
  addToMotdPool = false,
} = {}) {
  if (!Array.isArray(picks) || picks.length !== CAT_PAPER.totalQuestions) {
    throw new Error(`Expected ${CAT_PAPER.totalQuestions} questions, got ${picks?.length || 0}`);
  }
  const ids = picks.map((pick) => String(pick._id || pick.question_id));
  if (new Set(ids).size !== ids.length) {
    throw new Error('Duplicate question IDs in pick set');
  }

  const supabase = getSupabaseAdmin();
  const istDate = getIstCalendarDate();
  const testPayload = {
    name: name || `CAT Full Mock · ${istDate}`,
    description: `${CAT_INSTRUCTIONS} ${CAT_STRATEGY} 68Q, 120 min, 204 marks, sections 40-40-40. creation_mode=${CAT_CREATION_MODE}.`,
    duration: CAT_PAPER.durationMinutes,
    total_questions: CAT_PAPER.totalQuestions,
    difficulty: 'mixed',
    category: 'CAT',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: CAT_CREATION_MODE,
    weightage_config: {
      scheme: 'cat',
      maxMarks: CAT_PAPER.maxMarks,
      marksCorrect: 3,
      mcqWrong: -1,
      titaWrong: 0,
      sections: CAT_SECTIONS,
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

  const rows = picks.map((pick, index) => {
    const section = CAT_SECTIONS.find((item) => index >= item.start && index < item.end);
    return {
      test_id: savedTest.id,
      question_id: pick._id,
      question_order: index + 1,
      subject: section?.label || pick.subject || 'Unknown',
      topic: pick.topic || pick.chapter || '',
      difficulty: normalizeCatDifficulty(pick.difficulty),
    };
  });
  const { error: qErr } = await supabase.from('mock_test_questions').insert(rows);
  if (qErr) {
    await supabase.from('mock_tests').delete().eq('id', savedTest.id);
    throw new Error(`Failed to save questions: ${qErr.message}`);
  }

  let poolItem = null;
  let poolError = null;
  if (addToMotdPool) {
    const poolResult = await addMockToMotdPool({
      examCategory: CAT_SLUG,
      mockTestId: savedTest.id,
    });
    poolItem = poolResult.item;
    poolError = poolResult.error;
  }

  return { test: savedTest, questionCount: rows.length, poolItem, poolError };
}

export async function generateAndCreateCatMock({
  createdBy = 'cron',
  addToMotdPool = true,
  excludedIds = [],
  name,
} = {}) {
  const preview = await previewCatPaper({ excludedIds });
  if (!preview.ok) {
    return { ok: false, preview, test: null, error: 'Blueprint shortfall — see audit' };
  }
  const created = await createCatMockFromPicks({
    picks: preview.picks,
    name,
    createdBy,
    addToMotdPool,
  });
  return { ok: true, preview, ...created };
}

export async function fetchRecentCatBlueprintQuestionIds({ limitTests = 15 } = {}) {
  const supabase = getSupabaseAdmin();
  let { data: tests, error } = await supabase
    .from('mock_tests')
    .select('id, creation_mode')
    .eq('category', 'CAT')
    .eq('creation_mode', CAT_CREATION_MODE)
    .order('created_at', { ascending: false })
    .limit(limitTests);

  if (error && /creation_mode/i.test(error.message || '')) tests = [];
  else if (error) throw new Error(error.message);

  const ids = (tests || []).map((test) => test.id).filter(Boolean);
  if (!ids.length) return [];
  const { data: rows, error: qErr } = await supabase
    .from('mock_test_questions')
    .select('question_id')
    .in('test_id', ids);
  if (qErr) throw new Error(qErr.message);
  return [...new Set((rows || []).map((row) => String(row.question_id)).filter(Boolean))];
}

export async function pickRecycledCatBlueprintMock() {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from('mock_tests')
    .select('id, name, description, duration, total_questions, difficulty, creation_mode, is_active, category')
    .eq('category', 'CAT')
    .eq('creation_mode', CAT_CREATION_MODE)
    .eq('is_active', true)
    .eq('total_questions', CAT_PAPER.totalQuestions);
  if (error && /creation_mode/i.test(error.message || '')) return null;
  if (error) throw new Error(error.message);
  const list = data || [];
  if (!list.length) return null;
  shuffleInPlace(list);
  return list[0];
}
