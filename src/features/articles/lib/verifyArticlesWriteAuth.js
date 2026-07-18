import { timingSafeEqual } from 'crypto';
import { verifyAdminAuth } from '@/middleware/adminAuth';

const SECRET_HEADER = 'x-automation-secret';

function secretsMatch(provided, expected) {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Allow article write / expensive pipelines when:
 * - caller has a valid admin NextAuth session, OR
 * - request includes x-automation-secret matching ARTICLES_AUTOMATION_SECRET
 */
export async function verifyAdminOrAutomationSecret(request) {
  const expected = process.env.ARTICLES_AUTOMATION_SECRET;
  const provided =
    request?.headers?.get?.(SECRET_HEADER) ||
    request?.headers?.get?.(SECRET_HEADER.toUpperCase());

  if (secretsMatch(provided, expected)) {
    return {
      ok: true,
      via: 'automation_secret',
      userEmail: null,
      userId: null,
    };
  }

  const { isAdmin, userId, userEmail, error } = await verifyAdminAuth();
  if (isAdmin) {
    return { ok: true, via: 'admin_session', userId, userEmail };
  }

  return {
    ok: false,
    error: error || 'Admin access or automation secret required',
  };
}

export function forbiddenArticlesWriteResponse(error) {
  return Response.json(
    { success: false, error: error || 'Admin access or automation secret required' },
    { status: 403 }
  );
}
