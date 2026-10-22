/**
 * Bank-only VITEEE paper picker.
 * Prefers examtracker rows in the VITEEE category, then JEE Main for PCM
 * and general aptitude for Aptitude/English. Chapter shortfalls block creation.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool, getIstCalendarDate, istDayIndex } from '@/features/mock-test/lib/mockOfTheDay';
import {
  VITEEE_CREATION_MODE,
  VITEEE_INSTRUCTIONS,
  VITEEE_PAPER,
  VITEEE_SLUG,
  VITEEE_STRATEGY,
  VITEEE_SUBJECTS,
  getViteeeSubjectBlueprint,
  normalizeViteeeToken,
  resolveViteeeSlotAliases,
  subjectMatchesViteee,
} from '@/features/mock-test/lib/viteeeBlueprint';

const BANK_SELECT =
  '_id, subject, chapter, chapter_slug, topic, difficulty, category, options_A, options_B, options_C, options_D';

const SUBJECT_FILTERS = {
  Mathematics: ['%math%'],
  Physics: ['%phys%'],
  Chemistry: ['%chem%'],
  Aptitude: ['%aptitude%', '%reason%', '%quant%'],
  English: ['%english%', '%verbal%', '%grammar%', '%aptitude%'],
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeViteeeDifficulty(value) {
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
  return [row.chapter, row.chapter_slug, row.topic].map(normalizeViteeeToken).filter(Boolean);
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
  const category = normalizeViteeeToken(row.category);
  return category.includes('viteee') || category === 'vit-eee' || category === 'vit';
}

async function fetchFilter(categories, subjectLike) {
  const supabase = getSupabaseAdmin();
  const variants = [...new Set(categories.flatMap((slug) => getCategoryVariants(slug)))];
  const rows = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('examtracker')
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

export async function fetchViteeeSubjectBank(subjectLabel) {
  const bp = getViteeeSubjectBlueprint(subjectLabel);
  if (!bp) return [];
  const filters = SUBJECT_FILTERS[bp.label] || [`%${bp.label}%`];
  const seen = new Set();
  const merged = [];
  for (const filter of filters) {
    const rows = await fetchFilter(bp.bankCategories, filter);
    for (const row of rows) {
      const id = String(row._id || '').trim();
      if (!id || seen.has(id) || !isFourOptionMcq(row)) continue;
      if (!subjectMatchesViteee(row.subject, bp.label)) continue;
      seen.add(id);
      merged.push(row);
    }
  }
  return merged;
}

export async function fetchViteeeBank() {
  const all = [];
  const seen = new Set();
  for (const bp of Object.values(VITEEE_SUBJECTS)) {
    const rows = await fetchViteeeSubjectBank(bp.label);
    for (const row of rows) {
      const id = String(row._id);
      if (seen.has(id)) continue;
      seen.add(id);
      all.push(row);
    }
  }
  return all;
}

function pickFromPool(pool, count, usedIds) {
  const available = pool.filter((row) => !usedIds.has(String(row._id)));
  if (available.length < count) {
    return { picks: [], shortfall: count - available.length, available: available.length };
  }
  const preferred = available.filter(isPreferredCategory);
  const rest = available.filter((row) => !isPreferredCategory(row));
  shuffleInPlace(preferred);
  shuffleInPlace(rest);
  const picks = [...preferred, ...rest].slice(0, count);
  picks.forEach((row) => usedIds.add(String(row._id)));
  return { picks, shortfall: 0, available: available.length };
}

function difficultyCounts(picks) {
  const actual = { easy: 0, medium: 0, hard: 0 };
  picks.forEach((row) => {
    actual[normalizeViteeeDifficulty(row.difficulty)] += 1;
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
      if (normalizeViteeeDifficulty(picks[i].difficulty) !== over) continue;
      const pool = slotPools[picks[i]._blueprintKey] || [];
      const preferred = pool.filter(
        (row) => !usedIds.has(String(row._id)) && normalizeViteeeDifficulty(row.difficulty) === under && isPreferredCategory(row)
      );
      const rest = pool.filter(
        (row) => !usedIds.has(String(row._id)) && normalizeViteeeDifficulty(row.difficulty) === under && !isPreferredCategory(row)
      );
      const alt = preferred[0] || rest[0];
      if (!alt) continue;
      usedIds.delete(String(picks[i]._id));
      usedIds.add(String(alt._id));
      picks[i] = {
        ...alt,
        _blueprintKey: picks[i]._blueprintKey,
        _slotLabel: picks[i]._slotLabel,
      };
      swapped = true;
      break;
    }
    if (!swapped) break;
  }
}

function emptyAudit(subject, count) {
  const target = VITEEE_PAPER.difficultyTargets[subject] || { easy: 0, medium: 0, hard: 0 };
  return {
    subject,
    ok: false,
    chapterRows: [],
    difficulty: { target: { ...target }, actual: { easy: 0, medium: 0, hard: 0 } },
    total: 0,
    target: count,
    errors: [],
  };
}

export async function previewViteeeSubject({
  subject,
  bank = null,
  excludedIds = [],
  dayIndex = istDayIndex(getIstCalendarDate()),
} = {}) {
  const bp = getViteeeSubjectBlueprint(subject);
  if (!bp) {
    return {
      ok: false,
      subject,
      picks: [],
      audit: { ...emptyAudit(subject, 0), errors: [`Unknown subject: ${subject}`] },
      dayIndex,
    };
  }

  const rows = (bank || (await fetchViteeeSubjectBank(bp.label))).filter((row) =>
    subjectMatchesViteee(row.subject, bp.label)
  );
  const usedIds = new Set((excludedIds || []).map(String));
  const audit = emptyAudit(bp.label, bp.count);
  const errors = [];
  const slotPools = {};
  const subjectPicks = [];

  for (const slotDef of bp.slots) {
    const aliases = resolveViteeeSlotAliases(slotDef, dayIndex);
    const pool = rows.filter((row) => rowMatchesAliases(row, aliases));
    slotPools[slotDef.key] = pool;
    const { picks, shortfall, available } = pickFromPool(pool, slotDef.count, usedIds);
    const tagged = picks.map((row) => ({
      ...row,
      _blueprintKey: slotDef.key,
      _slotLabel: slotDef.label,
    }));
    subjectPicks.push(...tagged);
    audit.chapterRows.push({
      key: slotDef.key,
      label: slotDef.label,
      target: slotDef.count,
      actual: tagged.length,
      available,
      shortfall,
      aliases,
    });
    if (shortfall > 0) {
      errors.push(`${slotDef.label}: need ${slotDef.count}, bank has ${available} four-option MCQs`);
    }
  }

  const target = VITEEE_PAPER.difficultyTargets[bp.label];
  if (target && errors.length === 0) {
    balanceDifficulty(subjectPicks, slotPools, target, usedIds);
  }

  audit.difficulty.actual = difficultyCounts(subjectPicks);
  audit.total = subjectPicks.length;
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

export async function previewViteeePaper({ excludedIds = [], dayIndex } = {}) {
  const used = [...(excludedIds || [])];
  const subjects = [];
  const picks = [];
  for (const bp of Object.values(VITEEE_SUBJECTS).sort((a, b) => a.order - b.order)) {
    const result = await previewViteeeSubject({
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
    ok: subjects.every((subject) => subject.ok) && picks.length === VITEEE_PAPER.totalQuestions,
    subjects,
    picks,
    dayIndex: dayIndex ?? istDayIndex(getIstCalendarDate()),
  };
}

export async function createViteeeMockFromPicks({
  picks,
  name,
  createdBy = 'admin',
  addToMotdPool = false,
} = {}) {
  if (!Array.isArray(picks) || picks.length !== VITEEE_PAPER.totalQuestions) {
    throw new Error(`Expected ${VITEEE_PAPER.totalQuestions} questions, got ${picks?.length || 0}`);
  }
  const ids = picks.map((pick) => String(pick._id || pick.question_id));
  if (new Set(ids).size !== ids.length) {
    throw new Error('Duplicate question IDs in pick set');
  }

  const supabase = getSupabaseAdmin();
  const istDate = getIstCalendarDate();
  const testPayload = {
    name: name || `VITEEE Full Mock · ${istDate}`,
    description: `${VITEEE_INSTRUCTIONS} ${VITEEE_STRATEGY} 125Q, 150 min, 500 marks. creation_mode=${VITEEE_CREATION_MODE}.`,
    duration: VITEEE_PAPER.durationMinutes,
    total_questions: VITEEE_PAPER.totalQuestions,
    difficulty: 'mixed',
    category: 'VITEEE',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: VITEEE_CREATION_MODE,
  };

  const { data: savedTest, error: testError } = await insertWithSchemaFallback(
    supabase,
    'mock_tests',
    testPayload
  );
  if (testError || !savedTest?.id) {
    throw new Error(testError?.message || 'Failed to create mock test');
  }

  const rows = picks.map((pick, index) => ({
    test_id: savedTest.id,
    question_id: pick._id,
    question_order: index + 1,
    subject: pick.subject || 'Unknown',
    topic: pick.topic || pick.chapter || '',
    difficulty: normalizeViteeeDifficulty(pick.difficulty),
  }));
  const { error: qErr } = await supabase.from('mock_test_questions').insert(rows);
  if (qErr) {
    await supabase.from('mock_tests').delete().eq('id', savedTest.id);
    throw new Error(`Failed to save questions: ${qErr.message}`);
  }

  let poolItem = null;
  let poolError = null;
  if (addToMotdPool) {
    const poolResult = await addMockToMotdPool({
      examCategory: VITEEE_SLUG,
      mockTestId: savedTest.id,
    });
    poolItem = poolResult.item;
    poolError = poolResult.error;
  }

  return { test: savedTest, questionCount: rows.length, poolItem, poolError };
}

export async function generateAndCreateViteeeMock({
  createdBy = 'cron',
  addToMotdPool = true,
  excludedIds = [],
  name,
} = {}) {
  const preview = await previewViteeePaper({ excludedIds });
  if (!preview.ok) {
    return { ok: false, preview, test: null, error: 'Blueprint shortfall — see audit' };
  }
  const created = await createViteeeMockFromPicks({
    picks: preview.picks,
    name,
    createdBy,
    addToMotdPool,
  });
  return { ok: true, preview, ...created };
}

export async function fetchRecentViteeeBlueprintQuestionIds({ limitTests = 15 } = {}) {
  const supabase = getSupabaseAdmin();
  let { data: tests, error } = await supabase
    .from('mock_tests')
    .select('id, creation_mode')
    .eq('category', 'VITEEE')
    .eq('creation_mode', VITEEE_CREATION_MODE)
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

export async function pickRecycledViteeeBlueprintMock() {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from('mock_tests')
    .select('id, name, description, duration, total_questions, difficulty, creation_mode, is_active, category')
    .eq('category', 'VITEEE')
    .eq('creation_mode', VITEEE_CREATION_MODE)
    .eq('is_active', true)
    .eq('total_questions', VITEEE_PAPER.totalQuestions);
  if (error && /creation_mode/i.test(error.message || '')) return null;
  if (error) throw new Error(error.message);
  const list = data || [];
  if (!list.length) return null;
  shuffleInPlace(list);
  return list[0];
}
