/** Routes users may browse during profile onboarding (navbar + no gate redirect) */
export const ONBOARDING_BROWSE_PATHS = [
  '/terms-and-services',
  '/privacy-policy',
  '/disclaimer',
  '/about-us',
  '/contact-us',
];

/** Routes reachable without a completed profile (signed-in users are not redirected to /profile) */
export const PROFILE_EXEMPT_PATHS = [
  '/profile',
  '/sign-in',
  '/sign-up',
  ...ONBOARDING_BROWSE_PATHS,
];

/** Public read-only article/news pages — never block while profile loads */
export function isPublicContentPath(pathname) {
  if (!pathname) return false;
  if (pathname === '/articles' || pathname.startsWith('/articles/')) return true;
  if (pathname === '/article' || pathname.startsWith('/article/')) return true;
  return false;
}

export function isHomeDashboardPath(pathname) {
  return pathname === '/';
}

export function isProfileExemptPath(pathname) {
  if (!pathname) return false;
  if (isPublicContentPath(pathname)) return true;
  if (isHomeDashboardPath(pathname)) return true;
  return PROFILE_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Info / legal pages shown with full site chrome while onboarding */
export function isOnboardingBrowsePath(pathname) {
  if (!pathname) return false;
  return ONBOARDING_BROWSE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** @deprecated use isOnboardingBrowsePath */
export function isPolicyPublicPath(pathname) {
  return isOnboardingBrowsePath(pathname);
}

/** Where the terms re-accept modal is hidden (user reads or accepts elsewhere) */
export function isTermsReacceptHiddenPath(pathname) {
  if (!pathname) return false;
  if (isOnboardingBrowsePath(pathname)) return true;
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return true;
  return false;
}

/** Append ?redirect= for returning to profile setup after reading a browse page */
export function buildOnboardingBrowseHref(path, returnPath = '/') {
  const base = path.startsWith('/') ? path : `/${path}`;
  const encoded =
    returnPath && returnPath !== '/'
      ? `?redirect=${encodeURIComponent(returnPath)}`
      : '';
  return `${base}${encoded}`;
}

/** OAuth callback lands here so resolvePostAuthRedirect can send incomplete profiles to /profile first */
export function buildAuthResumePath(authPage, returnPath = '/') {
  const page = authPage === 'sign-up' ? '/sign-up' : '/sign-in';
  const safeReturn = returnPath && returnPath !== page ? returnPath : '/';
  return `${page}?redirect=${encodeURIComponent(safeReturn)}`;
}

export function buildProfileSetupHref(returnPath = '/') {
  return `/profile?redirect=${encodeURIComponent(returnPath || '/')}`;
}
