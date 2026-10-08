/**
 * Domain matching for vendor access.
 * Exact match on the part after the last @. Subdomains only when allowSubdomains=true.
 * Blocks lookalikes like ipsacademy.org.evil.com and ipsacademy.org@x.com (handled by email parse).
 */

import { normalizeEmail } from '@/lib/normalizeEmail';

/** @returns {{ local: string, domain: string } | null} */
export function parseEmailParts(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) return null;
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return null;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!local || !domain || domain.includes('@')) return null;
  // Reject domains with leading/trailing dots or consecutive dots
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return null;
  }
  return { local, domain };
}

export function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '');
}

/**
 * Exact domain match, or subdomain of allowed domain when allowSubdomains is true.
 * "ipsacademy.org.evil.com" does NOT match "ipsacademy.org".
 */
export function domainMatches(emailDomain, allowedDomain, allowSubdomains = false) {
  const email = normalizeDomain(emailDomain);
  const allowed = normalizeDomain(allowedDomain);
  if (!email || !allowed) return false;
  if (email === allowed) return true;
  if (!allowSubdomains) return false;
  // Subdomain: foo.ipsacademy.org matches ipsacademy.org
  return email.endsWith(`.${allowed}`);
}

export function emailMatchesAnyDomain(email, allowedDomains, allowSubdomains = false) {
  const parts = parseEmailParts(email);
  if (!parts) return false;
  const list = Array.isArray(allowedDomains) ? allowedDomains : [];
  return list.some((d) =>
    domainMatches(parts.domain, typeof d === 'string' ? d : d?.domain, allowSubdomains)
  );
}

/** Lookalike / spoof helpers for tests and validation when adding domains */
export function isPlausibleDomain(domain) {
  const d = normalizeDomain(domain);
  if (!d || d.length < 3) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) {
    return false;
  }
  return true;
}
