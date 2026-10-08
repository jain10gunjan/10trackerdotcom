'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Instagram, Mail, MapPin, Twitter } from 'lucide-react';
import ReactGA from 'react-ga4';
import logo from '@/assets/10tracker.png';
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_LEARN_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_PRODUCT_LINKS,
} from '@/lib/siteNav';

function SocialLinks({ compact = false }) {
  const btnClass = compact
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800'
    : 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800';

  const iconSize = compact ? 14 : 16;

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <a href="mailto:contact@10tracker.com" className={btnClass} aria-label="Email">
        <Mail size={iconSize} />
      </a>
      <a
        href="https://x.com/10Tracker"
        className={btnClass}
        aria-label="X (Twitter)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Twitter size={iconSize} />
      </a>
      <a
        href="https://www.instagram.com/10trackerdotcom"
        className={btnClass}
        aria-label="Instagram"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Instagram size={iconSize} />
      </a>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/sign-up' || pathname === '/sign-in';
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!isAuthPage && typeof window !== 'undefined') {
      try {
        ReactGA.initialize('G-VYBMV6GVQQ');
        ReactGA.send('pageview');
      } catch (error) {
        console.error('GA initialization error:', error);
      }
    }
  }, [isAuthPage]);

  const quickLinks = [
    ...FOOTER_PRODUCT_LINKS.slice(1, 4),
    ...FOOTER_LEARN_LINKS,
    ...FOOTER_COMPANY_LINKS,
  ];

  return (
    <footer className="relative border-t border-neutral-200/90 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white">
      {/* Mobile */}
      <div className="md:hidden px-4 pt-6 pb-24">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-neutral-200/90 bg-white/90 p-4 shadow-sm">
            <Link href="/" className="inline-flex items-center">
              <Image
                src={logo}
                alt="10tracker.com"
                width={852}
                height={205}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              Exam practice, mock tests &amp; daily updates — in one place.
            </p>

            <nav
              className="mt-3.5 flex flex-wrap gap-1.5"
              aria-label="Footer navigation"
            >
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-3.5 flex items-center justify-between gap-3">
              <SocialLinks compact />
              <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                {FOOTER_LEGAL_LINKS.map((link, i) => (
                  <span key={link.href} className="inline-flex items-center gap-2">
                    {i > 0 ? <span aria-hidden="true">·</span> : null}
                    <Link href={link.href} className="hover:text-neutral-700 transition-colors">
                      {link.label}
                    </Link>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-neutral-400">
            &copy; {year} 10tracker. All rights reserved.
          </p>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 lg:py-12">
          <div className="grid grid-cols-12 gap-8 lg:gap-10">
            <div className="col-span-12 lg:col-span-4">
              <Link href="/" className="inline-flex">
                <Image
                  src={logo}
                  alt="10tracker.com"
                  width={853}
                  height={205}
                  className="h-10 w-auto object-contain object-left"
                />
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">
                Topic-wise MCQs, mock tests, jobs, and exam updates — built for competitive prep
                in India.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                <MapPin className="h-3.5 w-3.5" />
                Made with care in India
              </div>
              <div className="mt-4">
                <SocialLinks />
              </div>
            </div>

            <div className="col-span-6 sm:col-span-3 lg:col-span-2 lg:col-start-6">
              <FooterColumn title="Product" links={FOOTER_PRODUCT_LINKS} />
            </div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-2">
              <FooterColumn title="Learn" links={FOOTER_LEARN_LINKS} />
            </div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-2">
              <FooterColumn title="Company" links={FOOTER_COMPANY_LINKS} />
            </div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-2">
              <FooterColumn title="Legal" links={FOOTER_LEGAL_LINKS} />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-neutral-200/90 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              &copy; {year} 10tracker. All rights reserved.
            </p>
            <p className="text-xs text-neutral-400">
              <a
                href="mailto:contact@10tracker.com"
                className="font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                contact@10tracker.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
