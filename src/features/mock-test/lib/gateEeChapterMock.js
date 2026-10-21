/**
 * Admin: pick a GATE-EE examtracker chapter → random 20Q / 45 min mock.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool } from '@/features/mock-test/lib/mockOfTheDay';
import {
  GATE_EE_CHAPTER_CREATION_MODE,
  GATE_EE_SLUG,
  normalizeGateEeToken,
} from '@/features/mock-test/lib/gateEeBlueprint';

export const GATE_EE_CHAPTER_DEFAULTS = {
  totalQuestions: 20,
  durationMinutes: 45,
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function listGateEeChapters({ subject = null } = {}) {
  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(GATE_EE_SLUG);
  const counts = new Map();

  let from = 0;
  const page = 1000;
  while (true) {
    let q = supabase
      .from('examtracker')
      .select('subject, chapter')
      .in('category', variants)
      .not('chapter', 'is', null)
      .range(from, from + page - 1);

    if (subject) {
      q = q.ilike('subject', subject);
    }

    let { data, error } = await q;
    if (error && from === 0) {
      let retryQ = supabase
        .from('examtracker')
        .select('subject, chapter')
        .eq('category', 'GATE-EE')
        .not('chapter', 'is', null)
        .range(from, from + page - 1);
      if (subject) retryQ = retryQ.ilike('subject', subject);
      const retry = await retryQ;
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message || 'Failed to list chapters');
    if (!data?.length) break;

    for (const row of data) {
      const chapter = String(row.chapter || '').trim();
      if (!chapter) continue;
      const subj = String(row.subject || '').trim() || 'Unknown';
      if (subject && subj.toLowerCase() !== String(subject).toLowerCase()) continue;
      const key = `${subj}::${chapter}`;
      const prev = counts.get(key);
      if (prev) prev.count += 1;
      else {
        counts.set(key, {
          chapter,
          chapterKey: normalizeGateEeToken(chapter),
          subject: subj,
          count: 1,
        });
      }
    }

    if (data.length < page) break;
    from += page;
  }

  return [...counts.values()].sort((a, b) => {
    const s = a.subject.localeCompare(b.subject);
    if (s !== 0) return s;
    return a.chapter.localeCompare(b.chapter);
  });
}

export async function pickRandomGateEeChapterQuestions({
  subject,
  chapter,
  totalQuestions = GATE_EE_CHAPTER_DEFAULTS.totalQuestions,
} = {}) {
  const n = Math.min(Math.max(Number(totalQuestions) || 20, 1), 100);
  if (!subject || !chapter) {
    throw new Error('subject and chapter are required');
  }

  const supabase = getSupabaseAdmin();
  const variants = getCategoryVariants(GATE_EE_SLUG);
  const fetchLimit = Math.min(Math.max(n * 10, 200), 2000);

  let { data, error } = await supabase
    .from('examtracker')
    .select('_id, subject, chapter, topic, difficulty')
    .in('category', variants)
    .ilike('subject', subject)
    .eq('chapter', chapter)
    .limit(fetchLimit);

  if (error || !data?.length) {
    const retry = await supabase
      .from('examtracker')
      .select('_id, subject, chapter, topic, difficulty')
      .eq('category', 'GATE-EE')
      .ilike('subject', subject)
      .eq('chapter', chapter)
      .limit(fetchLimit);
    data = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message || 'Failed to fetch chapter questions');

  const rows = (data || []).filter((r) => r?._id);
  if (rows.length < n) {
    return {
      ok: false,
      picks: [],
      available: rows.length,
      needed: n,
      error: `Only ${rows.length} questions in ${subject} / ${chapter}; need ${n}`,
    };
  }

  shuffleInPlace(rows);
  return { ok: true, picks: rows.slice(0, n), available: rows.length, needed: n };
}

export async function createGateEeChapterMock({
  subject,
  chapter,
  totalQuestions = GATE_EE_CHAPTER_DEFAULTS.totalQuestions,
  durationMinutes = GATE_EE_CHAPTER_DEFAULTS.durationMinutes,
  createdBy = 'admin',
  addToMotdPool = false,
  name = null,
} = {}) {
  const picked = await pickRandomGateEeChapterQuestions({
    subject,
    chapter,
    totalQuestions,
  });

  if (!picked.ok) {
    return { ok: false, ...picked, test: null };
  }

  const mins = Math.min(
    Math.max(Number(durationMinutes) || GATE_EE_CHAPTER_DEFAULTS.durationMinutes, 5),
    300
  );
  const supabase = getSupabaseAdmin();
  const label = String(chapter).replace(/-/g, ' ');
  const testPayload = {
    name: name || `GATE EE · ${subject} · ${label} · ${picked.picks.length}Q`,
    description: `GATE EE chapter mock · ${subject} / ${chapter} · ${picked.picks.length} Qs · ${mins} min. creation_mode=${GATE_EE_CHAPTER_CREATION_MODE}.`,
    duration: mins,
    total_questions: picked.picks.length,
    difficulty: 'mixed',
    category: 'GATE-EE',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: GATE_EE_CHAPTER_CREATION_MODE,
  };

  const { data: savedTest, error: testError } = await insertWithSchemaFallback(
    supabase,
    'mock_tests',
    testPayload
  );

  if (testError || !savedTest?.id) {
    throw new Error(testError?.message || 'Failed to create mock test');
  }

  const rows = picked.picks.map((q, index) => ({
    test_id: savedTest.id,
    question_id: q._id,
    question_order: index + 1,
    subject: q.subject || subject,
    topic: q.topic || chapter,
    difficulty: q.difficulty || 'medium',
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
      examCategory: GATE_EE_SLUG,
      mockTestId: savedTest.id,
    });
    poolItem = poolResult.item;
    poolError = poolResult.error;
  }

  return {
    ok: true,
    test: savedTest,
    questionCount: rows.length,
    available: picked.available,
    poolItem,
    poolError,
    subject,
    chapter,
  };
}
