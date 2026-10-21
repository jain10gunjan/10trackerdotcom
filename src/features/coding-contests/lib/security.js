import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string compare (UTF-8).
 * @param {string} a
 * @param {string} b
 */
export function safeEqualString(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) {
    // Still compare to reduce trivial timing leaks on length.
    const fill = Buffer.alloc(left.length);
    timingSafeEqual(left, fill);
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Best-effort client IP for rate limiting.
 * @param {Request} request
 */
export function getClientIp(request) {
  const xf = request.headers.get('x-forwarded-for') || '';
  if (xf) return xf.split(',')[0].trim().slice(0, 64);
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  ).slice(0, 64);
}

/** Strip fields that must never reach clients for other users. */
export function sanitizeSubmissionForClient(submission, { isOwner = false } = {}) {
  if (!submission) return null;
  const out = { ...submission };
  if (!isOwner) {
    delete out.source_code;
    delete out.custom_stdin;
  }
  return out;
}
