/**
 * Chrome extension Bearer tokens + one-time connect codes.
 * Raw tokens/codes are shown once; DB stores SHA-256 hashes only.
 */

import crypto from 'crypto';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const TOKEN_TTL_DAYS = 90;

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

export function hashSecret(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function randomUrlToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Create a short-lived one-time connect code for the signed-in user.
 * @returns {{ code: string, expiresAt: string }}
 */
export async function createConnectCode(email, { label } = {}) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) throw new Error('Authentication required');

  const code = randomUrlToken(24);
  const codeHash = hashSecret(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const supabase = db();
  const { error } = await supabase.from('extension_connect_codes').insert({
    code_hash: codeHash,
    user_email: userEmail,
    label: String(label || 'Chrome extension').slice(0, 120),
    expires_at: expiresAt,
  });

  if (error) throw error;
  return { code, expiresAt };
}

/**
 * Exchange a one-time code for a long-lived API token (raw returned once).
 * @returns {{ token: string, email: string, expiresAt: string, tokenId: string }}
 */
export async function exchangeConnectCode(code, { label } = {}) {
  const rawCode = String(code || '').trim();
  if (!rawCode) throw new Error('code required');

  const codeHash = hashSecret(rawCode);
  const supabase = db();

  const { data: row, error } = await supabase
    .from('extension_connect_codes')
    .select('id, user_email, label, expires_at, used_at')
    .eq('code_hash', codeHash)
    .maybeSingle();

  if (error) throw error;
  if (!row) throw Object.assign(new Error('Invalid connect code'), { status: 401 });
  if (row.used_at) throw Object.assign(new Error('Connect code already used'), { status: 401 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw Object.assign(new Error('Connect code expired'), { status: 401 });
  }

  const { error: markErr } = await supabase
    .from('extension_connect_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('used_at', null);

  if (markErr) throw markErr;

  const issued = await issueApiToken(row.user_email, {
    label: label || row.label || 'Chrome extension',
  });
  return issued;
}

/**
 * Issue a revocable opaque Bearer token. Raw token returned once.
 */
export async function issueApiToken(email, { label } = {}) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) throw new Error('Authentication required');

  const token = randomUrlToken(32);
  const tokenHash = hashSecret(token);
  const expiresAt = new Date(
    Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const supabase = db();
  const { data, error } = await supabase
    .from('extension_api_tokens')
    .insert({
      user_email: userEmail,
      token_hash: tokenHash,
      label: String(label || 'Chrome extension').slice(0, 120),
      expires_at: expiresAt,
    })
    .select('id, expires_at')
    .single();

  if (error) throw error;

  return {
    token,
    email: userEmail,
    expiresAt: data.expires_at,
    tokenId: data.id,
  };
}

/**
 * Validate Authorization: Bearer <token>. Updates last_used_at.
 * @returns {{ email: string, tokenId: string } | null}
 */
export async function resolveExtensionToken(rawToken) {
  const token = String(rawToken || '').trim();
  if (!token) return null;

  const tokenHash = hashSecret(token);
  const supabase = db();

  const { data, error } = await supabase
    .from('extension_api_tokens')
    .select('id, user_email, label, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.revoked_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  // Fire-and-forget last_used update
  void supabase
    .from('extension_api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    email: normalizeEmail(data.user_email),
    tokenId: data.id,
    label: data.label || null,
  };
}

/**
 * Extract Bearer token from request and resolve to email.
 */
export async function requireExtensionToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return { error: 'Authentication required', status: 401, email: null, tokenId: null };
  }

  try {
    const resolved = await resolveExtensionToken(match[1]);
    if (!resolved?.email) {
      return { error: 'Invalid or expired token', status: 401, email: null, tokenId: null };
    }
    return {
      email: resolved.email,
      tokenId: resolved.tokenId,
      label: resolved.label || null,
      error: null,
      status: null,
    };
  } catch (err) {
    if (err?.code === '42P01' || /does not exist/i.test(String(err?.message || ''))) {
      return {
        error: 'Extension auth is not set up. Run setup_extension_tokens.sql.',
        status: 503,
        email: null,
        tokenId: null,
      };
    }
    throw err;
  }
}

export async function listTokensForEmail(email) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) return [];

  const supabase = db();
  const { data, error } = await supabase
    .from('extension_api_tokens')
    .select('id, label, created_at, last_used_at, expires_at, revoked_at')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Revoke one token by id, or the token used in the Bearer header, or all active.
 */
export async function revokeTokens(email, { tokenId, all, bearerToken } = {}) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) throw new Error('Authentication required');

  const supabase = db();
  const now = new Date().toISOString();

  if (all) {
    const { error } = await supabase
      .from('extension_api_tokens')
      .update({ revoked_at: now })
      .eq('user_email', userEmail)
      .is('revoked_at', null);
    if (error) throw error;
    return { revoked: 'all' };
  }

  if (tokenId) {
    const { data, error } = await supabase
      .from('extension_api_tokens')
      .update({ revoked_at: now })
      .eq('user_email', userEmail)
      .eq('id', tokenId)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Token not found'), { status: 404 });
    return { revoked: data.id };
  }

  if (bearerToken) {
    const tokenHash = hashSecret(bearerToken);
    const { data, error } = await supabase
      .from('extension_api_tokens')
      .update({ revoked_at: now })
      .eq('user_email', userEmail)
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Token not found'), { status: 404 });
    return { revoked: data.id };
  }

  throw Object.assign(new Error('tokenId, all, or Bearer token required'), { status: 400 });
}
