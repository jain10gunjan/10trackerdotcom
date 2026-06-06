import { getSafeRedirect } from '@/lib/safeRedirect';
import { buildProfileSetupHref } from '@/lib/profileGatePaths';

/**
 * After sign-in/sign-up, send incomplete profiles to /profile first.
 */
export async function resolvePostAuthRedirect(redirectUrl = '/') {
  const safe = getSafeRedirect(redirectUrl) || '/';
  try {
    const res = await fetch('/api/user/profile', { credentials: 'include' });
    const data = await res.json();
    if (data.success && data.needsProfile) {
      return buildProfileSetupHref(safe);
    }
  } catch {
    // fall through to original destination
  }
  return safe;
}
