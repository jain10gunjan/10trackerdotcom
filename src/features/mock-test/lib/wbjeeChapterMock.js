/**
 * Admin: one WBJEE chapter → random 20 Category 1 MCQs.
 * Mathematics 32 minutes, Physics and Chemistry 30 minutes. +1 / −0.25.
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { addMockToMotdPool } from '@/features/mock-test/lib/mockOfTheDay';
import { fetchWbjeeBank, normalizeWbjeeDifficulty } from '@/features/mock-test/lib/wbjeeGenerator';
import {
  WBJEE_CHAPTER_CREATION_MODE,
  WBJEE_INSTRUCTIONS,
  WBJEE_SLUG,
  encodeWbjeeTopic,
  normalizeWbjeeToken,
  subjectMatchesWbjee,
  wbjeeChapterDurationMinutes,
} from '@/features/mock-test/lib/wbjeeBlueprint';

export const WBJEE_CHAPTER_DEFAULTS = {
  totalQuestions: 20,
  category: 1,
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

export async function listWbjeeChapters({ subject = null } = {}) {
  const bank = await fetchWbjeeBank();
  const counts = new Map();
  for (const row of bank) {
    const chapter = chapterKey(row);
    if (!chapter) continue;
    const subj = String(row.subject || '').trim() || 'Unknown';
    if (subject && !subjectMatchesWbjee(subj, subject)) continue;
    const key = `${subj}::${chapter}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else {
      counts.set(key, {
        chapter,
        chapterKey: normalizeWbjeeToken(chapter),
        subject: subj,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) =>
    a.subject === b.subject ? a.chapter.localeCompare(b.chapter) : a.subject.localeCompare(b.subject)
  );
}

export async function createWbjeeChapterMock({
  subject,
  chapter,
  totalQuestions = WBJEE_CHAPTER_DEFAULTS.totalQuestions,
  durationMinutes = null,
  createdBy = 'admin',
  addToMotdPool = false,
  name = null,
} = {}) {
  const n = Math.min(40, Math.max(1, Number(totalQuestions) || WBJEE_CHAPTER_DEFAULTS.totalQuestions));
  const wantChapter = normalizeWbjeeToken(chapter);
  const bank = await fetchWbjeeBank();
  const rows = bank.filter((row) => {
    if (!subjectMatchesWbjee(row.subject, subject)) return false;
    const tokens = [row.chapter, row.topic].map(normalizeWbjeeToken).filter(Boolean);
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
    Math.max(Number(durationMinutes) || wbjeeChapterDurationMinutes(subject), 5),
    180
  );
  const wbjeeQuestions = {};
  picks.forEach((q) => {
    wbjeeQuestions[String(q._id)] = { category: 1, marks: 1, negative: 0.25 };
  });

  const supabase = getSupabaseAdmin();
  const label = String(chapter).replace(/-/g, ' ');
  const testPayload = {
    name: name || `WBJEE · ${subject} · ${label} · ${picks.length}Q`,
    description: `WBJEE chapter mock · ${subject} / ${chapter} · ${picks.length} Category 1 Qs · ${mins} min. +1 / −0.25. ${WBJEE_INSTRUCTIONS} creation_mode=${WBJEE_CHAPTER_CREATION_MODE}.`,
    duration: mins,
    total_questions: picks.length,
    difficulty: 'mixed',
    category: 'WBJEE',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: WBJEE_CHAPTER_CREATION_MODE,
    weightage_config: {
      scheme: 'wbjee',
      maxMarks: picks.length,
      wbjeeQuestions,
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
    topic: encodeWbjeeTopic(1, q.topic || chapter),
    difficulty: normalizeWbjeeDifficulty(q.difficulty),
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
      examCategory: WBJEE_SLUG,
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
