import {
  Home,
  BookOpenCheck,
  Route,
  BadgeIndianRupee,
  Megaphone,
  BriefcaseBusiness,
  Info,
  Mail,
  Shield,
  FileText,
} from 'lucide-react';

/**
 * Flip to true when OG Trackers / roadmaps relaunch.
 * Keeps routes and feature code intact while hiding product surfaces.
 */
export const SHOW_OG_TRACKERS = true;

/** Hide roadmap catalog/pricing cards. Routes still 308 to OG Trackers. */
export const SHOW_ROADMAPS = false;

/** OG Trackers are free; do not gate paths behind the old ₹499 premium flag. */
export const OG_PREMIUM_REQUIRED = false;

const PRIMARY_NAV_ALL = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Exams', path: '/exams', icon: BookOpenCheck },
  { name: 'OG Trackers', path: '/og-trackers', icon: Route, launchLater: true },
  { name: 'Pricing', path: '/pricing', icon: BadgeIndianRupee },
  { name: 'Updates', path: '/articles', icon: Megaphone },
];

export const PRIMARY_NAV = PRIMARY_NAV_ALL.filter(
  (item) => SHOW_OG_TRACKERS || !item.launchLater
);

export const MORE_NAV = [
  { name: 'Jobs', path: '/article/latest-jobs', icon: BriefcaseBusiness },
  { name: 'About', path: '/about-us', icon: Info },
  { name: 'Contact', path: '/contact-us', icon: Mail },
];

export const FOOTER_NAV = [
  { name: 'Privacy Policy', path: '/privacy-policy', icon: Shield },
  { name: 'Terms of Service', path: '/terms-and-services', icon: FileText },
  { name: 'Disclaimer', path: '/disclaimer', icon: FileText },
];

/** Product links shown in the site footer (live routes only). */
export const FOOTER_PRODUCT_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Exams', href: '/exams' },
  { label: 'Pricing', href: '/pricing' },
  ...(SHOW_OG_TRACKERS ? [{ label: 'OG Trackers', href: '/og-trackers' }] : []),
];

export const FOOTER_LEARN_LINKS = [{ label: 'Updates', href: '/articles' }];

export const FOOTER_COMPANY_LINKS = [
  { label: 'About', href: '/about-us' },
  { label: 'Contact', href: '/contact-us' },
];

export const FOOTER_LEGAL_LINKS = FOOTER_NAV.map((item) => ({
  label:
    item.name === 'Privacy Policy'
      ? 'Privacy'
      : item.name === 'Terms of Service'
        ? 'Terms'
        : item.name,
  href: item.path,
}));

/** Guest catalog anchor — pick an exam, then open mock tests from the card. */
export const GUEST_MOCKS_HREF = '/exams#mock-tests';

/** Progress/ranks need an account — send guests to exams; close-band Google CTA handles sign-in. */
export const GUEST_PROGRESS_HREF = '/exams';

/** Core tabs shown in the mobile bottom bar (4 slots + More). */
export const MOBILE_TAB_NAV = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Exams', path: '/exams', icon: BookOpenCheck },
  ...(SHOW_OG_TRACKERS
    ? [{ name: 'OG Trackers', path: '/og-trackers', icon: Route, launchLater: true }]
    : [{ name: 'Updates', path: '/articles', icon: Megaphone }]),
  { name: 'Pricing', path: '/pricing', icon: BadgeIndianRupee },
];

export function isNavActive(pathname, path) {
  const p = pathname || '/';
  if (path === '/') return p === '/';
  if (path === '/articles') return p === '/articles' || p.startsWith('/article/');
  if (path === '/pricing') return p === '/pricing';
  return p === path || p.startsWith(`${path}/`);
}

export function isMoreNavActive(pathname) {
  const ogActive =
    SHOW_OG_TRACKERS &&
    (isNavActive(pathname, '/og-trackers') || isNavActive(pathname, '/roadmaps'));

  return (
    MORE_NAV.some((item) => isNavActive(pathname, item.path)) ||
    ogActive ||
    PRIMARY_NAV.filter((item) => !MOBILE_TAB_NAV.some((t) => t.path === item.path)).some(
      (item) => isNavActive(pathname, item.path)
    )
  );
}
