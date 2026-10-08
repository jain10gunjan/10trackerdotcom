import { unstable_cache } from 'next/cache';
import { getVendorSupabase } from '@/features/vendor-tests/lib/vendorDb';
import { fromVendorQuestionRow } from '@/features/vendor-tests/lib/vendorQuestionNormalize';
import { backfillMissingOptionsFromPlatform } from '@/features/vendor-tests/lib/backfillQuestionOptions';
import {
  buildAttemptQuestionMeta,
  sanitizeQuestionForAttempt,
} from '@/features/vendor-tests/lib/attemptQuestions';
import { isInlineAnswerQuestion } from '@/lib/questionAnswerMode';

/**
 * Load pins + bank questions for a vendor test (uncached).
 */
async function fetchVendorPaper(vendorId, testId) {
  const supabase = getVendorSupabase();
  const { data: pins, error: pinErr } = await supabase
    .from('vendor_test_questions')
    .select('question_id, question_order, marks')
    .eq('vendor_id', vendorId)
    .eq('test_id', testId)
    .order('question_order', { ascending: true });

  if (pinErr) throw new Error(pinErr.message);
  const pinRows = pins || [];
  const ids = pinRows.map((p) => p.question_id);
  if (!ids.length) {
    return { pins: [], questions: [] };
  }

  const { data, error } = await supabase
    .from('vendor_questions')
    .select('*')
    .eq('vendor_id', vendorId)
    .in('_id', ids);
  if (error) throw new Error(error.message);

  const mapped = (data || []).map(fromVendorQuestionRow);
  const questions = await backfillMissingOptionsFromPlatform(supabase, mapped);
  return { pins: pinRows, questions };
}

/**
 * Cached published paper (pins + full question rows).
 * Bust with test.updated_at so edits invalidate.
 */
export function getCachedVendorPaper(vendorId, testId, testUpdatedAt) {
  const bust = String(testUpdatedAt || '0');
  return unstable_cache(
    async () => fetchVendorPaper(vendorId, testId),
    ['vendor-paper', String(vendorId), String(testId), bust],
    {
      revalidate: 120,
      tags: [`vendor-paper-${vendorId}-${testId}`],
    }
  )();
}

/**
 * Build attempt snapshot: client paper (no keys) + server-only answerKey.
 */
export function buildAttemptPaperSnapshot({
  attemptId,
  pins,
  questions,
  shuffleQuestions,
  shuffleOptions,
  testUpdatedAt,
}) {
  const meta = buildAttemptQuestionMeta({
    pins,
    attemptId,
    shuffleQuestions,
    shuffleOptions,
  });

  const pinById = Object.fromEntries(
    (pins || []).map((p) => [String(p.question_id), p])
  );
  const qById = Object.fromEntries((questions || []).map((q) => [q._id, q]));

  const paper = [];
  const answerKey = {};

  for (const qid of meta.questionOrder) {
    const q = qById[qid];
    const pin = pinById[qid];
    if (!q || !pin) continue;
    const marks = Number(pin.marks) > 0 ? Number(pin.marks) : 1;
    paper.push(
      sanitizeQuestionForAttempt(q, {
        marks,
        optionOrder: meta.optionOrders[qid],
      })
    );
    answerKey[qid] = {
      correct_option: q.correct_option ?? null,
      marks,
      subject: q.subject ?? null,
      topic: q.topic ?? null,
      difficulty: q.difficulty ?? null,
      answerMode: isInlineAnswerQuestion(q) ? 'inline' : 'mcq',
      question_order: pin.question_order ?? null,
    };
  }

  return {
    questionOrder: meta.questionOrder,
    optionOrders: meta.optionOrders,
    paper,
    answerKey,
    paperVersion: testUpdatedAt || null,
    paperCachedAt: new Date().toISOString(),
  };
}
