/**
 * Image host helpers for featured images served by the automation API
 * (e.g. https://services.10tracker.com/api/images/:id).
 */

import { isAutomationImageUrl } from './resolveFeaturedImageUrl.js';

function parseHostFromUrl(raw) {
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

/** Hostnames allowed for next/image (server + client). */
export function getAutomationImageHostnames() {
  const hosts = new Set([
    'services.10tracker.com',
    '10tracker.com',
    'gateoverflow.in',
    'images.unsplash.com',
    'localhost',
    '127.0.0.1',
  ]);

  for (const key of ['AUTOMATION_API_URL', 'NEXT_PUBLIC_AUTOMATION_API_URL']) {
    const host = parseHostFromUrl(process.env[key]);
    if (host) hosts.add(host);
  }

  return [...hosts];
}

/** True when src is safe to pass to next/image given configured hosts. */
export function isNextImageAllowedSrc(src) {
  if (!src || typeof src !== 'string') return false;

  if (isAutomationImageUrl(src)) {
    return true;
  }

  if (!src.startsWith('http')) {
    return src.includes('10tracker.com') || src.includes('gateoverflow.in');
  }

  try {
    const hostname = new URL(src).hostname;
    return getAutomationImageHostnames().includes(hostname);
  } catch {
    return getAutomationImageHostnames().some((h) => src.includes(h));
  }
}

/** remotePatterns entries for next.config.mjs */
export function getAutomationImageRemotePatterns() {
  const patterns = [];
  const seen = new Set();

  for (const host of getAutomationImageHostnames()) {
    if (!host || seen.has(host)) continue;
    seen.add(host);
    const protocol = host === 'localhost' || host === '127.0.0.1' ? 'http' : 'https';
    patterns.push({ protocol, hostname: host });
    if (protocol === 'http') {
      patterns.push({ protocol: 'https', hostname: host });
    }
  }

  return patterns;
}
