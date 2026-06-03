import { readProgressBuffer } from '@/lib/progressBuffer';
import {
  isCreditAlreadyReserved,
  practiceIdempotencyKey,
} from '@/lib/credits/creditLocalStore';

export function normalizeQuestionId(id) {
  return id == null ? '' : String(id);
}

/** Whether this question was already completed for the current topic (progress + local buffer). */
export function isPracticeQuestionAlreadyDone({
  questionId,
  completedIds = [],
  userId,
  area,
  topic,
}) {
  const qid = normalizeQuestionId(questionId);
  if (!qid) return false;

  if (completedIds.some((id) => normalizeQuestionId(id) === qid)) {
    return true;
  }

  if (userId) {
    const creditKey = practiceIdempotencyKey(userId, qid);
    if (isCreditAlreadyReserved(userId, creditKey)) {
      return true;
    }
  }

  if (!userId) return false;

  try {
    const { entries } = readProgressBuffer(userId);
    const entry = entries?.[qid];
    if (!entry?.completed) return false;
    const entryArea = String(entry.area ?? '').toLowerCase();
    const entryTopic = String(entry.topic ?? '').trim();
    if (area && entryArea && entryArea !== String(area).toLowerCase()) return false;
    if (topic && entryTopic && entryTopic !== String(topic).trim()) return false;
    return true;
  } catch {
    return false;
  }
}
