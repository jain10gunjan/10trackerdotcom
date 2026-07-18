'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfileModal() {
  const { showProfileModal, setShowProfileModal, user, signOut, isAuthenticated } = useAuth();

  if (!showProfileModal) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto"
      onClick={() => setShowProfileModal(false)}
    >
      <div
        className="w-full min-h-screen md:min-h-0 md:my-8 md:max-w-[95vw] lg:max-w-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white md:rounded-2xl shadow-2xl overflow-hidden h-full md:h-auto">
          <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">Your Profile</h3>
            <button
              onClick={() => setShowProfileModal(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Close modal"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {isAuthenticated && user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.fullName || 'Profile'}
                      className="w-16 h-16 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xl font-semibold">
                      {(user.fullName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{user.fullName || 'User'}</h4>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileModal(false)}
                    className="block w-full text-center px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Edit profile
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setShowProfileModal(false)}
                    className="block w-full text-center px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View Progress
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowProfileModal(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    type="button"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h4 className="text-xl font-semibold text-slate-900 mb-2">Sign in Required</h4>
                <p className="mb-6 text-slate-600">
                  Please sign in to view and manage your profile.
                </p>
                <Link
                  href="/sign-in"
                  onClick={() => setShowProfileModal(false)}
                  className="inline-block px-6 py-3 rounded-full bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                >
                  Sign In to Continue
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
