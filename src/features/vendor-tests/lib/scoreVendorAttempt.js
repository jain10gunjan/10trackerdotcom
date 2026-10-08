import { isAnswerCorrect, isInlineAnswerQuestion } from '@/lib/questionAnswerMode';
import { fromVendorQuestionRow } from './vendorQuestionNormalize';

function hasAnswer(value) {
  return value != null && String(value).trim() !== '';
}

function getStoredAnswer(answers, questionId) {
  const raw = answers?.[questionId];
  if (raw == null) return '';
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw.answer ?? raw.value ?? '';
  }
  return raw;
}

/**
 * Server-side score for a vendor attempt.
 * Client is_correct is never trusted.
 *
 * @param {object} params
 * @param {Array} params.pins — { question_id, question_order, marks }
 * @param {Array} params.questions — vendor_questions rows (full, with keys)
 * @param {object} params.answers — attempt.answers JSONB
 * @param {Array|object} params.markedForReview
 * @param {number} params.negativeMarking — fraction of marks deducted on wrong (0–1 typical)
 */
/**
 * Score using server-only answerKey snapshotted at attempt start.
 * @param {object} answerKey — { [qid]: { correct_option, marks, answerMode, ... } }
 */
export function scoreVendorAttemptFromAnswerKey({
  answerKey = {},
  questionOrder = [],
  answers = {},
  markedForReview = [],
  negativeMarking = 0,
}) {
  const reviewSet = new Set(
    (Array.isArray(markedForReview) ? markedForReview : []).map(String)
  );
  const neg = Math.max(0, Number(negativeMarking) || 0);
  const order =
    questionOrder?.length > 0
      ? questionOrder.map(String)
      : Object.keys(answerKey || {});

  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  const responses = [];

  order.forEach((qid, idx) => {
    const key = answerKey[qid];
    if (!key) return;
    const markValue = Number(key.marks) > 0 ? Number(key.marks) : 1;
    maxScore += markValue;

    const userAnswer = getStoredAnswer(answers, qid);
    const answered = hasAnswer(userAnswer);
    const correctAnswer = key.correct_option ?? null;
    const fakeQuestion =
      key.answerMode === 'inline'
        ? { options_A: '', options_B: '', options_C: '', options_D: '' }
        : { options_A: 'x', options_B: '', options_C: '', options_D: '' };

    let isCorrect = false;
    let marksAwarded = 0;

    if (!answered) {
      skippedCount += 1;
    } else {
      isCorrect = isAnswerCorrect(userAnswer, correctAnswer, fakeQuestion);
      if (isCorrect) {
        correctCount += 1;
        marksAwarded = markValue;
      } else {
        incorrectCount += 1;
        marksAwarded = neg > 0 ? -(markValue * neg) : 0;
      }
    }

    score += marksAwarded;
    responses.push({
      question_id: qid,
      question_order: key.question_order ?? idx + 1,
      user_answer: answered ? String(userAnswer).trim() : null,
      correct_answer: correctAnswer != null ? String(correctAnswer) : null,
      is_correct: answered ? isCorrect : null,
      marks_awarded: marksAwarded,
      time_taken: Number(answers?.[qid]?.timeTaken) || 0,
      marked_for_review: reviewSet.has(qid),
      subject: key.subject ?? null,
      topic: key.topic ?? null,
      difficulty: key.difficulty ?? null,
      answer_mode: key.answerMode || 'mcq',
    });
  });

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
  return {
    score: Math.round(score * 100) / 100,
    maxScore: Math.round(maxScore * 100) / 100,
    percentage,
    correctCount,
    incorrectCount,
    skippedCount,
    responses,
  };
}

export function scoreVendorAttempt({
  pins = [],
  questions = [],
  answers = {},
  markedForReview = [],
  negativeMarking = 0,
  answerKey = null,
  questionOrder = null,
}) {
  if (answerKey && typeof answerKey === 'object' && Object.keys(answerKey).length) {
    return scoreVendorAttemptFromAnswerKey({
      answerKey,
      questionOrder:
        questionOrder ||
        (pins || []).map((p) => String(p.question_id)),
      answers,
      markedForReview,
      negativeMarking,
    });
  }

  const byId = Object.fromEntries(
    (questions || []).map((q) => [q._id, fromVendorQuestionRow(q)])
  );
  const reviewSet = new Set(
    (Array.isArray(markedForReview) ? markedForReview : []).map(String)
  );
  const neg = Math.max(0, Number(negativeMarking) || 0);

  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  const responses = [];

  const orderedPins = [...(pins || [])].sort(
    (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0)
  );

  for (const pin of orderedPins) {
    const qid = String(pin.question_id);
    const q = byId[qid];
    const marks = Number(pin.marks);
    const markValue = Number.isFinite(marks) && marks > 0 ? marks : 1;
    maxScore += markValue;

    const userAnswer = getStoredAnswer(answers, qid);
    const answered = hasAnswer(userAnswer);
    const correctAnswer = q?.correct_option ?? null;

    let isCorrect = false;
    let marksAwarded = 0;

    if (!answered) {
      skippedCount += 1;
    } else if (q) {
      isCorrect = isAnswerCorrect(userAnswer, correctAnswer, q);
      if (isCorrect) {
        correctCount += 1;
        marksAwarded = markValue;
      } else {
        incorrectCount += 1;
        marksAwarded = neg > 0 ? -(markValue * neg) : 0;
      }
    } else {
      incorrectCount += 1;
    }

    score += marksAwarded;

    responses.push({
      question_id: qid,
      question_order: pin.question_order ?? null,
      user_answer: answered ? String(userAnswer).trim() : null,
      correct_answer: correctAnswer != null ? String(correctAnswer) : null,
      is_correct: answered ? isCorrect : null,
      marks_awarded: marksAwarded,
      time_taken: Number(answers?.[qid]?.timeTaken) || 0,
      marked_for_review: reviewSet.has(qid),
      subject: q?.subject ?? null,
      topic: q?.topic ?? null,
      difficulty: q?.difficulty ?? null,
      answer_mode: q && isInlineAnswerQuestion(q) ? 'inline' : 'mcq',
    });
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;

  return {
    score: Math.round(score * 100) / 100,
    maxScore: Math.round(maxScore * 100) / 100,
    percentage,
    correctCount,
    incorrectCount,
    skippedCount,
    responses,
  };
}
