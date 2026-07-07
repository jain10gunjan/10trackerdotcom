import { readProgressBuffer } from '@/lib/progressBuffer';
import { progressQuestionId } from '@/lib/practice/chapterPracticeUtils';
import { normalizeQuestionId } from '@/lib/credits/practiceCreditUtils';

/** Saved + local buffer completed IDs for an area (optional topic filter). */
export function buildEffectiveCompletedSet({
  savedCompleted = [],
  userId,
  area,
  topic,
}) {
  const set = new Set((savedCompleted ?? []).map((id) => progressQuestionId(id)));
  if (!userId) return set;

  try {
    const { entries } = readProgressBuffer(userId) ?? { entries: {} };
    const areaNorm = String(area ?? '').trim().toLowerCase();
    const topicNorm = topic != null ? String(topic).trim() : null;

    for (const [id, entry] of Object.entries(entries ?? {})) {
      const qid = progressQuestionId(id);
      if (!qid) continue;
      if (String(entry?.area ?? '').trim().toLowerCase() !== areaNorm) continue;
      if (topicNorm && String(entry?.topic ?? '').trim() !== topicNorm) continue;
      set.add(qid);
    }
  } catch {
    /* ignore */
  }

  return set;
}

export function normalizeQuestionIdSet(ids) {
  return new Set((ids ?? []).map((id) => normalizeQuestionId(id) || progressQuestionId(id)).filter(Boolean));
}
