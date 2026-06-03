/** Returns a same-origin path-only redirect target, or null if unsafe. */
export function getSafeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;

  let path = value;
  if (!value.startsWith('/') || value.startsWith('//')) {
    try {
      const url = new URL(value);
      if (typeof window !== 'undefined' && url.origin === window.location.origin) {
        path = `${url.pathname}${url.search}${url.hash}`;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  const pathname = path.split('?')[0].split('#')[0];
  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    return '/';
  }

  return path;
}
