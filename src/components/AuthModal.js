'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import AuthBrandMark from '@/components/auth/AuthBrandMark';
import AuthBenefitStrip from '@/components/auth/AuthBenefitStrip';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import AuthTrustFooter from '@/components/auth/AuthTrustFooter';

const DEFAULT_CONTEXT = {
  title: 'Sign in to continue',
  subtitle: 'Save your progress and pick up where you left off.',
  showBenefits: true,
  allowGuestContinue: false,
  signUpHref: '/sign-up',
};

export default function AuthModal({
  isOpen,
  onClose,
  onGoogleSignIn,
  title,
  subtitle,
  showBenefits,
  allowGuestContinue,
  signUpHref,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const ctx = {
    title: title ?? DEFAULT_CONTEXT.title,
    subtitle: subtitle ?? DEFAULT_CONTEXT.subtitle,
    showBenefits: showBenefits ?? DEFAULT_CONTEXT.showBenefits,
    allowGuestContinue: allowGuestContinue ?? DEFAULT_CONTEXT.allowGuestContinue,
    signUpHref: signUpHref ?? DEFAULT_CONTEXT.signUpHref,
  };

  useEffect(() => {
    if (isOpen) setIsLoading(false);
  }, [isOpen]);

  const closeModal = useCallback(() => {
    if (isLoading) setIsLoading(false);
    onClose?.();
  }, [isLoading, onClose]);

  const handleClose = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      closeModal();
    },
    [closeModal]
  );

  const handleSignUpClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeModal();
    },
    [closeModal]
  );

  const handleGoogleSignIn = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (isLoading || typeof onGoogleSignIn !== 'function') return;
    try {
      setIsLoading(true);
      await onGoogleSignIn();
      onClose?.();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', onEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  useEffect(
    () => () => {
      document.body.style.overflow = 'unset';
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-neutral-900/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 z-10"
          aria-label="Close"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6 sm:p-8 pt-8">
          <AuthBrandMark />

          <div className="text-center mb-5">
            <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {ctx.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{ctx.subtitle}</p>
          </div>

          {ctx.showBenefits ? (
            <div className="mb-5">
              <AuthBenefitStrip compact />
            </div>
          ) : null}

          <GoogleAuthButton
            onClick={handleGoogleSignIn}
            loading={isLoading}
            loadingLabel="Signing in…"
            label="Continue with Google"
          />

          <p className="mt-4 text-center text-sm text-neutral-600">
            New here?{' '}
            <Link
              href={ctx.signUpHref}
              onClick={handleSignUpClick}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Create an account
            </Link>
          </p>

          {ctx.allowGuestContinue ? (
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="mt-3 w-full py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Continue without signing in
            </button>
          ) : null}

          <div className="mt-5 pt-5 border-t border-neutral-100">
            <AuthTrustFooter compact />
          </div>
        </div>
      </div>
    </div>
  );
}
