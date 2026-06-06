'use client';

import Link from 'next/link';
import { buildOnboardingBrowseHref } from '@/lib/profileGatePaths';

/** Footer links on the profile onboarding screen */
export default function OnboardingBrowseLinks({ returnPath = '/' }) {
  const items = [
    { href: '/terms-and-services', label: 'Terms' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/disclaimer', label: 'Disclaimer' },
    { href: '/about-us', label: 'About us' },
    { href: '/contact-us', label: 'Contact' },
  ];

  return (
    <p className="mt-6 text-center text-xs text-neutral-500 leading-relaxed">
      You can read our{' '}
      {items.map((item, i) => (
        <span key={item.href}>
          {i > 0 && (i === items.length - 1 ? ', and ' : ', ')}
          <Link
            href={buildOnboardingBrowseHref(item.href, returnPath)}
            className="underline text-neutral-700 hover:text-neutral-900"
          >
            {item.label}
          </Link>
        </span>
      ))}{' '}
      before continuing.
    </p>
  );
}
