/**
 * Provider-agnostic Judge0 env config.
 * RapidAPI CE example:
 *   JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
 *   JUDGE0_AUTH_HEADER_NAME=X-RapidAPI-Key
 *   JUDGE0_AUTH_HEADER_VALUE=...
 *   JUDGE0_HOST_HEADER=judge0-ce.p.rapidapi.com
 */

export function getJudge0Config() {
  const baseUrl = String(process.env.JUDGE0_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const authHeaderName = String(process.env.JUDGE0_AUTH_HEADER_NAME || '').trim();
  const authHeaderValue = String(process.env.JUDGE0_AUTH_HEADER_VALUE || '').trim();
  const hostHeader = String(process.env.JUDGE0_HOST_HEADER || '').trim();
  const webhookSecret = String(process.env.JUDGE0_WEBHOOK_SECRET || '').trim();
  const callbackBaseUrl = String(
    process.env.JUDGE0_CALLBACK_BASE_URL || process.env.NEXTAUTH_URL || ''
  )
    .trim()
    .replace(/\/+$/, '');

  return {
    baseUrl,
    authHeaderName,
    authHeaderValue,
    hostHeader: hostHeader || null,
    webhookSecret: webhookSecret || null,
    callbackBaseUrl: callbackBaseUrl || null,
  };
}

export function assertJudge0Configured() {
  const cfg = getJudge0Config();
  const missing = [];
  if (!cfg.baseUrl) missing.push('JUDGE0_BASE_URL');
  if (!cfg.authHeaderName) missing.push('JUDGE0_AUTH_HEADER_NAME');
  if (!cfg.authHeaderValue) missing.push('JUDGE0_AUTH_HEADER_VALUE');
  if (missing.length) {
    throw new Error(`Judge0 is not configured. Missing: ${missing.join(', ')}`);
  }
  return cfg;
}

export function buildJudge0Headers(cfg = getJudge0Config()) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (cfg.authHeaderName && cfg.authHeaderValue) {
    headers[cfg.authHeaderName] = cfg.authHeaderValue;
  }
  if (cfg.hostHeader) {
    headers['X-RapidAPI-Host'] = cfg.hostHeader;
  }
  return headers;
}
