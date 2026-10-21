/**
 * Map Judge0 status ids → our verdict strings.
 * https://ce.judge0.com/#statuses-and-languages-status-get
 */

export const VERDICTS = Object.freeze({
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  COMPILATION_ERROR: 'Compilation Error',
  RUNTIME_ERROR: 'Runtime Error',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  INTERNAL_ERROR: 'Internal Error',
});

/** @type {Record<number, string>} */
const STATUS_MAP = {
  1: VERDICTS.QUEUED,
  2: VERDICTS.PROCESSING,
  3: VERDICTS.ACCEPTED,
  4: VERDICTS.WRONG_ANSWER,
  5: VERDICTS.TIME_LIMIT_EXCEEDED,
  6: VERDICTS.COMPILATION_ERROR,
  7: VERDICTS.RUNTIME_ERROR,
  8: VERDICTS.RUNTIME_ERROR,
  9: VERDICTS.RUNTIME_ERROR,
  10: VERDICTS.RUNTIME_ERROR,
  11: VERDICTS.RUNTIME_ERROR,
  12: VERDICTS.RUNTIME_ERROR,
  13: VERDICTS.INTERNAL_ERROR,
  14: VERDICTS.INTERNAL_ERROR,
  15: VERDICTS.MEMORY_LIMIT_EXCEEDED,
};

/**
 * @param {number|string|null|undefined} statusId
 * @param {{ description?: string } | null} [status]
 */
export function mapJudge0StatusToVerdict(statusId, status = null) {
  const id = Number(statusId);
  if (Number.isFinite(id) && STATUS_MAP[id]) return STATUS_MAP[id];

  const desc = String(status?.description || '').toLowerCase();
  if (desc.includes('accepted')) return VERDICTS.ACCEPTED;
  if (desc.includes('wrong answer')) return VERDICTS.WRONG_ANSWER;
  if (desc.includes('time limit')) return VERDICTS.TIME_LIMIT_EXCEEDED;
  if (desc.includes('compilation')) return VERDICTS.COMPILATION_ERROR;
  if (desc.includes('memory limit')) return VERDICTS.MEMORY_LIMIT_EXCEEDED;
  if (desc.includes('runtime')) return VERDICTS.RUNTIME_ERROR;
  if (desc.includes('queue')) return VERDICTS.QUEUED;
  if (desc.includes('processing')) return VERDICTS.PROCESSING;
  return VERDICTS.INTERNAL_ERROR;
}

export function isTerminalVerdict(verdict) {
  return ![VERDICTS.QUEUED, VERDICTS.PROCESSING].includes(verdict);
}

export function isAcceptedVerdict(verdict) {
  return verdict === VERDICTS.ACCEPTED;
}
