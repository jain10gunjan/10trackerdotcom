/**
 * Pluggable scoring. Default: ICPC (solved count + time penalty).
 */

import { ICPC_WRONG_PENALTY_MINUTES } from './constants.js';
import { VERDICTS } from '../../../lib/judge0/verdicts.js';

/**
 * @typedef {{
 *   ignoreCompilationErrorPenalty?: boolean,
 *   wrongPenaltyMinutes?: number,
 * }} IcpcOptions
 */

/**
 * @typedef {{
 *   problemId: string,
 *   verdict: string,
 *   createdAt: string|Date,
 * }} SubmissionLike
 */

/**
 * @param {SubmissionLike[]} submissions
 * @param {{ contestStartedAt: string|Date, options?: IcpcOptions }} ctx
 */
export function computeIcpcScore(submissions, ctx) {
  const options = {
    ignoreCompilationErrorPenalty: true,
    wrongPenaltyMinutes: ICPC_WRONG_PENALTY_MINUTES,
    ...(ctx.options || {}),
  };
  const startMs = new Date(ctx.contestStartedAt).getTime();

  /** @type {Map<string, { solved: boolean, solveTimeMin: number, wrongBeforeAc: number }>} */
  const byProblem = new Map();

  const sorted = [...(submissions || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const sub of sorted) {
    const pid = String(sub.problemId);
    if (!byProblem.has(pid)) {
      byProblem.set(pid, { solved: false, solveTimeMin: 0, wrongBeforeAc: 0 });
    }
    const row = byProblem.get(pid);
    if (row.solved) continue;

    if (sub.verdict === VERDICTS.ACCEPTED) {
      row.solved = true;
      row.solveTimeMin = Math.max(
        0,
        Math.floor((new Date(sub.createdAt).getTime() - startMs) / 60000)
      );
      continue;
    }

    if (
      options.ignoreCompilationErrorPenalty &&
      sub.verdict === VERDICTS.COMPILATION_ERROR
    ) {
      continue;
    }

    if (
      sub.verdict &&
      sub.verdict !== VERDICTS.QUEUED &&
      sub.verdict !== VERDICTS.PROCESSING
    ) {
      row.wrongBeforeAc += 1;
    }
  }

  let solvedCount = 0;
  let penaltyMinutes = 0;
  const problems = {};

  for (const [pid, row] of byProblem.entries()) {
    problems[pid] = row;
    if (row.solved) {
      solvedCount += 1;
      penaltyMinutes +=
        row.solveTimeMin + row.wrongBeforeAc * options.wrongPenaltyMinutes;
    }
  }

  return {
    mode: 'icpc',
    solvedCount,
    penaltyMinutes,
    // Higher solved is better; lower penalty is better (rank comparator uses both).
    score: solvedCount,
    problems,
  };
}

/**
 * Points-based stub — swap in later behind the same interface.
 * @param {SubmissionLike[]} submissions
 * @param {{ problemPoints?: Record<string, number> }} [ctx]
 */
export function computePointsScore(submissions, ctx = {}) {
  const pointsMap = ctx.problemPoints || {};
  const best = new Map();
  for (const sub of submissions || []) {
    if (sub.verdict !== VERDICTS.ACCEPTED) continue;
    const pid = String(sub.problemId);
    const pts = Number(pointsMap[pid] || 0);
    best.set(pid, Math.max(best.get(pid) || 0, pts));
  }
  let score = 0;
  for (const v of best.values()) score += v;
  return { mode: 'points', score, solvedCount: best.size, penaltyMinutes: 0, problems: {} };
}

/**
 * @param {'icpc'|'points'} mode
 */
export function getScoringStrategy(mode) {
  if (mode === 'points') {
    return { mode: 'points', compute: computePointsScore };
  }
  return { mode: 'icpc', compute: computeIcpcScore };
}

/**
 * Sort leaderboard rows: ICPC → more solved, then less penalty, then earlier last AC.
 * @param {Array<{ solved_count?: number, penalty_minutes?: number, score?: number, last_accepted_at?: string|null }>} rows
 * @param {'icpc'|'points'} [mode]
 */
export function sortLeaderboardRows(rows, mode = 'icpc') {
  const list = [...(rows || [])];
  if (mode === 'points') {
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  return list.sort((a, b) => {
    const sc = (b.solved_count || 0) - (a.solved_count || 0);
    if (sc !== 0) return sc;
    const pen = (a.penalty_minutes || 0) - (b.penalty_minutes || 0);
    if (pen !== 0) return pen;
    const aT = a.last_accepted_at ? new Date(a.last_accepted_at).getTime() : Infinity;
    const bT = b.last_accepted_at ? new Date(b.last_accepted_at).getTime() : Infinity;
    return aT - bT;
  });
}
