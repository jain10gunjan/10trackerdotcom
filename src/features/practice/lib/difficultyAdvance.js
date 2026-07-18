export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export function countCompletedInSet(questionIds, completedSet) {
  if (!questionIds?.size) return 0;
  let n = 0;
  for (const id of questionIds) {
    if (completedSet.has(String(id))) n++;
  }
  return n;
}

/** Next difficulty with at least one question, skipping empty levels. */
export function findNextDifficultyWithQuestions(current, counts) {
  const i = DIFFICULTY_ORDER.indexOf(current);
  if (i < 0) return null;
  for (let j = i + 1; j < DIFFICULTY_ORDER.length; j++) {
    const d = DIFFICULTY_ORDER[j];
    if ((counts[d] ?? 0) > 0) return d;
  }
  return null;
}

export function capitalizeDifficulty(d) {
  if (!d) return '';
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/**
 * @param {'chapter'|'topic'} scopeLabel
 */
export function buildAdvancePrompt({ current, counts, scopeLabel = 'chapter' }) {
  const next = findNextDifficultyWithQuestions(current, counts);
  if (!next) return { kind: 'all_complete' };

  const scope = scopeLabel === 'topic' ? 'topic' : 'chapter';
  const currentCap = capitalizeDifficulty(current);
  const nextCap = capitalizeDifficulty(next);

  const i = DIFFICULTY_ORDER.indexOf(current);
  const j = DIFFICULTY_ORDER.indexOf(next);
  const skippedEmpty = [];
  for (let k = i + 1; k < j; k++) {
    const d = DIFFICULTY_ORDER[k];
    if ((counts[d] ?? 0) === 0) skippedEmpty.push(d);
  }

  if (skippedEmpty.length > 0) {
    const skippedLabel = skippedEmpty.map(capitalizeDifficulty).join(', ').toLowerCase();
    return {
      kind: 'prompt',
      next,
      message: `${currentCap} complete — no ${skippedLabel} questions for this ${scope}. Advancing to ${nextCap}.`,
    };
  }

  return {
    kind: 'prompt',
    next,
    message: `${currentCap} complete! Advancing to ${nextCap}.`,
  };
}

export function getCompletionCelebration(scopeLabel = 'chapter') {
  return scopeLabel === 'topic' ? 'Topic complete!' : 'Chapter complete!';
}

/**
 * True when this answer just completed the difficulty (was not complete before).
 */
export function shouldOfferAdvance({
  questionId,
  difficultyQuestionIds,
  completedSet,
  totalCount,
}) {
  const qid = String(questionId ?? '');
  if (!qid || !difficultyQuestionIds?.has(qid)) return false;
  if (completedSet.has(qid)) return false;

  const total = totalCount || difficultyQuestionIds.size;
  if (!total) return false;

  const beforeCount = countCompletedInSet(difficultyQuestionIds, completedSet);
  const afterCount = beforeCount + 1;
  return afterCount >= total && beforeCount < total;
}

/**
 * Auto-advance to next difficulty with toast (no confirm dialog).
 * @returns {boolean} whether navigation happened
 */
export function promptDifficultyAdvance({
  current,
  counts,
  scopeLabel,
  onAdvance,
  celebrateFn,
  toastFn,
}) {
  const plan = buildAdvancePrompt({ current, counts, scopeLabel });

  if (plan.kind === 'all_complete') {
    celebrateFn?.(getCompletionCelebration(scopeLabel));
    return false;
  }

  if (plan.kind === 'prompt' && plan.next) {
    const notify = toastFn || celebrateFn;
    notify?.(plan.message);
    onAdvance?.(plan.next);
    return true;
  }

  return false;
}
