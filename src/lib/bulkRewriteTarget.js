/** Resolve which loaded MCQs a bulk rewrite batch should target. */

export const BULK_SCOPE = {
  CONTINUE: "continue",
  LAST_LOADED: "last_loaded",
  FROM_START: "from_start",
};

const MAX_BATCH = 20;

/**
 * @returns {{ list: object[], start: number, end: number, count: number }}
 */
export function resolveBulkTarget(
  mcqs,
  { scope, batchSize, nextStartIndex = 0, lastFetchCount = 0 }
) {
  const len = mcqs?.length ?? 0;
  if (!len) {
    return { list: [], start: 0, end: 0, count: 0 };
  }

  const cap = Math.min(Math.max(1, batchSize), MAX_BATCH, len);

  let start = 0;
  if (scope === BULK_SCOPE.FROM_START) {
    start = 0;
  } else if (scope === BULK_SCOPE.LAST_LOADED) {
    const fetchN = Math.min(Math.max(1, lastFetchCount || len), len);
    start = Math.max(0, len - fetchN);
  } else {
    start = Math.min(Math.max(0, nextStartIndex), len);
  }

  const end = Math.min(start + cap, len);
  return {
    list: mcqs.slice(start, end),
    start,
    end,
    count: end - start,
  };
}

export function scopeLabel(scope) {
  if (scope === BULK_SCOPE.LAST_LOADED) return "Last loaded page";
  if (scope === BULK_SCOPE.FROM_START) return "From beginning";
  return "Continue (next unprocessed)";
}
