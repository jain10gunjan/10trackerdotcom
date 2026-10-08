import {
  getCategoryVariants,
  categoryMatches,
} from '@/features/mock-test/lib/mockTestUtils';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import { mockTestHrefForSlug, formatExamSlug } from '@/lib/platformExams';

export const MOTD_DEFAULTS = {
  totalQuestions: 30,
  duration: 45,
  difficulty: 'mixed',
};

export const MOTD_CREATION_MODE = 'motd_pool';

export const MOTD_SETUP_HINT =
  'Run supabase/migrations/add_mock_of_day_pool.sql and supabase/migrations/add_mock_tests_creation_mode.sql in Supabase SQL Editor';

const MOCK_EMBED_WITH_MODE =
  'id, name, description, duration, total_questions, difficulty, creation_mode, is_active, category';
const MOCK_EMBED_BASE =
  'id, name, description, duration, total_questions, difficulty, is_active, category';

/** Calendar date in Asia/Kolkata as YYYY-MM-DD */
export function getIstCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) {
    return now.toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}

/** Stable day index from IST calendar date (UTC midnight of that Y-M-D). */
export function istDayIndex(dateStr = getIstCalendarDate()) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function normalizeMotdExamSlug(examCategory) {
  return normalizeCategorySlug(examCategory) || String(examCategory || '').trim().toLowerCase();
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mapPoolMockCard(test, examSlug) {
  if (!test) return null;
  return {
    id: test.id,
    name: test.name,
    description: test.description || '',
    duration: test.duration,
    totalQuestions: test.total_questions,
    difficulty: test.difficulty,
    creationMode: test.creation_mode || null,
    href: `/mock-test/${examSlug}/attempt/${test.id}`,
    isActive: test.is_active !== false,
  };
}

function isMissingPoolTable(error) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /relation ["']?mock_of_day_pool["']? does not exist/i.test(error.message || '') ||
    (/mock_of_day_pool/i.test(error.message || '') &&
      /does not exist|schema cache/i.test(error.message || ''))
  );
}

function isMissingCreationMode(error) {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    /creation_mode/i.test(error.message || '')
  );
}

function unwrapMock(row) {
  if (!row) return null;
  return Array.isArray(row.mock_tests) ? row.mock_tests[0] : row.mock_tests;
}

async function selectPoolWithMocks(supabase, { slug, activeOnly = false }) {
  const run = (embed) => {
    let q = supabase
      .from('mock_of_day_pool')
      .select(
        `id, exam_category, mock_test_id, is_active, sort_order, created_at, mock_tests(${embed})`
      )
      .eq('exam_category', slug)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (activeOnly) q = q.eq('is_active', true);
    return q;
  };

  let response = await run(MOCK_EMBED_WITH_MODE);
  if (response.error && isMissingCreationMode(response.error)) {
    response = await run(MOCK_EMBED_BASE);
  }
  return response;
}

/**
 * List pool rows for an exam (admin), joined with mock metadata.
 */
export async function listMotdPool(examCategory) {
  const slug = normalizeMotdExamSlug(examCategory);
  const supabase = getSupabaseAdmin();

  const { data, error } = await selectPoolWithMocks(supabase, { slug, activeOnly: false });

  if (error) {
    if (isMissingPoolTable(error)) {
      return { items: [], setupRequired: true, error, setupHint: MOTD_SETUP_HINT };
    }
    if (isMissingCreationMode(error)) {
      return {
        items: [],
        setupRequired: true,
        error,
        setupHint:
          'Run supabase/migrations/add_mock_tests_creation_mode.sql in Supabase SQL Editor',
      };
    }
    return { items: [], setupRequired: false, error };
  }

  const items = (data || []).map((row) => {
    const test = unwrapMock(row);
    return {
      id: row.id,
      examCategory: row.exam_category,
      mockTestId: row.mock_test_id,
      isActive: Boolean(row.is_active),
      sortOrder: row.sort_order ?? 0,
      createdAt: row.created_at,
      mock: mapPoolMockCard(test, slug),
    };
  });

  return { items, setupRequired: false, error: null };
}

/**
 * Resolve today's Mock of the Day for an exam (deterministic IST rotation).
 */
export async function resolveMockOfTheDay(examCategory, now = new Date()) {
  const slug = normalizeMotdExamSlug(examCategory);
  const date = getIstCalendarDate(now);
  const comingSoon = {
    status: 'coming_soon',
    title: 'Mock of the day',
    description:
      'A fresh daily mock curated for your exam — launching soon. Stay tuned.',
    date,
  };

  if (!slug) return comingSoon;

  const supabase = getSupabaseAdmin();
  const { data, error } = await selectPoolWithMocks(supabase, { slug, activeOnly: true });

  if (error) {
    if (!isMissingPoolTable(error)) {
      console.error('resolveMockOfTheDay', slug, error);
    }
    return comingSoon;
  }

  const active = (data || []).filter((row) => {
    const test = unwrapMock(row);
    return test && test.is_active !== false;
  });

  if (!active.length) return comingSoon;

  const index = istDayIndex(date) % active.length;
  const chosen = active[index];
  const test = unwrapMock(chosen);
  const mock = mapPoolMockCard(test, slug);

  return {
    status: 'ready',
    title: 'Mock of the day',
    description: mock?.description || `Today’s curated mock for ${formatExamSlug(slug)}.`,
    date,
    mock,
    poolSize: active.length,
    poolIndex: index,
  };
}

async function fetchBankQuestions({ examSlug, totalQuestions, difficulty }) {
  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(examSlug);
  const limit = Math.min(Math.max(Number(totalQuestions) || MOTD_DEFAULTS.totalQuestions, 5), 200);
  const diff = String(difficulty || 'mixed').toLowerCase();

  const fetchLimit = Math.min(limit * 8, 800);

  let query = supabase
    .from('examtracker')
    .select('_id, subject, topic, difficulty, category')
    .in('category', variants)
    .limit(fetchLimit);

  if (diff && diff !== 'mixed' && diff !== 'all') {
    query = query.eq('difficulty', diff);
  }

  let { data, error } = await query;

  if (error || !data?.length) {
    for (const variant of variants) {
      let q = supabase
        .from('examtracker')
        .select('_id, subject, topic, difficulty, category')
        .eq('category', variant)
        .limit(fetchLimit);
      if (diff && diff !== 'mixed' && diff !== 'all') {
        q = q.eq('difficulty', diff);
      }
      const res = await q;
      if (!res.error && res.data?.length) {
        data = res.data;
        error = null;
        break;
      }
    }
  }

  if (error) {
    throw new Error(error.message || 'Failed to fetch question bank');
  }

  const rows = (data || []).filter((q) => q?._id);
  if (!rows.length) {
    throw new Error('No questions found in the bank for this exam category');
  }

  shuffleInPlace(rows);
  const picked = rows.slice(0, limit);
  if (picked.length < 5) {
    throw new Error(
      `Only ${picked.length} questions available; need at least 5 to generate a mock`
    );
  }

  return picked;
}

/**
 * One-click: create a mock from the bank and add it to the MOTD pool.
 */
export async function generateMotdMock({
  examCategory,
  totalQuestions = MOTD_DEFAULTS.totalQuestions,
  duration = MOTD_DEFAULTS.duration,
  difficulty = MOTD_DEFAULTS.difficulty,
  createdBy = 'admin',
} = {}) {
  const slug = normalizeMotdExamSlug(examCategory);
  if (!slug) {
    throw new Error('examCategory is required');
  }

  const qCount = Math.min(
    Math.max(Number(totalQuestions) || MOTD_DEFAULTS.totalQuestions, 5),
    200
  );
  const mins = Math.min(Math.max(Number(duration) || MOTD_DEFAULTS.duration, 5), 300);
  const diff = ['easy', 'medium', 'hard', 'mixed'].includes(String(difficulty).toLowerCase())
    ? String(difficulty).toLowerCase()
    : MOTD_DEFAULTS.difficulty;

  const questions = await fetchBankQuestions({
    examSlug: slug,
    totalQuestions: qCount,
    difficulty: diff,
  });

  const supabase = getSupabaseAdmin();
  const category = getCategoryVariants(slug)[0] || slug.toUpperCase();
  const istDate = getIstCalendarDate();
  const examLabel = formatExamSlug(slug);

  // Description marker remains even if creation_mode column is missing.
  const testPayload = {
    name: `Mock of the Day · ${examLabel} · ${istDate}`,
    description: `Mock of the Day pool · Auto-generated for ${examLabel} (${questions.length} Qs, ${diff}).`,
    duration: mins,
    total_questions: questions.length,
    difficulty: diff,
    category,
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: MOTD_CREATION_MODE,
  };

  const { data: savedTest, error: testError } = await insertWithSchemaFallback(
    supabase,
    'mock_tests',
    testPayload
  );

  if (testError || !savedTest?.id) {
    const msg = testError?.message || 'Failed to create mock test';
    if (isMissingCreationMode(testError)) {
      throw new Error(
        `${msg}. Run supabase/migrations/add_mock_tests_creation_mode.sql in Supabase SQL Editor`
      );
    }
    throw new Error(msg);
  }

  const rows = questions.map((q, index) => ({
    test_id: savedTest.id,
    question_id: q._id,
    question_order: index + 1,
    subject: q.subject || 'Unknown',
    topic: q.topic || '',
    difficulty: q.difficulty || 'medium',
  }));

  const { error: questionsError } = await supabase.from('mock_test_questions').insert(rows);
  if (questionsError) {
    await supabase.from('mock_tests').delete().eq('id', savedTest.id);
    throw new Error(`Failed to save questions: ${questionsError.message}`);
  }

  const poolResult = await addMockToMotdPool({
    examCategory: slug,
    mockTestId: savedTest.id,
  });

  if (poolResult.error) {
    return {
      test: savedTest,
      questionCount: questions.length,
      poolItem: null,
      poolError: poolResult.error,
      setupRequired: poolResult.setupRequired,
      setupHint: poolResult.setupHint || MOTD_SETUP_HINT,
    };
  }

  return {
    test: savedTest,
    questionCount: questions.length,
    poolItem: poolResult.item,
    poolError: null,
    setupRequired: false,
  };
}

export async function addMockToMotdPool({ examCategory, mockTestId }) {
  const slug = normalizeMotdExamSlug(examCategory);
  const supabase = getSupabaseAdmin();

  let testRes = await supabase
    .from('mock_tests')
    .select('id, name, category, is_active, creation_mode')
    .eq('id', mockTestId)
    .maybeSingle();

  if (testRes.error && isMissingCreationMode(testRes.error)) {
    testRes = await supabase
      .from('mock_tests')
      .select('id, name, category, is_active')
      .eq('id', mockTestId)
      .maybeSingle();
  }

  const { data: test, error: testErr } = testRes;

  if (testErr || !test) {
    return {
      item: null,
      error: testErr || new Error('Mock test not found'),
      setupRequired: Boolean(testErr && isMissingCreationMode(testErr)),
      setupHint: testErr && isMissingCreationMode(testErr)
        ? 'Run supabase/migrations/add_mock_tests_creation_mode.sql in Supabase SQL Editor'
        : null,
    };
  }

  if (!categoryMatches(test.category, slug)) {
    return {
      item: null,
      error: new Error('Mock test category does not match this exam'),
      setupRequired: false,
    };
  }

  const { data: existing } = await supabase
    .from('mock_of_day_pool')
    .select('sort_order')
    .eq('exam_category', slug)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('mock_of_day_pool')
    .upsert(
      {
        exam_category: slug,
        mock_test_id: mockTestId,
        is_active: true,
        sort_order: nextOrder,
      },
      { onConflict: 'exam_category,mock_test_id' }
    )
    .select()
    .single();

  if (error) {
    return {
      item: null,
      error,
      setupRequired: isMissingPoolTable(error),
      setupHint: isMissingPoolTable(error) ? MOTD_SETUP_HINT : null,
    };
  }

  return { item: data, error: null, setupRequired: false };
}

export async function updateMotdPoolItem({ poolId, examCategory, is_active, sort_order }) {
  const slug = normalizeMotdExamSlug(examCategory);
  const supabase = getSupabaseAdmin();
  const patch = {};
  if (typeof is_active === 'boolean') patch.is_active = is_active;
  if (sort_order != null) patch.sort_order = Number(sort_order);

  const { data, error } = await supabase
    .from('mock_of_day_pool')
    .update(patch)
    .eq('id', poolId)
    .eq('exam_category', slug)
    .select()
    .single();

  if (error) {
    return {
      item: null,
      error,
      setupRequired: isMissingPoolTable(error),
      setupHint: isMissingPoolTable(error) ? MOTD_SETUP_HINT : null,
    };
  }
  return { item: data, error: null, setupRequired: false };
}

export async function removeMotdPoolItem({ poolId, examCategory }) {
  const slug = normalizeMotdExamSlug(examCategory);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('mock_of_day_pool')
    .delete()
    .eq('id', poolId)
    .eq('exam_category', slug);

  if (error) {
    return {
      error,
      setupRequired: isMissingPoolTable(error),
      setupHint: isMissingPoolTable(error) ? MOTD_SETUP_HINT : null,
    };
  }
  return { error: null, setupRequired: false };
}

export function isMotdCreationMode(mode, description = '', name = '') {
  if (
    String(mode || '')
      .toLowerCase()
      .includes('motd')
  ) {
    return true;
  }
  const desc = String(description || '').toLowerCase();
  if (desc.includes('mock of the day')) return true;
  const n = String(name || '').toLowerCase();
  return n.startsWith('mock of the day');
}

export function isMotdTest(test) {
  if (!test) return false;
  return isMotdCreationMode(test.creation_mode, test.description, test.name);
}

export { mockTestHrefForSlug };
