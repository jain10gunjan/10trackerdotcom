import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ADMIN_LIST_COLUMNS =
  'id, name, description, duration, total_questions, difficulty, category, created_at, is_active, created_by, creation_mode';

/** Admin list — includes inactive tests (requires service_role via getSupabaseAdmin). */
export async function fetchAdminMockTestsList(examCategory) {
  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(examCategory || 'gate-cse');

  let response = await supabase
    .from('mock_tests')
    .select(ADMIN_LIST_COLUMNS)
    .in('category', variants)
    .order('created_at', { ascending: false });

  if (
    response.error &&
    (response.error.code === 'PGRST204' ||
      /creation_mode/i.test(response.error.message || ''))
  ) {
    response = await supabase
      .from('mock_tests')
      .select(
        'id, name, description, duration, total_questions, difficulty, category, created_at, is_active, created_by'
      )
      .in('category', variants)
      .order('created_at', { ascending: false });
  }

  if (response.error) throw response.error;

  const rows = response.data || [];
  if (rows.length === 0) return [];

  const ids = rows.map((t) => t.id);
  const { data: attempts } = await supabase
    .from('user_test_attempts')
    .select('test_id')
    .in('test_id', ids)
    .eq('is_completed', true);

  const attemptCounts = (attempts || []).reduce((acc, row) => {
    if (row.test_id) acc[row.test_id] = (acc[row.test_id] || 0) + 1;
    return acc;
  }, {});

  return rows.map((test) => ({
    id: test.id,
    name: test.name,
    description: test.description,
    duration: test.duration,
    totalQuestions: test.total_questions,
    difficulty: test.difficulty,
    category: test.category,
    createdAt: test.created_at,
    isActive: test.is_active !== false,
    createdBy: test.created_by,
    creationMode: test.creation_mode ?? null,
    attemptCount: attemptCounts[test.id] || 0,
  }));
}

/** List active mock_tests for a category with completed attempt counts */
export async function fetchMockTestsForCategory(examCategory, { useServiceRole = false } = {}) {
  const supabase = getSupabaseServer(useServiceRole);
  const variants = getCategoryVariants(examCategory || 'gate-cse');

  const { data: tests, error } = await supabase
    .from('mock_tests')
    .select('id, name, description, duration, total_questions, difficulty, category, created_at, is_active, created_by')
    .eq('is_active', true)
    .in('category', variants)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = tests || [];
  if (rows.length === 0) return [];

  const ids = rows.map((t) => t.id);
  const { data: attempts } = await supabase
    .from('user_test_attempts')
    .select('test_id')
    .in('test_id', ids)
    .eq('is_completed', true);

  const attemptCounts = (attempts || []).reduce((acc, row) => {
    if (row.test_id) acc[row.test_id] = (acc[row.test_id] || 0) + 1;
    return acc;
  }, {});

  return rows.map((test) => ({
    id: test.id,
    name: test.name,
    description: test.description,
    totalQuestions: test.total_questions,
    duration: test.duration,
    difficulty: test.difficulty,
    category: test.category,
    createdAt: test.created_at,
    questionCount: test.total_questions,
    attemptCount: attemptCounts[test.id] || 0,
    isActive: test.is_active,
    created_by: test.created_by,
  }));
}

export function toLegacyGateTestShape(test) {
  return {
    id: test.id,
    name: test.name,
    description: test.description,
    totalQuestions: test.totalQuestions ?? test.questionCount,
    duration: test.duration,
    difficulty: test.difficulty,
    createdAt: test.createdAt,
    questionCount: test.questionCount ?? test.totalQuestions,
    attemptCount: test.attemptCount ?? 0,
    isActive: test.isActive !== false,
  };
}
