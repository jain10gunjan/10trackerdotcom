/** Routes reachable while signed in with an incomplete profile */
export const PROFILE_EXEMPT_PATHS = ['/profile', '/sign-in', '/sign-up'];

export function isProfileExemptPath(pathname) {
  if (!pathname) return false;
  return PROFILE_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
