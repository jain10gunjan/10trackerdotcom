/**
 * Admin: one MHT-CET chapter → random 20 MCQs.
 * Physics/Chemistry: 20 min (1 mark). Mathematics: 36 min (2 marks).
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { insertWithSchemaFallback } from '@/features/mock-test/lib/mockTestDb';
import { encodeGateTopic } from '@/features/mock-test/lib/gateCseBlueprint';
import { addMockToMotdPool } from '@/features/mock-test/lib/mockOfTheDay';
import { fetchMhtCetBank, normalizeMhtDifficulty } from '@/features/mock-test/lib/mhtCetGenerator';
import {
  MHT_CET_CHAPTER_CREATION_MODE,
  MHT_CET_INSTRUCTIONS,
  MHT_CET_SLUG,
  mhtCetChapterDurationMinutes,
  mhtCetMarksForSubject,
  normalizeMhtChapterToken,
  subjectMatchesMht,
} from '@/features/mock-test/lib/mhtCetBlueprint';

export const MHT_CHAPTER_DEFAULTS = {
  totalQuestions: 20,
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

export async function listMhtCetChapters({ subject = null } = {}) {
  const bank = await fetchMhtCetBank();
  const counts = new Map();

  for (const row of bank) {
    const chapter = chapterKey(row);
    if (!chapter) continue;
    const subj = String(row.subject || '').trim() || 'Unknown';
    if (subject && !subjectMatchesMht(subj, subject) && subj.toLowerCase() !== String(subject).toLowerCase()) {
      continue;
    }
    const key = `${subj}::${chapter}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else {
      counts.set(key, {
        chapter,
        chapterKey: normalizeMhtChapterToken(chapter),
        subject: subj,
        count: 1,
      });
    }
  }

  return [...counts.values()].sort((a, b) =>
    a.subject === b.subject ? a.chapter.localeCompare(b.chapter) : a.subject.localeCompare(b.subject)
  );
}

async function pickRandomChapterQuestions({ subject, chapter, totalQuestions }) {
  const n = Math.min(50, Math.max(1, Number(totalQuestions) || MHT_CHAPTER_DEFAULTS.totalQuestions));
  const wantChapter = normalizeMhtChapterToken(chapter);
  const bank = await fetchMhtCetBank();
  const rows = bank.filter((row) => {
    if (!subjectMatchesMht(row.subject, subject)) return false;
    const tokens = [
      normalizeMhtChapterToken(row.chapter),
      normalizeMhtChapterToken(row.topic),
    ].filter(Boolean);
    return tokens.includes(wantChapter);
  });

  if (rows.length < n) {
    return {
      ok: false,
      picks: [],
      available: rows.length,
      needed: n,
      error: `Only ${rows.length} four-option MCQs in ${subject} / ${chapter}; need ${n}`,
    };
  }

  shuffleInPlace(rows);
  return { ok: true, picks: rows.slice(0, n), available: rows.length, needed: n };
}

export async function createMhtCetChapterMock({
  subject,
  chapter,
  totalQuestions = MHT_CHAPTER_DEFAULTS.totalQuestions,
  durationMinutes = null,
  createdBy = 'admin',
  addToMotdPool = false,
  name = null,
} = {}) {
  const picked = await pickRandomChapterQuestions({ subject, chapter, totalQuestions });
  if (!picked.ok) return { ok: false, ...picked, test: null };

  const marksEach = mhtCetMarksForSubject(subject);
  const defaultMins = mhtCetChapterDurationMinutes(subject);
  const mins = Math.min(Math.max(Number(durationMinutes) || defaultMins, 5), 180);
  const supabase = getSupabaseAdmin();
  const label = String(chapter).replace(/-/g, ' ');
  const questionMarks = {};
  picked.picks.forEach((row) => {
    questionMarks[String(row._id)] = marksEach;
  });

  const testPayload = {
    name: name || `MHT-CET · ${subject} · ${label} · ${picked.picks.length}Q`,
    description: `MHT-CET chapter mock · ${subject} / ${chapter} · ${picked.picks.length} Qs · ${mins} min · ${marksEach} mark${marksEach === 1 ? '' : 's'} each. ${MHT_CET_INSTRUCTIONS} creation_mode=${MHT_CET_CHAPTER_CREATION_MODE}.`,
    duration: mins,
    total_questions: picked.picks.length,
    difficulty: 'mixed',
    category: 'MHT-CET',
    is_active: true,
    created_by: createdBy || 'admin',
    creation_mode: MHT_CET_CHAPTER_CREATION_MODE,
    weightage_config: {
      scheme: 'mht_cet',
      maxMarks: picked.picks.length * marksEach,
      negativeMarking: 0,
      mhtCetQuestionMarks: questionMarks,
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

  const rows = picked.picks.map((q, index) => ({
    test_id: savedTest.id,
    question_id: q._id,
    question_order: index + 1,
    subject: q.subject || subject,
    topic: encodeGateTopic(marksEach, q.topic || chapter),
    difficulty: normalizeMhtDifficulty(q.difficulty),
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
      examCategory: MHT_CET_SLUG,
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
    subject,
    chapter,
    durationMinutes: mins,
    marksEach,
    poolItem,
    poolError,
  };
}
