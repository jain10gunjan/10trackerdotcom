import { categoryMatches, getCategoryVariants } from '@/lib/mockTestUtils';

/**
 * Load tests + completed attempts for a category (flexible category matching).
 */
export async function fetchLeaderboardData(supabase, examCategory, { testId = null, scope = 'overall' } = {}) {
  const { data: allTests, error: testsError } = await supabase
    .from('mock_tests')
    .select('id, name, category')
    .eq('is_active', true);

  if (testsError) throw testsError;

  const tests = (allTests || []).filter((t) => categoryMatches(t.category, examCategory));
  const testIds = tests.map((t) => t.id);
  const testNameById = Object.fromEntries(tests.map((t) => [t.id, t.name]));

  const { data: rawAttempts, error: attemptsError } = await supabase
    .from('user_test_attempts')
    .select(
      'id, test_id, user_email, percentage, score, duration_taken, submitted_at, started_at, examcategory'
    )
    .eq('is_completed', true)
    .limit(5000);

  if (attemptsError) throw attemptsError;

  const testIdSet = new Set(testIds);
  const categoryVariants = new Set(
    getCategoryVariants(examCategory).map((v) => String(v).toUpperCase().replace(/_/g, '-'))
  );

  let attempts = (rawAttempts || []).filter((a) => {
    if (!a?.test_id) return false;
    if (testIdSet.has(a.test_id)) return true;
    const ec = String(a.examcategory || '')
      .toUpperCase()
      .replace(/_/g, '-');
    if (ec && [...categoryVariants].some((v) => ec === v || categoryMatches(ec, examCategory))) {
      return true;
    }
    return false;
  });

  if (scope === 'test' && testId) {
    attempts = attempts.filter((a) => a.test_id === testId);
  }

  return {
    tests,
    testIds,
    testNameById,
    attempts,
    meta: {
      testsInCategory: tests.length,
      completedAttempts: attempts.length,
    },
  };
}
