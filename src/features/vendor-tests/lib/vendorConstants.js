/** Shared constants for /practice-tests multi-tenant vendors */

export const SUPER_ADMIN_EMAIL = 'jain10gunjan@gmail.com';

export const ACCESS_MODES = {
  DOMAIN_ONLY: 'domain_only',
  DOMAIN_AND_ALLOWLIST: 'domain_and_allowlist',
  ALLOWLIST_ONLY: 'allowlist_only',
  OPEN_TO_ALL: 'open_to_all',
};

export const MEMBER_ROLES = {
  VENDOR_ADMIN: 'vendor_admin',
  VENDOR_STAFF: 'vendor_staff',
  STUDENT: 'student',
};

export const MEMBER_STATUSES = {
  INVITED: 'invited',
  ACTIVE: 'active',
  REVOKED: 'revoked',
};

export const VENDOR_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

/** Slugs that must never become vendor portals (conflict with product routes). */
export const RESERVED_VENDOR_SLUGS = new Set([
  'admin',
  'api',
  'sign-in',
  'sign-up',
  'profile',
  'mock-test',
  'practice',
  'practice-unlimited',
  'tests',
  'gate',
  'gate-cse',
  'upsc',
  'mhcet',
  'aptitude',
  'cat',
  'pricing',
  'checkout',
  'articles',
  'new',
  'create',
  'settings',
  'restricted',
]);

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
