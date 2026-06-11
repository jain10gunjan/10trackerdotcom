"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  BarChart2,
  Shield,
  Coins,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import WalletBar from "@/components/credits/WalletBar";
import logo from "@/assests/10tracker.png";
import {
  PRIMARY_NAV,
  MORE_NAV,
  isNavActive,
} from "@/lib/siteNav";

function getUserLabel(user) {
  return (
    user?.fullName ||
    user?.name ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.email ||
    "Profile"
  );
}

function getUserInitial(user) {
  const label = getUserLabel(user);
  return (label[0] || "U").toUpperCase();
}

const Navbar = () => {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    setUserMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen && !userMenuOpen) return undefined;

    const onDocumentClick = (e) => {
      if (
        moreOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target)
      ) {
        setMoreOpen(false);
      }
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    // Defer so the same click that opens a menu does not immediately close it
    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocumentClick);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocumentClick);
    };
  }, [moreOpen, userMenuOpen]);

  const moreActive = MORE_NAV.some((item) => isNavActive(pathname, item.path));

  const navPillClass = (active) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap ${
      active
        ? "bg-white text-neutral-900 shadow-sm"
        : "text-neutral-600 hover:text-neutral-900 hover:bg-white/70"
    }`;

  const handleSignOut = () => {
    signOut();
    setUserMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[4.25rem] overflow-visible border-b border-neutral-200/90 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
          >
            <Image
              src={logo}
              alt="10tracker.com"
              priority
              width={853}
              height={205}
              sizes="168px"
              className="h-9 w-[168px] object-contain object-left sm:h-10 sm:w-[186px]"
            />
            <span className="sr-only">10tracker.com</span>
          </Link>

          {/* Desktop nav — left-aligned pill bar */}
          <div className="hidden min-w-0 flex-1 items-center overflow-visible lg:flex">
            <div className="inline-flex max-w-full items-center gap-0.5 overflow-visible rounded-xl border border-neutral-200/80 bg-neutral-50/90 p-1">
              {PRIMARY_NAV.map((item) => {
                const active = isNavActive(pathname, item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={navPillClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={2} />
                    {item.name}
                  </Link>
                );
              })}

              <div className="relative z-20" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoreOpen((v) => !v);
                    setUserMenuOpen(false);
                  }}
                  className={`${navPillClass(moreActive)} ${moreOpen ? "bg-white shadow-sm text-neutral-900" : ""}`}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                >
                  More
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {moreOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-[calc(100%+6px)] z-[60] min-w-[168px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                      role="menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {MORE_NAV.map((item) => {
                        const active = isNavActive(pathname, item.path);
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                              active
                                ? "bg-neutral-50 font-medium text-neutral-900"
                                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                            }`}
                          >
                            <Icon className="h-4 w-4 text-neutral-400" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex lg:gap-3 lg:pl-3 lg:ml-1 lg:border-l lg:border-neutral-200">
            {user ? (
              <>
                <WalletBar compact />
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen((v) => !v);
                      setMoreOpen(false);
                    }}
                    className="flex max-w-[200px] items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2.5 text-left transition-colors hover:bg-neutral-50"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                      {getUserInitial(user)}
                    </span>
                    <span className="hidden truncate text-sm font-medium text-neutral-800 xl:block">
                      {getUserLabel(user)}
                    </span>
                    <ChevronDown
                      className={`hidden h-4 w-4 shrink-0 text-neutral-400 transition-transform xl:block ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                        role="menu"
                      >
                        <div className="border-b border-neutral-100 px-3 py-2.5">
                          <p className="truncate text-sm font-semibold text-neutral-900">
                            {getUserLabel(user)}
                          </p>
                          <p className="truncate text-xs text-neutral-500">
                            {user?.email || user?.primaryEmailAddress?.emailAddress || ""}
                          </p>
                        </div>
                        <Link
                          href="/"
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BarChart2 className="h-4 w-4 text-neutral-400" />
                          My Progress
                        </Link>
                        <Link
                          href="/pricing"
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Coins className="h-4 w-4 text-neutral-400" />
                          Plans & credits
                        </Link>
                        <Link
                          href="/profile"
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 text-neutral-400" />
                          Edit profile
                        </Link>
                        {isAdmin ? (
                          <Link
                            href="/admin"
                            role="menuitem"
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4 text-neutral-400" />
                            Admin
                          </Link>
                        ) : null}
                        <div className="my-1 border-t border-neutral-100" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile / tablet — nav lives in bottom bar; keep wallet / auth only */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {user ? (
              <>
                <WalletBar compact />
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white"
                  aria-label="Profile"
                >
                  {getUserInitial(user)}
                </Link>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
