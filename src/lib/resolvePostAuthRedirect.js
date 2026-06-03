import { getSafeRedirect } from '@/lib/safeRedirect';

/**
 * After sign-in/sign-up, send incomplete profiles to /profile first.
 */
export async function resolvePostAuthRedirect(redirectUrl = '/') {
  const safe = getSafeRedirect(redirectUrl) || '/';
  try {
    const res = await fetch('/api/user/profile', { credentials: 'include' });
    const data = await res.json();
    if (data.success && data.needsProfile) {
      return `/profile?redirect=${encodeURIComponent(safe)}`;
    }
  } catch {
    // fall through to original destination
  }
  return safe;
}
