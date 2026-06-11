import {
  categoryMatches,
  fetchActiveMockTests,
  getCategoryVariants,
} from '@/lib/mockTestUtils';

const ATTEMPT_COLUMNS =
  'id, test_id, user_email, percentage, score, duration_taken, submitted_at, started_at, examcategory';

function dedupeAttempts(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function filterAttemptsForCategory(attempts, examCategory, testIdSet) {
  const categoryVariants = new Set(
    getCategoryVariants(examCategory).map((v) => String(v).toUpperCase().replace(/_/g, '-'))
  );

  return (attempts || []).filter((a) => {
    if (!a?.test_id && !a?.examcategory) return false;
    if (testIdSet.has(a.test_id)) return true;
    const ec = String(a.examcategory || '')
      .toUpperCase()
      .replace(/_/g, '-');
    if (!ec) return false;
    return [...categoryVariants].some((v) => ec === v || categoryMatches(ec, examCategory));
  });
}

/**
 * Load tests + completed attempts for a category (DB-filtered, not full-table scans).
 */
export async function fetchLeaderboardData(
  supabase,
  examCategory,
  { testId = null, scope = 'overall' } = {}
) {
  const { data: tests, error: testsError } = await fetchActiveMockTests(supabase, examCategory);
  if (testsError) throw testsError;

  const testRows = tests || [];
  const testIds = testRows.map((t) => t.id);
  const testIdSet = new Set(testIds);
  const testNameById = Object.fromEntries(testRows.map((t) => [t.id, t.name]));
  const variants = getCategoryVariants(examCategory);

  const attemptQueries = [];

  if (scope === 'test' && testId) {
    attemptQueries.push(
      supabase
        .from('user_test_attempts')
        .select(ATTEMPT_COLUMNS)
        .eq('is_completed', true)
        .eq('test_id', testId)
        .limit(2000)
    );
  } else {
    if (testIds.length > 0) {
      attemptQueries.push(
        supabase
          .from('user_test_attempts')
          .select(ATTEMPT_COLUMNS)
          .eq('is_completed', true)
          .in('test_id', testIds)
          .limit(3000)
      );
    }

    if (variants.length > 0) {
      attemptQueries.push(
        supabase
          .from('user_test_attempts')
          .select(ATTEMPT_COLUMNS)
          .eq('is_completed', true)
          .in('examcategory', variants)
          .limit(2000)
      );
    }
  }

  let rawAttempts = [];
  if (attemptQueries.length) {
    const results = await Promise.all(attemptQueries);
    for (const res of results) {
      if (res.error) throw res.error;
      rawAttempts = rawAttempts.concat(res.data || []);
    }
    rawAttempts = dedupeAttempts(rawAttempts);
  }

  let attempts = filterAttemptsForCategory(rawAttempts, examCategory, testIdSet);

  if (scope === 'test' && testId) {
    attempts = attempts.filter((a) => a.test_id === testId);
  }

  return {
    tests: testRows,
    testIds,
    testNameById,
    attempts,
    meta: {
      testsInCategory: testRows.length,
      completedAttempts: attempts.length,
    },
  };
}
