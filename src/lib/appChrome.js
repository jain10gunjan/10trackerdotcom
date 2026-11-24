/**
 * Shared chrome metrics — keep Navbar height and page top offsets in sync.
 * Navbar is fixed; pages that sit under it must reserve this space.
 */
export const APP_NAV_HEIGHT = '4.25rem';

/**
 * Content clear of the fixed nav. The signed-in home sets this as padding-top
 * on its page shell. AppChrome does not add a second top offset on `/`.
 */
export const APP_NAV_CONTENT_OFFSET = APP_NAV_HEIGHT;

/** Horizontal page gutter — match Navbar + max-w-7xl sections */
export const APP_GUTTER = 'px-4 sm:px-6 lg:px-8';

/** Mobile tab bar body. Matches the h-16 row; the home-indicator inset is extra. */
export const APP_MOBILE_TAB_HEIGHT = '4rem';

/**
 * Bottom padding the `/` route keeps below lg so content can scroll clear of
 * the fixed tab bar and the device safe area. Desktop drops it (`lg:pb-0`).
 * Same length as a 4rem bar when the inset is 0.
 */
export const APP_MOBILE_BOTTOM_CLEARANCE =
  'calc(4rem + env(safe-area-inset-bottom, 0px))';
