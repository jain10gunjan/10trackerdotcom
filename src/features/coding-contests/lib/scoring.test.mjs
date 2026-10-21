import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeIcpcScore, sortLeaderboardRows } from './scoring.js';
import { VERDICTS } from '../../../lib/judge0/verdicts.js';

describe('computeIcpcScore', () => {
  const start = '2026-01-01T00:00:00.000Z';

  it('counts solved and applies wrong penalty (ignores CE)', () => {
    const result = computeIcpcScore(
      [
        {
          problemId: 'p1',
          verdict: VERDICTS.COMPILATION_ERROR,
          createdAt: '2026-01-01T00:05:00.000Z',
        },
        {
          problemId: 'p1',
          verdict: VERDICTS.WRONG_ANSWER,
          createdAt: '2026-01-01T00:10:00.000Z',
        },
        {
          problemId: 'p1',
          verdict: VERDICTS.ACCEPTED,
          createdAt: '2026-01-01T00:30:00.000Z',
        },
      ],
      { contestStartedAt: start }
    );
    assert.equal(result.solvedCount, 1);
    // 30 min to AC + 20 for one WA (CE ignored)
    assert.equal(result.penaltyMinutes, 50);
  });

  it('sorts by solved then penalty', () => {
    const sorted = sortLeaderboardRows(
      [
        { solved_count: 1, penalty_minutes: 10, user_id: 'a' },
        { solved_count: 2, penalty_minutes: 100, user_id: 'b' },
        { solved_count: 1, penalty_minutes: 5, user_id: 'c' },
      ],
      'icpc'
    );
    assert.deepEqual(
      sorted.map((r) => r.user_id),
      ['b', 'c', 'a']
    );
  });
});
