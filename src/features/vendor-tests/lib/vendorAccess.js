/**
 * Server-side vendor access evaluation (closed-by-default tenants).
 */

import { normalizeEmail } from '@/lib/normalizeEmail';
import { isAdminEmail } from '@/features/mock-test/lib/mockTestUtils';
import {
  ACCESS_MODES,
  MEMBER_ROLES,
  MEMBER_STATUSES,
  SUPER_ADMIN_EMAIL,
  VENDOR_STATUSES,
} from './vendorConstants';
import { emailMatchesAnyDomain, parseEmailParts } from './vendorDomain';

export function isSuperAdminEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return false;
  if (e === SUPER_ADMIN_EMAIL) return true;
  return isAdminEmail(e);
}

/**
 * @param {object} params
 * @param {string|null} params.email
 * @param {boolean} params.emailVerified
 * @param {string|null} [params.hostedDomain] Google hd claim
 * @param {object} params.vendor — { id, slug, status, name, ... }
 * @param {object|null} params.settings — vendor_access_settings row
 * @param {Array<{domain:string}>|string[]} params.domains
 * @param {object|null} params.member — vendor_members row for this email
 */
export function evaluateVendorAccess({
  email,
  emailVerified = false,
  hostedDomain = null,
  vendor,
  settings,
  domains = [],
  member = null,
}) {
  const userEmail = normalizeEmail(email);

  if (!vendor || vendor.status !== VENDOR_STATUSES.ACTIVE) {
    return deny('vendor_unavailable', 'This institute portal is not available.');
  }

  if (!userEmail) {
    return deny('unauthenticated', 'Sign in to continue.');
  }

  // Platform super admin always allowed
  if (isSuperAdminEmail(userEmail)) {
    return allow({
      role: MEMBER_ROLES.VENDOR_ADMIN,
      source: 'super_admin',
      member,
      autoEnrolled: false,
    });
  }

  if (!emailVerified) {
    return deny(
      'email_unverified',
      'Your Google email is not verified. Use a verified account to access this institute portal.'
    );
  }

  if (member?.status === MEMBER_STATUSES.REVOKED) {
    return deny(
      'revoked',
      restrictedMessage(domains, vendor),
      { contactAdmin: true }
    );
  }

  const mode = settings?.access_mode || ACCESS_MODES.DOMAIN_AND_ALLOWLIST;
  const allowSubdomains = !!settings?.allow_subdomains;
  const autoEnroll = settings?.auto_enroll !== false;
  const requireHd = !!settings?.require_workspace_hd;
  const domainList = (domains || []).map((d) => (typeof d === 'string' ? d : d.domain));

  if (mode === ACCESS_MODES.OPEN_TO_ALL) {
    return resolveOpenOrMember({
      userEmail,
      member,
      autoEnroll,
      source: 'open',
    });
  }

  const domainOk = emailMatchesAnyDomain(userEmail, domainList, allowSubdomains);

  // Membership counts only if active/invited. Domain-sourced rows expire when
  // the email no longer matches any allowed domain (immediate on domain remove).
  const activeMember =
    member &&
    (member.status === MEMBER_STATUSES.ACTIVE || member.status === MEMBER_STATUSES.INVITED) &&
    !(member.source === 'domain' && !domainOk);

  if (requireHd && domainOk && domainList.length > 0) {
    const hd = normalizeEmail(hostedDomain || '');
    const hdOk = domainList.some((d) => hd === normalizeEmail(d));
    if (!hdOk) {
      return deny(
        'workspace_hd_required',
        'Sign in with your institute Google Workspace account.',
        { contactAdmin: true }
      );
    }
  }

  if (mode === ACCESS_MODES.ALLOWLIST_ONLY) {
    if (activeMember) {
      return allow({
        role: member.role || MEMBER_ROLES.STUDENT,
        source: member.source || 'allowlist',
        member,
        autoEnrolled: false,
        activateInvited: member.status === MEMBER_STATUSES.INVITED,
      });
    }
    return deny('not_allowlisted', restrictedMessage(domainList, vendor), {
      contactAdmin: true,
    });
  }

  if (mode === ACCESS_MODES.DOMAIN_ONLY) {
    if (!domainOk) {
      return deny('domain_mismatch', restrictedMessage(domainList, vendor), {
        contactAdmin: true,
      });
    }
    return resolveDomainMatch({ member, autoEnroll, userEmail });
  }

  // domain_and_allowlist (default)
  if (domainOk) {
    return resolveDomainMatch({ member, autoEnroll, userEmail });
  }
  if (activeMember) {
    return allow({
      role: member.role || MEMBER_ROLES.STUDENT,
      source: member.source || 'allowlist',
      member,
      autoEnrolled: false,
      activateInvited: member.status === MEMBER_STATUSES.INVITED,
    });
  }

  return deny('not_authorized', restrictedMessage(domainList, vendor), {
    contactAdmin: true,
  });
}

function resolveDomainMatch({ member, autoEnroll, userEmail }) {
  if (member?.status === MEMBER_STATUSES.REVOKED) {
    return deny('revoked', 'Your access to this institute portal was revoked.', {
      contactAdmin: true,
    });
  }
  if (member && (member.status === MEMBER_STATUSES.ACTIVE || member.status === MEMBER_STATUSES.INVITED)) {
    return allow({
      role: member.role || MEMBER_ROLES.STUDENT,
      source: member.source || 'domain',
      member,
      autoEnrolled: false,
      activateInvited: member.status === MEMBER_STATUSES.INVITED,
    });
  }
  if (autoEnroll) {
    return allow({
      role: MEMBER_ROLES.STUDENT,
      source: 'domain',
      member: null,
      autoEnrolled: true,
      userEmail,
    });
  }
  return deny('enrollment_required', 'Contact your institute admin to be enrolled.', {
    contactAdmin: true,
  });
}

function resolveOpenOrMember({ member, autoEnroll, source }) {
  if (member?.status === MEMBER_STATUSES.REVOKED) {
    return deny('revoked', 'Your access to this institute portal was revoked.', {
      contactAdmin: true,
    });
  }
  if (member && (member.status === MEMBER_STATUSES.ACTIVE || member.status === MEMBER_STATUSES.INVITED)) {
    return allow({
      role: member.role || MEMBER_ROLES.STUDENT,
      source: member.source || source,
      member,
      autoEnrolled: false,
      activateInvited: member.status === MEMBER_STATUSES.INVITED,
    });
  }
  if (autoEnroll) {
    return allow({
      role: MEMBER_ROLES.STUDENT,
      source,
      member: null,
      autoEnrolled: true,
    });
  }
  return allow({
    role: MEMBER_ROLES.STUDENT,
    source,
    member: null,
    autoEnrolled: false,
  });
}

function restrictedMessage(domains, vendor) {
  const list = (domains || []).map((d) => (typeof d === 'string' ? d : d?.domain)).filter(Boolean);
  const label = list.length === 1 ? `@${list[0]}` : list.length > 1 ? list.map((d) => `@${d}`).join(' or ') : 'approved institute';
  const name = vendor?.name || 'this institute';
  return `Access restricted to ${label} accounts. Contact your ${name} admin, or request access below.`;
}

function allow(extra) {
  return {
    allowed: true,
    reason: null,
    message: null,
    contactAdmin: false,
    ...extra,
  };
}

function deny(reason, message, extra = {}) {
  return {
    allowed: false,
    reason,
    message,
    contactAdmin: !!extra.contactAdmin,
    role: null,
    member: null,
    autoEnrolled: false,
    ...extra,
  };
}

export function canManageAccessSettings(role, isSuper) {
  return isSuper || role === MEMBER_ROLES.VENDOR_ADMIN;
}

export function canManageTests(role, isSuper) {
  return (
    isSuper ||
    role === MEMBER_ROLES.VENDOR_ADMIN ||
    role === MEMBER_ROLES.VENDOR_STAFF
  );
}

export function canViewAdminResults(role, isSuper) {
  return canManageTests(role, isSuper);
}

export function primaryDomainHint(domains) {
  const first = (domains || [])[0];
  const d = typeof first === 'string' ? first : first?.domain;
  return d ? `@${d}` : 'your institute';
}

export function emailDomainOf(email) {
  return parseEmailParts(email)?.domain || null;
}
