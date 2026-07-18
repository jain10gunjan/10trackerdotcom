"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Twitter, Instagram, Mail, MapPin } from "lucide-react";
import ReactGA from "react-ga4";
import logo from "@/assets/10tracker.png";

const MOBILE_LINKS = [
  { label: "Exams", href: "/exams" },
  { label: "Pricing", href: "/pricing" },
  { label: "Roadmaps", href: "/roadmaps" },
  { label: "Updates", href: "/articles" },
  { label: "Contact", href: "/contact-us" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-services" },
  { label: "Disclaimer", href: "/disclaimer" },
];

const PRACTICE_LINKS = [
  { label: "All exams", href: "/exams" },
  { label: "Study roadmaps", href: "/roadmaps" },
  { label: "Plans & pricing", href: "/pricing" },
  { label: "Practice unlimited", href: "/practice-unlimited" },
];

const NEWS_LINKS = [
  { label: "Updates", href: "/articles" },
  { label: "Govt jobs", href: "/article/latest-jobs" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-services" },
  { label: "Disclaimer", href: "/disclaimer" },
];

function SocialLinks({ compact = false }) {
  const btnClass = compact
    ? "flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900"
    : "flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-emerald-200 hover:text-emerald-800 hover:bg-emerald-50/50";

  const iconSize = compact ? 15 : 18;

  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
      <Link href="mailto:contact@10tracker.com" className={btnClass} aria-label="Email">
        <Mail size={iconSize} />
      </Link>
      <Link
        href="https://x.com/10Tracker"
        className={btnClass}
        aria-label="Twitter"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Twitter size={iconSize} />
      </Link>
      <Link
        href="https://www.instagram.com/10tracker/"
        className={btnClass}
        aria-label="Instagram"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Instagram size={iconSize} />
      </Link>
    </div>
  );
}

const Footer = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === "/sign-up" || pathname === "/sign-in";

  useEffect(() => {
    if (!isAuthPage && typeof window !== "undefined") {
      try {
        ReactGA.initialize("G-VYBMV6GVQQ");
        ReactGA.send("pageview");
      } catch (error) {
        console.error("GA initialization error:", error);
      }
    }
  }, [isAuthPage]);

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      {/* Mobile — compact */}
      <div className="md:hidden px-4 pt-5 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image
              src={logo}
              alt="10tracker.com"
              width={853}
              height={205}
              className="h-10 w-[186px] object-contain"
            />
          </Link>

          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Exam practice, mock tests & daily updates — in one place.
          </p>

          <nav
            className="mt-4 flex flex-wrap items-center justify-center gap-2"
            aria-label="Footer navigation"
          >
            {MOBILE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex justify-center">
            <SocialLinks compact />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
            {LEGAL_LINKS.map((link, i) => (
              <React.Fragment key={link.href}>
                {i > 0 ? <span aria-hidden="true">·</span> : null}
                <Link href={link.href} className="hover:text-neutral-700 transition-colors">
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-neutral-400">
            &copy; {year} 10tracker. All rights reserved.
          </p>
        </div>
      </div>

      {/* Desktop — full */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 lg:py-14">
          <div className="grid grid-cols-12 gap-10 lg:gap-12">
            <div className="col-span-12 lg:col-span-4">
              <Link href="/" className="inline-flex">
                <Image
                  src={logo}
                  alt="10tracker.com"
                  width={853}
                  height={205}
                  className="h-12 w-[224px] object-contain object-left"
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">
                Practice smarter, track better, achieve more. Topic-wise MCQs, mock tests, jobs,
                and exam news — built for competitive prep.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                Made with care in India
              </div>
            </div>

            <div className="col-span-12 sm:col-span-4 lg:col-span-2 lg:col-start-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Practice
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-600">
                {PRACTICE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-6 sm:col-span-4 lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                News & jobs
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-600">
                {NEWS_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-6 sm:col-span-4 lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Company
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-600">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-5 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              &copy; {year} 10tracker. All rights reserved.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <SocialLinks />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-neutral-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
