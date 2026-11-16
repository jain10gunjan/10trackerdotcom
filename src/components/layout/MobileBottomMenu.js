'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  X,
  BarChart2,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import WalletBar from '@/features/credits/components/WalletBar';
import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton';
import {
  MOBILE_TAB_NAV,
  MORE_NAV,
  FOOTER_NAV,
  PRIMARY_NAV,
  isNavActive,
  isMoreNavActive,
} from '@/lib/siteNav';

function getUserLabel(user) {
  return user?.fullName || user?.name || user?.email || 'Account';
}

function getUserInitial(user) {
  return (getUserLabel(user)[0] || 'U').toUpperCase();
}

const MobileBottomMenu = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const pathname = usePathname();
  const { user, signOut, isAdmin, signInWithGoogle } = useAuth();

  const moreActive = isMoreNavActive(pathname);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle({ redirectUrl: pathname || '/' });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const tabClass = (active) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 touch-manipulation transition-colors ${
      active ? 'text-[#3F5EB9]' : 'text-neutral-500 hover:text-neutral-800'
    }`;

  const sheetLinkClass = (active) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation ${
      active
        ? 'bg-[#E8EDF8] text-[#1e2f6b]'
        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
    }`;

  const sheetExtras = PRIMARY_NAV.filter(
    (item) => !MOBILE_TAB_NAV.some((tab) => tab.path === item.path)
  );

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/90 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 pb-[env(safe-area-inset-bottom)] lg:hidden ${
          sheetOpen ? 'pointer-events-none opacity-0' : ''
        }`}
        aria-label="Mobile navigation"
        aria-hidden={sheetOpen || undefined}
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
          {MOBILE_TAB_NAV.map((item) => {
            const active = isNavActive(pathname, item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={tabClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
                <span className="w-full truncate text-center text-[10px] font-medium leading-tight">
                  {item.name}
                </span>
                <span
                  className={`h-0.5 w-5 rounded-full transition-colors ${
                    active ? 'bg-[#3F5EB9]' : 'bg-transparent'
                  }`}
                />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen((open) => !open)}
            className={tabClass(moreActive || sheetOpen)}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
          >
            <LayoutGrid className="h-5 w-5 shrink-0" strokeWidth={moreActive || sheetOpen ? 2.25 : 2} />
            <span className="w-full truncate text-center text-[10px] font-medium leading-tight">More</span>
            <span
              className={`h-0.5 w-5 rounded-full transition-colors ${
                moreActive || sheetOpen ? 'bg-[#3F5EB9]' : 'bg-transparent'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Bottom sheet */}
      <AnimatePresence>
        {sheetOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-neutral-900/30 backdrop-blur-[2px] lg:hidden touch-manipulation"
              aria-label="Close menu"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[70] max-h-[min(85vh,640px)] overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-2xl lg:hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-neutral-200" aria-hidden />
              </div>

              <div className="flex items-center justify-between border-b border-neutral-100 px-4 pb-3 pt-1">
                <h2 className="text-base font-semibold text-neutral-900">Explore</h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 touch-manipulation"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className="overflow-y-auto overscroll-contain px-4 py-3"
                style={{ maxHeight: 'calc(min(85vh, 640px) - 120px)' }}
              >
                {user ? (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                      {getUserInitial(user)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {getUserLabel(user)}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{user.email || ''}</p>
                    </div>
                    <WalletBar compact />
                  </div>
                ) : null}

                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Practice
                </p>
                <div className="mb-4 space-y-0.5">
                  {sheetExtras.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(pathname, item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSheetOpen(false)}
                        className={sheetLinkClass(active)}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
                        {item.name}
                      </Link>
                    );
                  })}
                  {user ? (
                    <Link
                      href="/"
                      onClick={() => setSheetOpen(false)}
                      className={sheetLinkClass(pathname === '/' && user)}
                    >
                      <BarChart2 className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
                      My progress
                    </Link>
                  ) : null}
                </div>

                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  More
                </p>
                <div className="mb-4 space-y-0.5">
                  {MORE_NAV.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(pathname, item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSheetOpen(false)}
                        className={sheetLinkClass(active)}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                {user ? (
                  <div className="mb-4 space-y-0.5 border-t border-neutral-100 pt-3">
                    <Link
                      href="/profile?redirect=/"
                      onClick={() => setSheetOpen(false)}
                      className={sheetLinkClass(pathname === '/profile')}
                    >
                      <User className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
                      Edit profile
                    </Link>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setSheetOpen(false)}
                        className={sheetLinkClass(pathname?.startsWith('/admin'))}
                      >
                        <Shield className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
                        Admin
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setSheetOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 touch-manipulation"
                    >
                      <LogOut className="h-[18px] w-[18px] shrink-0" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="mb-4 border-t border-neutral-100 pt-3">
                    <GoogleAuthButton
                      size="hero"
                      label="Sign in with Google"
                      loadingLabel="Signing in…"
                      loading={googleLoading}
                      onClick={handleGoogleSignIn}
                      className="w-full justify-center"
                    />
                  </div>
                )}

                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Legal
                </p>
                <div className="flex flex-wrap gap-2 pb-2">
                  {FOOTER_NAV.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSheetOpen(false)}
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-[#3F5EB9]/40 hover:bg-[#E8EDF8] hover:text-[#1e2f6b] touch-manipulation"
                    >
                      {item.name.replace(' Policy', '').replace(' of Service', '')}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomMenu;
