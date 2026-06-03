import { getCategoryVariants } from '@/lib/mockTestUtils';
import { getSupabaseServer } from '@/lib/supabaseServer';

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
