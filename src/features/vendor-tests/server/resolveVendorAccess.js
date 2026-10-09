/**
 * End-to-end vendor access resolution for pages and API routes.
 */

import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  evaluateVendorAccess,
  isSuperAdminEmail,
  canManageAccessSettings,
  canManageTests,
  canViewAdminResults,
} from '../lib/vendorAccess';
import {
  ensureVendorMembership,
  fetchVendorAccessBundle,
  fetchVendorBySlug,
  fetchVendorMember,
  getVendorSupabase,
  publicVendorView,
  writeVendorAuditLog,
  VENDOR_DB_SETUP_HINT,
} from '../lib/vendorDb';

/**
 * @param {string} slug
 * @param {{ requireAuth?: boolean, minRole?: 'student'|'vendor_staff'|'vendor_admin' }} [options]
 */
export async function resolveVendorAccess(slug, options = {}) {
  const { requireAuth = true, minRole = 'student' } = options;

  try {
    const supabase = getVendorSupabase();
    const { vendor, error: vendorError } = await fetchVendorBySlug(supabase, slug);

    if (vendorError) {
      if (vendorError.code === '42P01' || /does not exist/i.test(vendorError.message || '')) {
        return failure(503, 'db_not_ready', VENDOR_DB_SETUP_HINT);
      }
      return failure(500, 'vendor_lookup_failed', vendorError.message);
    }

    if (!vendor) {
      return failure(404, 'vendor_not_found', 'Institute portal not found.');
    }

    const session = await auth();
    const email = normalizeEmail(session?.user?.email);
    const emailVerified = session?.user?.emailVerified === true;
    const hostedDomain = session?.user?.hostedDomain || null;

    if (requireAuth && !email) {
      return failure(401, 'unauthenticated', 'Sign in to continue.', {
        vendor: publicVendorView(vendor),
      });
    }

    const { settings, domains, error: bundleError } = await fetchVendorAccessBundle(
      supabase,
      vendor.id
    );
    if (bundleError) {
      return failure(500, 'access_settings_failed', bundleError.message, {
        vendor: publicVendorView(vendor),
      });
    }

    let member = null;
    if (email) {
      const mem = await fetchVendorMember(supabase, vendor.id, email);
      if (mem.error) {
        return failure(500, 'member_lookup_failed', mem.error.message, {
          vendor: publicVendorView(vendor),
        });
      }
      member = mem.member;
    }

    const decision = evaluateVendorAccess({
      email,
      emailVerified,
      hostedDomain,
      vendor,
      settings,
      domains,
      member,
    });

    if (!decision.allowed) {
      return {
        ok: false,
        status: decision.reason === 'unauthenticated' ? 401 : 403,
        reason: decision.reason,
        message: decision.message,
        contactAdmin: decision.contactAdmin,
        vendor: publicVendorView(vendor),
        domains: domains.map((d) => d.domain),
        session: email ? { email, emailVerified } : null,
      };
    }

    // Auto-enroll / activate invited
    if (email && (decision.autoEnrolled || decision.activateInvited)) {
      const ensured = await ensureVendorMembership(supabase, {
        vendorId: vendor.id,
        email,
        role: decision.role,
        source: decision.source || 'domain',
        activateInvited: !!decision.activateInvited,
        displayName: session?.user?.name || null,
      });
      if (ensured.error?.code === '23514' && decision.source === 'gmail') {
        ensured = await ensureVendorMembership(supabase, {
          vendorId: vendor.id,
          email,
          role: decision.role,
          source: 'allowlist',
          activateInvited: !!decision.activateInvited,
          displayName: session?.user?.name || null,
        });
      }
      if (ensured.error) {
        console.error('ensureVendorMembership', ensured.error);
      } else {
        member = ensured.member || member;
        if (decision.autoEnrolled) {
          await writeVendorAuditLog(supabase, {
            vendorId: vendor.id,
            actorEmail: email,
            action: 'member.auto_enrolled',
            entityType: 'vendor_member',
            entityId: member?.id,
            details: { source: decision.source },
          });
        }
      }
    }

    const role = decision.role;
    const isSuper = isSuperAdminEmail(email);
    const roleRank = { student: 1, vendor_staff: 2, vendor_admin: 3 };
    const need = roleRank[minRole] || 1;
    const have = isSuper ? 3 : roleRank[role] || 1;

    if (have < need) {
      return failure(403, 'insufficient_role', 'You do not have permission for this action.', {
        vendor: publicVendorView(vendor),
        role,
      });
    }

    return {
      ok: true,
      status: 200,
      vendor,
      publicVendor: publicVendorView(vendor),
      settings,
      domains,
      member,
      role,
      isSuperAdmin: isSuper,
      email,
      emailVerified,
      permissions: {
        manageAccess: canManageAccessSettings(role, isSuper),
        manageTests: canManageTests(role, isSuper),
        viewResults: canViewAdminResults(role, isSuper),
      },
      supabase,
    };
  } catch (err) {
    if (err?.code === 'VENDOR_SERVICE_ROLE_REQUIRED') {
      return failure(503, 'service_role_required', err.message);
    }
    console.error('resolveVendorAccess', err);
    return failure(500, 'internal_error', err.message || 'Internal error');
  }
}

function failure(status, reason, message, extra = {}) {
  return {
    ok: false,
    status,
    reason,
    message,
    contactAdmin: status === 403,
    ...extra,
  };
}
