/**
 * Bank-only GATE CSE paper picker with fail-closed blueprint audit.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { hasPopulatedOptions } from '@/lib/questionAnswerMode';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool, getIstCalendarDate } from '@/features/mock-test/lib/mockOfTheDay';
import {
  GATE_CSE_BLOCKS,
  GATE_CSE_CREATION_MODE,
  GATE_CSE_PAPER,
  GATE_CSE_SLUG,
  encodeGateTopic,
  getGateBlock,
  listGateBlockIds,
  normalizeGateToken,
} from '@/features/mock-test/lib/gateCseBlueprint';

const BANK_SELECT =
  '_id, subject, chapter, chapter_slug, topic, difficulty, category, options_A, options_B, options_C, options_D';

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rowChapterTokens(row) {
  return [
    normalizeGateToken(row.chapter),
    normalizeGateToken(row.chapter_slug),
    normalizeGateToken(row.topic),
  ].filter(Boolean);
}

function rowSubjectToken(row) {
  return normalizeGateToken(row.subject);
}

function rowMatchesSubject(row, subjects) {
  if (!subjects?.length) return true;
  const rowSubj = rowSubjectToken(row);
  return subjects.some(
    (s) => rowSubj === s || rowSubj.includes(s) || s.includes(rowSubj)
  );
}

function rowMatchesAliases(row, aliases) {
  if (!aliases?.length) return false;
  const tokens = rowChapterTokens(row);
  return aliases.some(
    (a) => tokens.includes(a) || tokens.some((t) => t.includes(a) || a.includes(t))
  );
}

function slotMatchesRow(row, slot) {
  const subjects = (slot.subjects || []).map(normalizeGateToken);
  if (!rowMatchesSubject(row, subjects)) return false;

  const aliases = (slot.aliases || []).map(normalizeGateToken);
  if (!aliases.length) return true;

  // Subject-level pool (e.g. GA): aliases are the same as subjects
  if (aliases.every((a) => subjects.includes(a))) return true;

  return rowMatchesAliases(row, aliases);
}

function isMcqRow(row) {
  return hasPopulatedOptions(row);
}

async function fetchCategoryBank() {
  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(GATE_CSE_SLUG);
  const all = [];
  let from = 0;
  const page = 1000;

  while (true) {
    let { data, error } = await supabase
      .from('examtracker')
      .select(BANK_SELECT)
      .in('category', variants)
      .range(from, from + page - 1);

    if ((error || !data?.length) && from === 0 && !all.length) {
      const retry = await supabase
        .from('examtracker')
        .select(BANK_SELECT)
        .eq('category', 'GATE-CSE')
        .range(from, from + page - 1);
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message || 'Failed to load examtracker bank');
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
    from += page;
  }

  return all.filter((r) => r?._id);
}

let bankCache = null;
async function getBank() {
  if (!bankCache) bankCache = await fetchCategoryBank();
  return bankCache;
}

/** Clear cache between papers / tests */
export function clearGateBankCache() {
  bankCache = null;
}

function pickFromPool(pool, count, usedIds) {
  const available = pool.filter((r) => !usedIds.has(String(r._id)));
  if (available.length < count) {
    return {
      picks: [],
      shortfall: count - available.length,
      available: available.length,
    };
  }
  shuffleInPlace(available);
  const picks = available.slice(0, count);
  picks.forEach((p) => usedIds.add(String(p._id)));
  return { picks, shortfall: 0, available: available.length };
}

function emptyAudit(block) {
  return {
    blockId: block?.id,
    subject: block?.label,
    ok: false,
    slotRows: [],
    total: 0,
    target: 0,
    marks: 0,
    targetMarks: 0,
    errors: [],
  };
}

/**
 * Dry-run (or pick) one subject block.
 */
export async function previewGateCseBlock({ blockId, excludedIds = [] } = {}) {
  const block = getGateBlock(blockId);
  if (!block) {
    return {
      ok: false,
      picks: [],
      audit: {
        ...emptyAudit(null),
        errors: [`Unknown block: ${blockId}`],
      },
    };
  }

  const bank = await getBank();
  const usedIds = new Set((excludedIds || []).map(String));
  const audit = emptyAudit(block);
  const errors = [];
  const picks = [];

  let targetQ = 0;
  let targetMarks = 0;

  for (const slot of block.slots) {
    targetQ += slot.count;
    targetMarks += slot.count * slot.marks;
    const pool = bank.filter((r) => slotMatchesRow(r, slot));
    const { picks: slotPicks, shortfall, available } = pickFromPool(
      pool,
      slot.count,
      usedIds
    );

    audit.slotRows.push({
      key: slot.key,
      marks: slot.marks,
      target: slot.count,
      actual: slotPicks.length,
      available,
      aliases: slot.aliases,
      shortfall,
    });

    if (shortfall > 0) {
      errors.push(
        `${slot.key} (${slot.marks}m×${slot.count}): got ${slotPicks.length}, bank unused ${available}`
      );
    }

    for (const p of slotPicks) {
      picks.push({
        ...p,
        _blueprintKey: slot.key,
        _blockId: block.id,
        _marks: slot.marks,
        _qType: isMcqRow(p) ? 'mcq' : 'nat',
      });
    }
  }

  audit.target = targetQ;
  audit.targetMarks = targetMarks;
  audit.total = picks.length;
  audit.marks = picks.reduce((s, p) => s + (p._marks || 1), 0);
  audit.errors = errors;
  audit.ok = errors.length === 0 && picks.length === targetQ;

  return {
    ok: audit.ok,
    picks: audit.ok ? picks : [],
    audit,
    blockId: block.id,
    subject: block.label,
  };
}

/**
 * Preview full paper (all blocks). Fails closed if any block fails.
 */
export async function previewGateCsePaper({ excludedIds = [] } = {}) {
  clearGateBankCache();
  const used = [...excludedIds.map(String)];
  const blocks = [];
  const allPicks = [];
  let ok = true;

  for (const id of listGateBlockIds()) {
    const result = await previewGateCseBlock({
      blockId: id,
      excludedIds: used,
    });
    blocks.push(result);
    if (!result.ok) ok = false;
    result.picks.forEach((p) => {
      used.push(String(p._id));
      allPicks.push(p);
    });
  }

  return {
    ok,
    picks: ok ? allPicks : [],
    blocks,
    paper: { ...GATE_CSE_PAPER },
  };
}

function mapPickToTestQuestion(pick, order) {
  const marks = Number(pick._marks) === 2 ? 2 : 1;
  return {
    question_id: pick._id,
    question_order: order,
    subject: pick.subject || 'Unknown',
    topic: encodeGateTopic(marks, pick.topic || pick.chapter || ''),
    difficulty: pick.difficulty || 'medium',
  };
}

/**
 * Create GATE CSE mock from picks (must be 65). Stores mark weight in topic as gm1|/gm2|.
 */
export async function createGateCseMockFromPicks({
  picks,
  name,
  createdBy = 'admin',
  addToMotdPool = false,
} = {}) {
  if (!Array.isArray(picks) || picks.length !== GATE_CSE_PAPER.totalQuestions) {
    throw new Error(
      `Expected ${GATE_CSE_PAPER.totalQuestions} questions, got ${picks?.length || 0}`
    );
  }

  const ids = picks.map((p) => String(p._id || p.question_id));
  if (new Set(ids).size !== ids.length) {
    throw new Error('Duplicate question IDs in pick set');
  }

  const supabase = getSupabaseAdmin();
  const istDate = getIstCalendarDate();
  const questionMarks = {};
  picks.forEach((p) => {
    const id = String(p._id || p.question_id);
    questionMarks[id] = Number(p._marks) === 2 ? 2 : 1;
  });

  const testPayload = {
    name: name || `GATE CSE Full Mock · ${istDate}`,
    description: `GATE CSE blueprint mock (65Q, 180 min, 100 marks, +m/−m/3 MCQ). creation_mode=${GATE_CSE_CREATION_MODE}.`,
    duration: GATE_CSE_PAPER.durationMinutes,
    total_questions: GATE_CSE_PAPER.totalQuestions,
    difficulty: 'mixed',
    category: 'GATE-CSE',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: GATE_CSE_CREATION_MODE,
    weightage_config: {
      scheme: 'gate_weighted',
      maxMarks: GATE_CSE_PAPER.maxMarks,
      gateQuestionMarks: questionMarks,
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
      examCategory: GATE_CSE_SLUG,
      mockTestId: savedTest.id,
    });
    poolItem = poolResult.item;
    poolError = poolResult.error;
  }

  return { test: savedTest, questionCount: rows.length, poolItem, poolError };
}

export async function generateAndCreateGateCseMock({
  createdBy = 'cron',
  addToMotdPool = true,
  excludedIds = [],
  name,
} = {}) {
  const preview = await previewGateCsePaper({ excludedIds });
  if (!preview.ok) {
    return {
      ok: false,
      preview,
      test: null,
      error: 'Blueprint shortfall — see audit',
    };
  }

  const created = await createGateCseMockFromPicks({
    picks: preview.picks,
    name,
    createdBy,
    addToMotdPool,
  });

  return { ok: true, preview, ...created };
}

export async function fetchRecentGateBlueprintQuestionIds({ limitTests = 20 } = {}) {
  const supabase = getSupabaseAdmin();
  let { data: tests, error } = await supabase
    .from('mock_tests')
    .select('id, creation_mode')
    .eq('category', 'GATE-CSE')
    .eq('creation_mode', GATE_CSE_CREATION_MODE)
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

export async function pickRecycledGateBlueprintMock() {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from('mock_tests')
    .select(
      'id, name, description, duration, total_questions, difficulty, creation_mode, is_active, category'
    )
    .eq('category', 'GATE-CSE')
    .eq('creation_mode', GATE_CSE_CREATION_MODE)
    .eq('is_active', true)
    .eq('total_questions', GATE_CSE_PAPER.totalQuestions);

  if (error && /creation_mode/i.test(error.message || '')) {
    return null;
  }
  if (error) throw new Error(error.message);

  const list = data || [];
  if (!list.length) return null;
  shuffleInPlace(list);
  return list[0];
}

export { GATE_CSE_BLOCKS, GATE_CSE_PAPER, GATE_CSE_CREATION_MODE, GATE_CSE_SLUG };
