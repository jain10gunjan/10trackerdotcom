import { NextResponse } from 'next/server';
import { resolveVendorAccess } from './resolveVendorAccess';

/**
 * Resolve vendor access for an API route and return either a NextResponse error
 * or the access context.
 *
 * @param {string} slug
 * @param {'student'|'vendor_staff'|'vendor_admin'} minRole
 */
export async function requireVendorApi(slug, minRole = 'student') {
  const result = await resolveVendorAccess(slug, { requireAuth: true, minRole });
  if (!result.ok) {
    return {
      error: NextResponse.json(
        {
          success: false,
          allowed: false,
          reason: result.reason,
          error: result.message || 'Access denied',
          vendor: result.vendor || null,
        },
        { status: result.status || 403 }
      ),
      ctx: null,
    };
  }
  return { error: null, ctx: result };
}
