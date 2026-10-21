export const MAX_SOURCE_BYTES = 64 * 1024;
export const SUBMIT_COOLDOWN_MS = 5000;
export const RUN_COOLDOWN_MS = 10000;
export const OUTPUT_TRUNCATE_BYTES = 10 * 1024;
export const ICPC_WRONG_PENALTY_MINUTES = 20;

export const SUBMISSION_STATUS = Object.freeze({
  QUEUED: 'queued',
  JUDGING: 'judging',
  DONE: 'done',
  ERROR: 'error',
});

export const JOB_TYPES = Object.freeze({
  JUDGE_SUBMISSION: 'judge_submission',
  POLL_SUBMISSION: 'poll_submission',
  RUN_CUSTOM: 'run_custom',
});

export const JOB_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  DONE: 'done',
  FAILED: 'failed',
});

export const CONTEST_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const SCORING_MODES = Object.freeze({
  ICPC: 'icpc',
  POINTS: 'points',
});
