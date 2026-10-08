/**
 * Standalone domain checks (mirrors vendorDomain.js).
 * Run: node --test src/features/vendor-tests/lib/vendorDomain.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function parseEmailParts(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) return null;
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return null;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!local || !domain || domain.includes('@')) return null;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return null;
  return { local, domain };
}

function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '');
}

function domainMatches(emailDomain, allowedDomain, allowSubdomains = false) {
  const email = normalizeDomain(emailDomain);
  const allowed = normalizeDomain(allowedDomain);
  if (!email || !allowed) return false;
  if (email === allowed) return true;
  if (!allowSubdomains) return false;
  return email.endsWith(`.${allowed}`);
}

function emailMatchesAnyDomain(email, allowedDomains, allowSubdomains = false) {
  const parts = parseEmailParts(email);
  if (!parts) return false;
  return allowedDomains.some((d) =>
    domainMatches(parts.domain, typeof d === 'string' ? d : d?.domain, allowSubdomains)
  );
}

const domains = [{ domain: 'ipsacademy.org' }];

describe('vendorDomain', () => {
  it('parses email', () => {
    assert.deepEqual(parseEmailParts('  Student@IPSAcademy.org '), {
      local: 'student',
      domain: 'ipsacademy.org',
    });
  });

  it('exact only by default', () => {
    assert.equal(domainMatches('ipsacademy.org', 'ipsacademy.org', false), true);
    assert.equal(domainMatches('cs.ipsacademy.org', 'ipsacademy.org', false), false);
    assert.equal(domainMatches('ipsacademy.org.evil.com', 'ipsacademy.org', false), false);
  });

  it('subdomains when enabled', () => {
    assert.equal(domainMatches('cs.ipsacademy.org', 'ipsacademy.org', true), true);
    assert.equal(domainMatches('ipsacademy.org.evil.com', 'ipsacademy.org', true), false);
  });

  it('lookalikes denied', () => {
    assert.equal(emailMatchesAnyDomain('x@ipsacademy.org.evil.com', domains, false), false);
    assert.equal(emailMatchesAnyDomain('ipsacademy.org@gmail.com', domains, false), false);
    assert.equal(emailMatchesAnyDomain('x@ipsacademy.org', domains, false), true);
  });
});
