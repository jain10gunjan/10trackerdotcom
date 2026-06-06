"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Twitter, Instagram, Mail, MapPin } from "lucide-react";
import ReactGA from "react-ga4";
import logo from "@/assests/10tracker.png";

const Footer = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/sign-up' || pathname === '/sign-in';
  
  useEffect(() => {
    // Don't initialize GA on auth pages for better performance
    if (!isAuthPage && typeof window !== 'undefined') {
      try {
        ReactGA.initialize("G-VYBMV6GVQQ");
        ReactGA.send("pageview");
      } catch (error) {
        console.error("GA initialization error:", error);
      }
    }
  }, [isAuthPage]);

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top: Brand + navigation + social */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 pb-8">
          {/* Brand Section */}
          <div className="md:col-span-4 flex flex-col items-start max-w-md">
            <Link href="/" className="mb-3 inline-flex items-center">
              <Image
                src={logo}
                alt="10tracker.com"
                className="h-auto w-36 sm:w-40 md:w-44"
              />
              <span className="sr-only">10tracker.com</span>
            </Link>
            <p className="text-sm md:text-base text-gray-600 italic font-light leading-relaxed">
              Practice smarter, track better, achieve more. Exams, PYQs, jobs and
              news — in one clean dashboard.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Made with care in India
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Exams & practice
              </h3>
              <ul className="space-y-1.5 text-gray-600">
                <li>
                  <Link href="/exams" className="hover:text-gray-900 transition-colors">
                    All exams
                  </Link>
                </li>
                <li>
                  <Link href="/gate-cse" className="hover:text-gray-900 transition-colors">
                    GATE CSE
                  </Link>
                </li>
                <li>
                  <Link href="/upsc/prelims" className="hover:text-gray-900 transition-colors">
                    UPSC Prelims
                  </Link>
                </li>
                <li>
                  <Link href="/roadmaps" className="hover:text-gray-900 transition-colors">
                    Study roadmaps
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-gray-900 transition-colors">
                    Plans & pricing
                  </Link>
                </li>
                <li>
                  <Link href="/practice-unlimited" className="hover:text-gray-900 transition-colors">
                    Practice unlimited
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                News & jobs
              </h3>
              <ul className="space-y-1.5 text-gray-600">
                <li>
                  <Link href="/article/news" className="hover:text-gray-900 transition-colors">
                    News & updates
                  </Link>
                </li>
                <li>
                  <Link href="/article/latest-jobs" className="hover:text-gray-900 transition-colors">
                    Govt jobs
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className="hover:text-gray-900 transition-colors">
                    All articles
                  </Link>
                </li>
              </ul>
            </div>

            <div className="hidden sm:block">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                About
              </h3>
              <ul className="space-y-1.5 text-gray-600">
                <li>
                  <Link href="/about-us" className="hover:text-gray-900 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" className="hover:text-gray-900 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Section */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-4">
              Stay in touch
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="mailto:contact@10tracker.com"
                className="w-10 h-10 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                aria-label="Email"
              >
                <Mail size={18} />
              </Link>
              <Link
                href="https://x.com/10Tracker"
                className="w-10 h-10 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </Link>
              <Link
                href="https://www.instagram.com/10tracker/"
                className="w-10 h-10 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} 10tracker. All rights reserved.</p>
          <div className="flex items-center flex-wrap justify-center gap-3">
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <Link href="/roadmaps" className="hover:text-gray-700 transition-colors">
              Roadmaps
            </Link>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <Link href="/pricing" className="hover:text-gray-700 transition-colors">
              Pricing
            </Link>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <Link href="/terms-and-services" className="hover:text-gray-700 transition-colors">
              Terms
            </Link>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <Link href="/disclaimer" className="hover:text-gray-700 transition-colors">
              Disclaimer
            </Link>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <Link href="/articles" className="hover:text-gray-700 transition-colors">
              Articles
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
