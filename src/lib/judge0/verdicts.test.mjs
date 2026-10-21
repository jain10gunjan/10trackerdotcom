import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapJudge0StatusToVerdict, VERDICTS, isTerminalVerdict } from './verdicts.js';

describe('mapJudge0StatusToVerdict', () => {
  it('maps core status ids', () => {
    assert.equal(mapJudge0StatusToVerdict(3), VERDICTS.ACCEPTED);
    assert.equal(mapJudge0StatusToVerdict(4), VERDICTS.WRONG_ANSWER);
    assert.equal(mapJudge0StatusToVerdict(5), VERDICTS.TIME_LIMIT_EXCEEDED);
    assert.equal(mapJudge0StatusToVerdict(6), VERDICTS.COMPILATION_ERROR);
    assert.equal(mapJudge0StatusToVerdict(11), VERDICTS.RUNTIME_ERROR);
    assert.equal(mapJudge0StatusToVerdict(15), VERDICTS.MEMORY_LIMIT_EXCEEDED);
    assert.equal(mapJudge0StatusToVerdict(13), VERDICTS.INTERNAL_ERROR);
  });

  it('falls back to description', () => {
    assert.equal(
      mapJudge0StatusToVerdict(null, { description: 'Wrong Answer' }),
      VERDICTS.WRONG_ANSWER
    );
  });

  it('terminal detection', () => {
    assert.equal(isTerminalVerdict(VERDICTS.QUEUED), false);
    assert.equal(isTerminalVerdict(VERDICTS.ACCEPTED), true);
  });
});
