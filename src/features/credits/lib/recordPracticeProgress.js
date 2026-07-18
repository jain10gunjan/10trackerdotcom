import { readProgressBuffer, writeProgressBuffer } from '@/lib/progressBuffer';
import { normalizeQuestionId } from '@/features/credits/lib/practiceCreditUtils';

/** Persist practice attempt to in-memory progress + local buffer (no credits). */
export function applyPracticeProgressUpdate({
  userId,
  questionId,
  isCorrect,
  area,
  topic,
  pointsPerCorrect = 100,
  setProgress,
}) {
  const qid = normalizeQuestionId(questionId);
  if (!userId || !qid || !setProgress) return;

  setProgress((prev) => {
    const completed = (prev.completed ?? []).map(String);
    if (completed.includes(qid)) {
      return prev;
    }
    return {
      completed: [...new Set([...completed, qid])],
      correct: isCorrect
        ? [...new Set([...(prev.correct ?? []).map(String), qid])]
        : (prev.correct ?? []).map(String).filter((id) => id !== qid),
      points: prev.points + (isCorrect ? pointsPerCorrect : 0),
    };
  });

  try {
    const buffer = readProgressBuffer(userId);
    const entries = { ...(buffer.entries ?? {}) };
    entries[qid] = {
      completed: true,
      correct: !!isCorrect,
      points: isCorrect ? pointsPerCorrect : 0,
      topic: String(topic ?? '').trim(),
      area: String(area ?? '').trim().toLowerCase(),
      updatedAt: Date.now(),
    };
    writeProgressBuffer(userId, { ...buffer, entries });
    return Object.keys(entries).length;
  } catch {
    return 0;
  }
}
