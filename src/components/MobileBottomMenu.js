'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  X,
  ChevronRight,
  GraduationCap,
  BarChart2,
  User,
  LogIn,
  Info,
  Mail,
  Menu,
  Newspaper,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

const MobileBottomMenu = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState(null); // { message: string }
  const pathname = usePathname();
  const { user } = useAuth();
  const isActive = (path) => pathname === path;

  const showToast = (message) => {
    setToast({ message });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {/* Bottom bar: white theme */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        {/* subtle top divider + blur */}
        <div className="bg-white/95 backdrop-blur border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="relative h-16 px-3">
            {/* Center floating Menu button */}
            <button
              type="button"
              onClick={() => setShowMenu(true)}
              className={`absolute left-1/2 -translate-x-1/2 -top-4 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg border transition-all ${
                showMenu
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-900'
              }`}
              aria-label="Open menu"
            >
              <Menu className={`w-6 h-6 ${showMenu ? 'text-white' : 'text-neutral-900'}`} />
              <span className={`text-[10px] font-semibold mt-0.5 ${showMenu ? 'text-white' : 'text-neutral-800'}`}>
                Menu
              </span>
            </button>

            {/* Left / Right actions */}
            <div className="h-full grid grid-cols-3 items-end pb-2">
              <Link
                href="/"
                className={`flex flex-col items-center justify-center transition-colors min-w-0 py-2 ${
                  isActive('/') ? 'text-neutral-900' : 'text-neutral-500'
                }`}
              >
                <Home className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center">Home</span>
                <span
                  className={`mt-1 h-0.5 w-6 rounded-full ${
                    isActive('/') ? 'bg-neutral-900' : 'bg-transparent'
                  }`}
                />
              </Link>

              {/* spacer cell (center button lives above) */}
              <div />

              {user ? (
                <Link
                  href="/"
                  className={`flex flex-col items-center justify-center transition-colors min-w-0 py-2 ${
                    isActive('/') && pathname === '/' ? 'text-neutral-900' : 'text-neutral-500'
                  }`}
                >
                  <BarChart2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center">Progress</span>
                  <span
                    className={`mt-1 h-0.5 w-6 rounded-full ${
                      isActive('/') && pathname === '/' ? 'bg-neutral-900' : 'bg-transparent'
                    }`}
                  />
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className={`flex flex-col items-center justify-center transition-colors min-w-0 py-2 ${
                    isActive('/sign-in') ? 'text-neutral-900' : 'text-neutral-500'
                  }`}
                >
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center">Sign In</span>
                  <span
                    className={`mt-1 h-0.5 w-6 rounded-full ${
                      isActive('/sign-in') ? 'bg-neutral-900' : 'bg-transparent'
                    }`}
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-[80]"
          >
            <div className="rounded-full bg-neutral-900 text-white text-xs font-medium px-4 py-2 shadow-lg border border-neutral-800">
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer: white theme */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="md:hidden fixed inset-0 bg-black/40 z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-full max-w-[280px] bg-white border-l border-neutral-200 z-[70] flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 sticky top-0 z-10 bg-white">
                <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Quick links</p>
                  <div className="space-y-1">
                    <Link
                      href="/exams"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-800 hover:bg-neutral-100 transition-colors"
                    >
                      <GraduationCap className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1">All Exams</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => showToast('News is in progress — coming soon.')}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 bg-neutral-50 border border-neutral-200 cursor-not-allowed"
                    >
                      <Newspaper className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 text-left">News</span>
                      <span className="text-[11px] font-semibold text-neutral-300">Soon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Jobs is in progress — coming soon.')}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 bg-neutral-50 border border-neutral-200 cursor-not-allowed"
                    >
                      <Briefcase className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 text-left">Jobs</span>
                      <span className="text-[11px] font-semibold text-neutral-300">Soon</span>
                    </button>

                    {user ? (
                      <>
                        <Link
                          href="/"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-800 hover:bg-neutral-100 transition-colors"
                        >
                          <BarChart2 className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm font-medium flex-1">My Progress</span>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-800 hover:bg-neutral-100 transition-colors"
                        >
                          <User className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm font-medium flex-1">Edit profile</span>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/sign-in"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-800 hover:bg-neutral-100 transition-colors"
                      >
                        <LogIn className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">Sign In</span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">More</p>
                  <div className="space-y-1">
                    <Link
                      href="/about-us"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    >
                      <Info className="w-4 h-4 text-neutral-500" />
                      About Us
                    </Link>
                    <Link
                      href="/contact-us"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-neutral-500" />
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomMenu;
