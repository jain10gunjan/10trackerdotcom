"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  LogOut,
  Menu,
  X,
  BarChart2,
  Shield,
  FileText,
  Info,
  Mail,
  GraduationCap,
  Newspaper,
  Briefcase,
  Coins,
  Map,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import WalletBar from "@/components/credits/WalletBar";
import logo from "@/assests/10tracker.png";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, setShowAuthModal, isAdmin } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = () => {
    signOut();
    setUserMenuOpen(false);
  };

  const mainNavItems = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Exams", path: "/exams", icon: <GraduationCap size={18} /> },
    { name: "Roadmaps", path: "/roadmaps", icon: <Map size={18} /> },
    { name: "News", path: "/article/news", icon: <Newspaper size={18} /> },
    { name: "Jobs", path: "/article/latest-jobs", icon: <Briefcase size={18} /> },
    { name: "About", path: "/about-us", icon: <Info size={18} /> },
    { name: "Contact", path: "/contact-us", icon: <Mail size={18} /> },
  ];

  const footerNavItems = [
    { name: "Privacy Policy", path: "/privacy-policy", icon: <Shield size={18} /> },
    { name: "Terms of Service", path: "/terms-and-services", icon: <FileText size={18} /> },
    { name: "Disclaimer", path: "/disclaimer", icon: <FileText size={18} /> },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center h-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="items-center gap-0"
                >
                  <Image
                    src={logo}
                    alt="10tracker.com"
                    priority
                    sizes="(max-width: 640px) 160px, 200px"
                    className="h-20 w-auto sm:h-16 md:h-24"
                  />
                  <span className="sr-only">10tracker.com</span>
                  {/* <p className="hidden lg:block text-sm italic font-light text-neutral-600 leading-none mt-0.5">
                    Practice → Track → Achieve
                  </p> */}
                </motion.div>
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className="group inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.name}
                  {typeof window !== "undefined" && (
                    <motion.div
                      className="h-0.5 w-0 bg-amber-500 mt-0.5"
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}

              {/* Integrated Auth component */}
              <div className="flex items-center gap-3 pl-3 ml-3 border-l border-neutral-200">
                {typeof window !== "undefined" && user ? (
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <WalletBar compact />
                      <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-semibold text-white">
                        {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || '').toUpperCase()}
                      </div>
                      <button
                        onClick={toggleUserMenu}
                        className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-900 transition-colors"
                      >
                        {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"}
                      </button>
                    </div>

                    {/* User dropdown menu */}
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-50"
                      >
                        <Link
                          href="/"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <BarChart2 size={16} className="mr-2" />
                            My Progress
                          </div>
                        </Link>
                        <Link
                          href="/pricing"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <Coins size={16} className="mr-2" />
                            Plans & credits
                          </div>
                        </Link>
                        <Link
                          href="/profile"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <User size={16} className="mr-2" />
                            Edit profile
                          </div>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              <Shield size={16} className="mr-2" />
                              Admin
                            </div>
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/sign-in"
                      className="px-4 py-2 rounded-lg font-medium border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="px-4 py-2 rounded-lg font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2 pr-1">
              {user && <WalletBar compact />}
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-20 left-0 right-0 bg-white shadow-xl border-t border-gray-100 z-50"
          >
            <div className="px-4 pt-4 pb-6 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Main Navigation Items */}
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                >
                  <span className="mr-3 text-gray-600">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              {/* User Progress - Show for all users */}
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
              >
                <BarChart2 size={18} className="mr-3 text-gray-600" />
                My Progress
              </Link>

              {/* Divider */}
              <div className="my-4 border-t border-gray-200"></div>

              {/* Mobile user profile or authentication */}
              {typeof window !== "undefined" && user ? (
                <>
                  <div className="flex items-center px-4 py-3 gap-3 bg-gray-50 rounded-lg mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg font-bold text-white shadow-sm">
                      {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || '').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.primaryEmailAddress?.emailAddress || ""}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <WalletBar />
                  </div>
                  <Link
                    href="/pricing"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                  >
                    <Coins size={18} className="mr-3 text-gray-600" />
                    Plans & credits
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                  >
                    <User size={18} className="mr-3 text-gray-600" />
                    Edit profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                    >
                      <Shield size={18} className="mr-3 text-gray-600" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="my-2 border-t border-gray-200"></div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 active:bg-red-100"
                  >
                    <LogOut size={18} className="mr-3" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 rounded-lg bg-neutral-900 text-white font-semibold text-base hover:bg-neutral-800 transition-all duration-200 active:scale-[0.98] text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 rounded-lg bg-white border border-neutral-300 text-neutral-900 font-semibold text-base hover:bg-neutral-50 transition-all duration-200 active:scale-[0.98] text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Footer Navigation Items */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  {footerNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                    >
                      <span className="mr-3 text-gray-500">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer strip for desktop */}
      <div className="hidden md:block bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 py-2" />
        </div>
      </div>
    </>
  );
};

export default Navbar;
