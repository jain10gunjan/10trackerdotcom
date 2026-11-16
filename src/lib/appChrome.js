/**
 * Shared chrome metrics — keep Navbar height and page top offsets in sync.
 * Navbar is fixed; pages that sit under it must reserve this space.
 */
export const APP_NAV_HEIGHT = '4.25rem';

/** Content clear of fixed nav — flush join into hero (no light seam) */
export const APP_NAV_CONTENT_OFFSET = '4.25rem';

/** Horizontal page gutter — match Navbar + max-w-7xl sections */
export const APP_GUTTER = 'px-4 sm:px-6 lg:px-8';
