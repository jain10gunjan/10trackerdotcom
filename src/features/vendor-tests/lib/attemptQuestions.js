import {
  fromVendorQuestionRow,
} from './vendorQuestionNormalize';
import {
  getVisibleMcqOptions,
  isInlineAnswerQuestion,
  getOptionField,
} from '@/lib/questionAnswerMode';

/** Fisher–Yates using a seeded PRNG so resume stays stable. */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleWithSeed(items, seedKey) {
  const arr = [...items];
  const rand = mulberry32(hashSeed(seedKey));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build stable question order for an attempt (stored in final_stats).
 */
export function buildAttemptQuestionMeta({
  pins,
  attemptId,
  shuffleQuestions,
  shuffleOptions,
}) {
  const ordered = [...(pins || [])].sort(
    (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0)
  );
  const pinOrder = shuffleQuestions
    ? shuffleWithSeed(ordered, `${attemptId}:q`)
    : ordered;

  const questionOrder = pinOrder.map((p) => String(p.question_id));
  const optionOrders = {};

  if (shuffleOptions) {
    for (const p of pinOrder) {
      const qid = String(p.question_id);
      optionOrders[qid] = shuffleWithSeed(['A', 'B', 'C', 'D'], `${attemptId}:opt:${qid}`);
    }
  }

  return { questionOrder, optionOrders };
}

/**
 * Strip answer keys / solutions for the attempt client payload.
 */
export function sanitizeQuestionForAttempt(row, { marks, optionOrder } = {}) {
  const q = fromVendorQuestionRow(row);
  // Ensure lowercase DB columns are visible to option helpers
  const normalized = {
    ...q,
    options_A: q.options_A ?? q.options_a ?? null,
    options_B: q.options_B ?? q.options_b ?? null,
    options_C: q.options_C ?? q.options_c ?? null,
    options_D: q.options_D ?? q.options_d ?? null,
  };
  const inline = isInlineAnswerQuestion(normalized);
  const letters = inline
    ? []
    : optionOrder?.length
      ? optionOrder.filter((L) => getOptionField(normalized, L).length > 0)
      : getVisibleMcqOptions(normalized);

  return {
    _id: normalized._id,
    question: normalized.question,
    directionhtml: normalized.directionhtml || normalized.directionHTML || null,
    questionimage: normalized.questionimage || normalized.questionImage || null,
    marks: Number(marks) > 0 ? Number(marks) : 1,
    answerMode: inline ? 'inline' : 'mcq',
    options: letters.map((letter) => ({
      letter,
      html: getOptionField(normalized, letter),
    })),
  };
}

export function answersToClientMap(answers) {
  const out = {};
  if (!answers || typeof answers !== 'object') return out;
  for (const [qid, raw] of Object.entries(answers)) {
    if (raw == null) continue;
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      out[qid] = {
        answer: raw.answer ?? raw.value ?? '',
        timeTaken: Number(raw.timeTaken) || 0,
      };
    } else {
      out[qid] = { answer: String(raw), timeTaken: 0 };
    }
  }
  return out;
}

export function normalizeClientAnswers(incoming, existing = {}) {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...existing }
      : {};
  if (!incoming || typeof incoming !== 'object') return base;

  for (const [qid, raw] of Object.entries(incoming)) {
    if (raw == null) {
      delete base[qid];
      continue;
    }
    const answer =
      typeof raw === 'object' && !Array.isArray(raw)
        ? String(raw.answer ?? raw.value ?? '').trim()
        : String(raw).trim();
    const prev = base[qid];
    const prevTime =
      prev && typeof prev === 'object' ? Number(prev.timeTaken) || 0 : 0;
    const timeTaken =
      typeof raw === 'object' && raw.timeTaken != null
        ? Math.max(0, Number(raw.timeTaken) || 0)
        : prevTime;
    if (!answer) {
      delete base[qid];
      continue;
    }
    base[qid] = { answer, timeTaken };
  }
  return base;
}

export function canReleaseResults(test, now = new Date()) {
  if (!test) return false;
  const mode = test.result_release || 'instant';
  if (mode === 'instant') return true;
  if (test.results_released === true) return true;
  if (mode === 'after_window' && test.ends_at && now > new Date(test.ends_at)) {
    return true;
  }
  return false;
}

export function inTestWindow(test, now = new Date()) {
  if (!test) return false;
  if (test.starts_at && now < new Date(test.starts_at)) return false;
  if (test.ends_at && now > new Date(test.ends_at)) return false;
  return true;
}
