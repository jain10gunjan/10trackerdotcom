import {
  Home,
  GraduationCap,
  Map,
  Coins,
  Newspaper,
  Briefcase,
  Info,
  Mail,
  Shield,
  FileText,
} from 'lucide-react';

export const PRIMARY_NAV = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Exams', path: '/exams', icon: GraduationCap },
  { name: 'Roadmaps', path: '/roadmaps', icon: Map },
  { name: 'Pricing', path: '/pricing', icon: Coins },
  { name: 'Updates', path: '/articles', icon: Newspaper },
];

export const MORE_NAV = [
  { name: 'Jobs', path: '/article/latest-jobs', icon: Briefcase },
  { name: 'About', path: '/about-us', icon: Info },
  { name: 'Contact', path: '/contact-us', icon: Mail },
];

export const FOOTER_NAV = [
  { name: 'Privacy Policy', path: '/privacy-policy', icon: Shield },
  { name: 'Terms of Service', path: '/terms-and-services', icon: FileText },
  { name: 'Disclaimer', path: '/disclaimer', icon: FileText },
];

/** Core tabs shown in the mobile bottom bar */
export const MOBILE_TAB_NAV = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Exams', path: '/exams', icon: GraduationCap },
  { name: 'Pricing', path: '/pricing', icon: Coins },
  { name: 'Updates', path: '/articles', icon: Newspaper },
];

export function isNavActive(pathname, path) {
  const p = pathname || '/';
  if (path === '/') return p === '/';
  if (path === '/articles') return p === '/articles' || p.startsWith('/article/');
  if (path === '/pricing') return p === '/pricing';
  return p === path || p.startsWith(`${path}/`);
}

export function isMoreNavActive(pathname) {
  return (
    MORE_NAV.some((item) => isNavActive(pathname, item.path)) ||
    isNavActive(pathname, '/roadmaps') ||
    PRIMARY_NAV.filter((item) => !MOBILE_TAB_NAV.some((t) => t.path === item.path)).some(
      (item) => isNavActive(pathname, item.path)
    )
  );
}
