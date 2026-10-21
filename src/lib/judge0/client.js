/**
 * Server-only Judge0 client. Never import from client components.
 */

import {
  assertJudge0Configured,
  buildJudge0Headers,
  getJudge0Config,
} from './config.js';
import { decodeSubmissionFields, toBase64 } from './encode.js';
import { resolveSubmissionLimits } from './limits.js';

const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 400;

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, query?: Record<string, string|number|boolean|undefined|null> }} [opts]
 */
async function judge0Fetch(path, opts = {}) {
  const cfg = assertJudge0Configured();
  const url = new URL(path.startsWith('http') ? path : `${cfg.baseUrl}${path}`);
  url.searchParams.set('base64_encoded', 'true');
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers = buildJudge0Headers(cfg);
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        method: opts.method || 'GET',
        headers,
        body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      });

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Judge0 HTTP ${res.status}`);
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_BACKOFF_MS * 2 ** attempt + Math.floor(Math.random() * 100));
          continue;
        }
        throw lastError;
      }

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const msg =
          data?.error || data?.message || data?.raw || `Judge0 HTTP ${res.status}`;
        throw new Error(String(msg));
      }
      return data;
    } catch (err) {
      lastError = err;
      const retryable =
        attempt < MAX_RETRIES &&
        (err?.cause?.code === 'ECONNRESET' ||
          err?.name === 'FetchError' ||
          /Judge0 HTTP (429|5\d\d)/.test(String(err?.message || '')));
      if (!retryable) throw err;
      await sleep(BASE_BACKOFF_MS * 2 ** attempt);
    }
  }
  throw lastError || new Error('Judge0 request failed');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function encodePayloadFields(payload) {
  const out = { ...payload };
  for (const key of ['source_code', 'stdin', 'expected_output']) {
    if (out[key] != null) out[key] = toBase64(out[key]);
  }
  return out;
}

export async function getLanguages() {
  const data = await judge0Fetch('/languages');
  return Array.isArray(data) ? data : [];
}

/**
 * @param {{
 *   source_code: string,
 *   language_id: number,
 *   stdin?: string|null,
 *   expected_output?: string|null,
 *   cpu_time_limit?: number,
 *   wall_time_limit?: number,
 *   memory_limit?: number,
 *   callback_url?: string|null,
 * }} submission
 * @param {{ wait?: boolean }} [opts]
 */
export async function createSubmission(submission, opts = {}) {
  const limits = resolveSubmissionLimits(submission);
  const body = encodePayloadFields({
    source_code: submission.source_code,
    language_id: submission.language_id,
    stdin: submission.stdin ?? null,
    expected_output: submission.expected_output ?? null,
    cpu_time_limit: limits.cpu_time_limit,
    wall_time_limit: limits.wall_time_limit,
    memory_limit: limits.memory_limit,
    callback_url: submission.callback_url || undefined,
  });

  const data = await judge0Fetch('/submissions', {
    method: 'POST',
    body,
    query: { wait: opts.wait === true },
  });
  return data;
}

/**
 * @param {Array<Record<string, unknown>>} submissions
 */
export async function createBatch(submissions) {
  const cfg = getJudge0Config();
  const encoded = submissions.map((s) => {
    const limits = resolveSubmissionLimits(s);
    return encodePayloadFields({
      source_code: s.source_code,
      language_id: s.language_id,
      stdin: s.stdin ?? null,
      expected_output: s.expected_output ?? null,
      cpu_time_limit: limits.cpu_time_limit,
      wall_time_limit: limits.wall_time_limit,
      memory_limit: limits.memory_limit,
      callback_url: s.callback_url || undefined,
    });
  });

  // Some RapidAPI plans omit callback; still send when configured.
  void cfg;
  const data = await judge0Fetch('/submissions/batch', {
    method: 'POST',
    body: { submissions: encoded },
  });
  return Array.isArray(data) ? data : data?.submissions || [];
}

export async function getSubmission(token) {
  const data = await judge0Fetch(`/submissions/${encodeURIComponent(token)}`, {
    query: { fields: '*' },
  });
  return decodeSubmissionFields(data);
}

/**
 * @param {string[]} tokens
 */
export async function getBatch(tokens) {
  if (!tokens?.length) return [];
  const data = await judge0Fetch('/submissions/batch', {
    query: {
      tokens: tokens.join(','),
      fields: '*',
    },
  });
  const list = Array.isArray(data) ? data : data?.submissions || [];
  return list.map(decodeSubmissionFields);
}

export function buildCallbackUrl(submissionResultId) {
  const cfg = getJudge0Config();
  if (!cfg.callbackBaseUrl || !cfg.webhookSecret) return null;
  const url = new URL('/api/judge0/webhook', `${cfg.callbackBaseUrl}/`);
  url.searchParams.set('secret', cfg.webhookSecret);
  if (submissionResultId) {
    url.searchParams.set('resultId', String(submissionResultId));
  }
  return url.toString();
}
