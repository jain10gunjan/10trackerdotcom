/**
 * Admin: one VITEEE chapter → random 20 MCQs, 25 minutes, +4 / −1.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool } from '@/features/mock-test/lib/mockOfTheDay';
import { fetchViteeeBank, normalizeViteeeDifficulty } from '@/features/mock-test/lib/viteeeGenerator';
import {
  VITEEE_CHAPTER_CREATION_MODE,
  VITEEE_INSTRUCTIONS,
  VITEEE_SLUG,
  normalizeViteeeToken,
  subjectMatchesViteee,
  viteeeChapterDurationMinutes,
} from '@/features/mock-test/lib/viteeeBlueprint';

export const VITEEE_CHAPTER_DEFAULTS = {
  totalQuestions: 20,
  durationMinutes: viteeeChapterDurationMinutes(),
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function chapterKey(row) {
  return String(row.chapter || row.topic || '').trim();
}

export async function listViteeeChapters({ subject = null } = {}) {
  const bank = await fetchViteeeBank();
  const counts = new Map();
  for (const row of bank) {
    const chapter = chapterKey(row);
    if (!chapter) continue;
    const subj = String(row.subject || '').trim() || 'Unknown';
    if (subject && !subjectMatchesViteee(subj, subject)) continue;
    const key = `${subj}::${chapter}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else {
      counts.set(key, {
        chapter,
        chapterKey: normalizeViteeeToken(chapter),
        subject: subj,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) =>
    a.subject === b.subject ? a.chapter.localeCompare(b.chapter) : a.subject.localeCompare(b.subject)
  );
}

export async function createViteeeChapterMock({
  subject,
  chapter,
  totalQuestions = VITEEE_CHAPTER_DEFAULTS.totalQuestions,
  durationMinutes = VITEEE_CHAPTER_DEFAULTS.durationMinutes,
  createdBy = 'admin',
  addToMotdPool = false,
  name = null,
} = {}) {
  const n = Math.min(40, Math.max(1, Number(totalQuestions) || VITEEE_CHAPTER_DEFAULTS.totalQuestions));
  const wantChapter = normalizeViteeeToken(chapter);
  const bank = await fetchViteeeBank();
  const rows = bank.filter((row) => {
    if (!subjectMatchesViteee(row.subject, subject)) return false;
    const tokens = [row.chapter, row.topic].map(normalizeViteeeToken).filter(Boolean);
    return tokens.includes(wantChapter);
  });

  if (rows.length < n) {
    return {
      ok: false,
      picks: [],
      available: rows.length,
      needed: n,
      error: `Only ${rows.length} four-option MCQs in ${subject} / ${chapter}; need ${n}`,
      test: null,
    };
  }

  shuffleInPlace(rows);
  const picks = rows.slice(0, n);
  const mins = Math.min(
    Math.max(Number(durationMinutes) || VITEEE_CHAPTER_DEFAULTS.durationMinutes, 5),
    180
  );
  const supabase = getSupabaseAdmin();
  const label = String(chapter).replace(/-/g, ' ');
  const testPayload = {
    name: name || `VITEEE · ${subject} · ${label} · ${picks.length}Q`,
    description: `VITEEE chapter mock · ${subject} / ${chapter} · ${picks.length} Qs · ${mins} min. ${VITEEE_INSTRUCTIONS} creation_mode=${VITEEE_CHAPTER_CREATION_MODE}.`,
    duration: mins,
    total_questions: picks.length,
    difficulty: 'mixed',
    category: 'VITEEE',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: VITEEE_CHAPTER_CREATION_MODE,
  };

  const { data: savedTest, error: testError } = await insertWithSchemaFallback(
    supabase,
    'mock_tests',
    testPayload
  );
  if (testError || !savedTest?.id) {
    throw new Error(testError?.message || 'Failed to create mock test');
  }

  const questionRows = picks.map((q, index) => ({
    test_id: savedTest.id,
    question_id: q._id,
    question_order: index + 1,
    subject: q.subject || subject,
    topic: q.topic || chapter,
    difficulty: normalizeViteeeDifficulty(q.difficulty),
  }));
  const { error: qErr } = await supabase.from('mock_test_questions').insert(questionRows);
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

  return {
    ok: true,
    test: savedTest,
    questionCount: picks.length,
    available: rows.length,
    subject,
    chapter,
    durationMinutes: mins,
    poolItem,
    poolError,
  };
}
