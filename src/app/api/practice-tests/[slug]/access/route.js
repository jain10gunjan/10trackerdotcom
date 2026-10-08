import { NextResponse } from 'next/server';
import { resolveVendorAccess } from '@/features/vendor-tests/server/resolveVendorAccess';
import { primaryDomainHint } from '@/features/vendor-tests/lib/vendorAccess';

/**
 * GET /api/practice-tests/[slug]/access
 * Server-side access check. Non-members receive 403 (no test data).
 */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const result = await resolveVendorAccess(slug, { requireAuth: true, minRole: 'student' });

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        allowed: false,
        reason: result.reason,
        message: result.message,
        contactAdmin: result.contactAdmin,
        vendor: result.vendor || null,
        domainHint: primaryDomainHint(result.domains || []),
      },
      { status: result.status || 403 }
    );
  }

  return NextResponse.json({
    success: true,
    allowed: true,
    vendor: result.publicVendor,
    role: result.role,
    permissions: result.permissions,
    member: result.member
      ? {
          role: result.member.role,
          status: result.member.status,
          roll_no: result.member.roll_no,
          branch: result.member.branch,
          batch: result.member.batch,
          year: result.member.year,
        }
      : null,
  });
}
