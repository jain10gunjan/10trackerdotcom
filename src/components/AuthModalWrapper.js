// components/AuthModalWrapper.js
'use client'

import React, { useCallback } from 'react';
import AuthModal from './AuthModal.js';
import { useAuth } from '@/app/context/AuthContext';

export default function AuthModalWrapper() {
  const { showAuthModal, setShowAuthModal, signInWithGoogle } = useAuth();
  
  const handleClose = useCallback(() => {
    setShowAuthModal(false);
  }, [setShowAuthModal]);
  
  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in error in wrapper:', error);
    }
  }, [signInWithGoogle]);
  
  return (
    <AuthModal
      isOpen={showAuthModal}
      onClose={handleClose}
      onGoogleSignIn={handleGoogleSignIn}
    />
  );
}