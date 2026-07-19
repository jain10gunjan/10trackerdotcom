// context/AuthContext.js
'use client'

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { getProgressUserId } from '@/lib/progressIdentity';

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  showAuthModal: false,
  authModalOverride: null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setShowAuthModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

function normalizeUser(sessionUser) {
  if (!sessionUser) return null;

  const email = sessionUser.email || '';
  const name = sessionUser.name || email.split('@')[0] || 'User';
  const progressId = getProgressUserId({ email, id: sessionUser.id });

  return {
    id: progressId,
    authId: sessionUser.id,
    email,
    name,
    image: sessionUser.image,
    fullName: name,
    displayName: name,
    primaryEmailAddress: { emailAddress: email },
    emailAddresses: email ? [{ emailAddress: email }] : [],
  };
}

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModalOpen] = useState(false);
  const [authModalOverride, setAuthModalOverride] = useState(null);

  const sessionUser = session?.user;
  const user = useMemo(
    () => normalizeUser(sessionUser),
    [sessionUser?.id, sessionUser?.email, sessionUser?.name, sessionUser?.image]
  );
  const loading = status === 'loading';

  const signInWithGoogle = useCallback(async (options = {}) => {
    const { redirectUrl } = options;
    await signIn('google', { callbackUrl: redirectUrl || '/' });
  }, []);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ callbackUrl: '/' });
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModalOpen(false);
    setAuthModalOverride(null);
  }, []);

  const openAuthModal = useCallback((override = null) => {
    setAuthModalOverride(override);
    setShowAuthModalOpen(true);
  }, []);

  const setShowAuthModal = useCallback(
    (open, override = null) => {
      if (open) openAuthModal(override);
      else closeAuthModal();
    },
    [openAuthModal, closeAuthModal]
  );

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = !!(user && adminEmails.length > 0 && (
    (user.email && adminEmails.includes(user.email.toLowerCase())) ||
    (Array.isArray(user.emailAddresses) &&
      user.emailAddresses.some(e =>
        e.emailAddress && adminEmails.includes(e.emailAddress.toLowerCase())
      ))
  ));

  const value = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin,
    showAuthModal,
    authModalOverride,
    openAuthModal,
    closeAuthModal,
    setShowAuthModal,
  }), [
    user,
    loading,
    isAdmin,
    showAuthModal,
    authModalOverride,
    openAuthModal,
    closeAuthModal,
    setShowAuthModal,
    signInWithGoogle,
    signOut,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
