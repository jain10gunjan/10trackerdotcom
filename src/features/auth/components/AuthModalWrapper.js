'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AuthModal from './AuthModal.js';
import { useAuth } from '@/context/AuthContext';
import { getAuthModalContext } from '@/features/auth/lib/authModalContext';
import { buildAuthResumePath } from '@/lib/profileGatePaths';

export default function AuthModalWrapper() {
  const { showAuthModal, closeAuthModal, authModalOverride, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const returnPath = useMemo(() => {
    const q = searchParams?.toString();
    return `${pathname || '/'}${q ? `?${q}` : ''}`;
  }, [pathname, searchParams]);

  const modalContext = useMemo(
    () =>
      authModalOverride ??
      getAuthModalContext(pathname, searchParams?.toString() ? `?${searchParams.toString()}` : ''),
    [authModalOverride, pathname, searchParams]
  );

  const handleClose = useCallback(() => {
    closeAuthModal();
  }, [closeAuthModal]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle({
        redirectUrl: buildAuthResumePath('sign-in', returnPath),
      });
    } catch (error) {
      console.error('Sign-in error in wrapper:', error);
      throw error;
    }
  }, [signInWithGoogle, returnPath]);

  return (
    <AuthModal
      isOpen={showAuthModal}
      onClose={handleClose}
      onGoogleSignIn={handleGoogleSignIn}
      title={modalContext.title}
      subtitle={modalContext.subtitle}
      showBenefits={modalContext.showBenefits}
      allowGuestContinue={modalContext.allowGuestContinue}
      signUpHref={modalContext.signUpHref}
    />
  );
}
