/** Subtle one-line hint from ?redirect= path (no assumptions about page content). */

export function getAuthRedirectHint(redirectPath) {
  if (!redirectPath || redirectPath === '/') return null;

  const path = redirectPath.split('?')[0].split('#')[0].toLowerCase();

  if (path.includes('/mock-test/') && path.includes('/attempt/')) {
    return 'Sign in to continue your mock test.';
  }
  if (path.includes('/mock-test/')) {
    return 'Sign in to start mock tests and save scores.';
  }
  if (path.endsWith('/practice') || path.includes('/practice/')) {
    return 'Sign in to save your practice progress.';
  }
  if (path.startsWith('/profile')) {
    return 'Sign in to complete your profile.';
  }
  if (path.match(/^\/[^/]+\/[^/]+/) && !path.startsWith('/mock-test')) {
    return 'Sign in to pick up where you left off.';
  }

  return 'You’ll return here after signing in.';
}
