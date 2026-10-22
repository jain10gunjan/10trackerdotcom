/**
 * Admin: one CAT topic → random 20 questions, 35 minutes.
 * +3 correct, −1 wrong MCQ, 0 wrong TITA.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool } from '@/features/mock-test/lib/mockOfTheDay';
import {
  fetchCatBank,
  isCatTitaRow,
  normalizeCatDifficulty,
} from '@/features/mock-test/lib/catGenerator';
import {
  CAT_CHAPTER_CREATION_MODE,
  CAT_INSTRUCTIONS,
  CAT_SLUG,
  catTopicDurationMinutes,
  normalizeCatToken,
  subjectMatchesCat,
} from '@/features/mock-test/lib/catBlueprint';

export const CAT_TOPIC_DEFAULTS = {
  totalQuestions: 20,
  durationMinutes: catTopicDurationMinutes(),
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function topicKey(row) {
  return String(row.chapter || row.topic || '').trim();
}

export async function listCatTopics({ subject = null } = {}) {
  const bank = await fetchCatBank();
  const counts = new Map();
  for (const row of bank) {
    const chapter = topicKey(row);
    if (!chapter) continue;
    const subj = String(row.subject || '').trim() || 'Unknown';
    if (subject && !subjectMatchesCat(subj, subject)) continue;
    const key = `${subj}::${chapter}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else {
      counts.set(key, {
        chapter,
        chapterKey: normalizeCatToken(chapter),
        subject: subj,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) =>
    a.subject === b.subject ? a.chapter.localeCompare(b.chapter) : a.subject.localeCompare(b.subject)
  );
}

export async function createCatTopicMock({
  subject,
  chapter,
  totalQuestions = CAT_TOPIC_DEFAULTS.totalQuestions,
  durationMinutes = CAT_TOPIC_DEFAULTS.durationMinutes,
  createdBy = 'admin',
  addToMotdPool = false,
  name = null,
} = {}) {
  const n = Math.min(40, Math.max(1, Number(totalQuestions) || CAT_TOPIC_DEFAULTS.totalQuestions));
  const wantChapter = normalizeCatToken(chapter);
  const bank = await fetchCatBank();
  const rows = bank.filter((row) => {
    if (!subjectMatchesCat(row.subject, subject)) return false;
    const tokens = [row.chapter, row.topic].map(normalizeCatToken).filter(Boolean);
    return tokens.includes(wantChapter);
  });

  if (rows.length < n) {
    return {
      ok: false,
      picks: [],
      available: rows.length,
      needed: n,
      error: `Only ${rows.length} questions in ${subject} / ${chapter}; need ${n}`,
      test: null,
    };
  }

  shuffleInPlace(rows);
  const picks = rows.slice(0, n);
  const mins = Math.min(
    Math.max(Number(durationMinutes) || CAT_TOPIC_DEFAULTS.durationMinutes, 5),
    180
  );
  const supabase = getSupabaseAdmin();
  const label = String(chapter).replace(/-/g, ' ');
  const testPayload = {
    name: name || `CAT · ${subject} · ${label} · ${picks.length}Q`,
    description: `CAT topic mock · ${subject} / ${chapter} · ${picks.length} Qs · ${mins} min. +3, −1 MCQ, 0 TITA. ${CAT_INSTRUCTIONS} creation_mode=${CAT_CHAPTER_CREATION_MODE}.`,
    duration: mins,
    total_questions: picks.length,
    difficulty: 'mixed',
    category: 'CAT',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: CAT_CHAPTER_CREATION_MODE,
    weightage_config: {
      scheme: 'cat',
      maxMarks: picks.length * 3,
      marksCorrect: 3,
      mcqWrong: -1,
      titaWrong: 0,
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
    difficulty: normalizeCatDifficulty(q.difficulty),
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
      examCategory: CAT_SLUG,
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
    tita: picks.filter(isCatTitaRow).length,
    subject,
    chapter,
    durationMinutes: mins,
    poolItem,
    poolError,
  };
}
