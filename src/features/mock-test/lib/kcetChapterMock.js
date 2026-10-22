/**
 * Admin: one KCET chapter → random 20 MCQs, 27 minutes, +1, no negative marking.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool } from '@/features/mock-test/lib/mockOfTheDay';
import { fetchKcetBank, normalizeKcetDifficulty } from '@/features/mock-test/lib/kcetGenerator';
import {
  KCET_CHAPTER_CREATION_MODE,
  KCET_INSTRUCTIONS,
  KCET_SLUG,
  kcetChapterDurationMinutes,
  normalizeKcetToken,
  subjectMatchesKcet,
} from '@/features/mock-test/lib/kcetBlueprint';

export const KCET_CHAPTER_DEFAULTS = {
  totalQuestions: 20,
  durationMinutes: kcetChapterDurationMinutes(),
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

export async function listKcetChapters({ subject = null } = {}) {
  const bank = await fetchKcetBank();
  const counts = new Map();
  for (const row of bank) {
    const chapter = chapterKey(row);
    if (!chapter) continue;
    const subj = String(row.subject || '').trim() || 'Unknown';
    if (subject && !subjectMatchesKcet(subj, subject)) continue;
    const key = `${subj}::${chapter}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else {
      counts.set(key, {
        chapter,
        chapterKey: normalizeKcetToken(chapter),
        subject: subj,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) =>
    a.subject === b.subject ? a.chapter.localeCompare(b.chapter) : a.subject.localeCompare(b.subject)
  );
}

export async function createKcetChapterMock({
  subject,
  chapter,
  totalQuestions = KCET_CHAPTER_DEFAULTS.totalQuestions,
  durationMinutes = KCET_CHAPTER_DEFAULTS.durationMinutes,
  createdBy = 'admin',
  addToMotdPool = false,
  name = null,
} = {}) {
  const n = Math.min(40, Math.max(1, Number(totalQuestions) || KCET_CHAPTER_DEFAULTS.totalQuestions));
  const wantChapter = normalizeKcetToken(chapter);
  const bank = await fetchKcetBank();
  const rows = bank.filter((row) => {
    if (!subjectMatchesKcet(row.subject, subject)) return false;
    const tokens = [row.chapter, row.topic].map(normalizeKcetToken).filter(Boolean);
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
    Math.max(Number(durationMinutes) || KCET_CHAPTER_DEFAULTS.durationMinutes, 5),
    180
  );
  const supabase = getSupabaseAdmin();
  const label = String(chapter).replace(/-/g, ' ');
  const testPayload = {
    name: name || `KCET · ${subject} · ${label} · ${picks.length}Q`,
    description: `KCET chapter mock · ${subject} / ${chapter} · ${picks.length} Qs · ${mins} min. +1, no negative marking. ${KCET_INSTRUCTIONS} creation_mode=${KCET_CHAPTER_CREATION_MODE}.`,
    duration: mins,
    total_questions: picks.length,
    difficulty: 'mixed',
    category: 'KCET',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: KCET_CHAPTER_CREATION_MODE,
    weightage_config: {
      scheme: 'kcet',
      maxMarks: picks.length,
      negativeMarking: 0,
      marksCorrect: 1,
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

  const questionRows = picks.map((q, index) => ({
    test_id: savedTest.id,
    question_id: q._id,
    question_order: index + 1,
    subject: q.subject || subject,
    topic: q.topic || chapter,
    difficulty: normalizeKcetDifficulty(q.difficulty),
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
      examCategory: KCET_SLUG,
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
