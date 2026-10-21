import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { verifyWebhookSecret } from './webhookHandler.js';

describe('verifyWebhookSecret', () => {
  const prev = process.env.JUDGE0_WEBHOOK_SECRET;

  before(() => {
    process.env.JUDGE0_WEBHOOK_SECRET = 'test-secret-value';
  });

  after(() => {
    if (prev === undefined) delete process.env.JUDGE0_WEBHOOK_SECRET;
    else process.env.JUDGE0_WEBHOOK_SECRET = prev;
  });

  it('rejects missing secret', () => {
    const req = new Request('http://localhost/api/judge0/webhook', { method: 'POST' });
    const r = verifyWebhookSecret(req);
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });

  it('rejects bad secret', () => {
    const req = new Request('http://localhost/api/judge0/webhook?secret=wrong', {
      method: 'POST',
    });
    const r = verifyWebhookSecret(req);
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });

  it('accepts query secret', () => {
    const req = new Request(
      'http://localhost/api/judge0/webhook?secret=test-secret-value&resultId=abc',
      { method: 'POST' }
    );
    const r = verifyWebhookSecret(req);
    assert.equal(r.ok, true);
    assert.equal(r.resultId, 'abc');
  });

  it('accepts header secret', () => {
    const req = new Request('http://localhost/api/judge0/webhook', {
      method: 'POST',
      headers: { 'x-judge0-webhook-secret': 'test-secret-value' },
    });
    const r = verifyWebhookSecret(req);
    assert.equal(r.ok, true);
  });
});

describe('handleJudge0Webhook idempotency (unit)', () => {
  it('ignores unknown tokens without throwing', async () => {
    const { handleJudge0Webhook } = await import('./webhookHandler.js');
    process.env.JUDGE0_WEBHOOK_SECRET = 'test-secret-value';

    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => ({ data: null, error: null }),
        };
      },
    };

    const req = new Request('http://localhost/api/judge0/webhook?secret=test-secret-value', {
      method: 'POST',
    });
    const result = await handleJudge0Webhook(supabase, req, { token: 'missing-token', status: { id: 3 } });
    assert.equal(result.ok, true);
    assert.equal(result.ignored, true);
  });
});
