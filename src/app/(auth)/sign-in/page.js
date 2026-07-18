'use client';

import Link from 'next/link';
import AuthPageShell from '@/features/auth/components/AuthPageShell';
import AuthCard from '@/features/auth/components/AuthCard';
import AuthBrandMark from '@/features/auth/components/AuthBrandMark';
import GoogleAuthButton from '@/features/auth/components/GoogleAuthButton';
import AuthTrustFooter from '@/features/auth/components/AuthTrustFooter';
import AuthRedirectingState from '@/features/auth/components/AuthRedirectingState';
import { useGoogleAuthPage } from '@/features/auth/components/useGoogleAuthPage';

export default function SignInPage() {
  const { isLoading, isRedirecting, error, redirectHint, handleGoogleAuth, alternateHref } =
    useGoogleAuthPage('sign-in');

  if (isRedirecting) {
    return (
      <AuthRedirectingState
        title="Signing you in…"
        subtitle="Taking you to the right place"
      />
    );
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <AuthBrandMark />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome back</h1>
          {redirectHint ? (
            <p className="mt-2 text-sm text-emerald-700 font-medium">{redirectHint}</p>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">Sign in to continue on 10Tracker</p>
          )}
        </div>

        {error ? (
          <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-2xl">
            {error}
          </div>
        ) : null}

        <GoogleAuthButton
          onClick={handleGoogleAuth}
          loading={isLoading}
          loadingLabel="Signing in…"
          label="Continue with Google"
        />

        <p className="mt-5 text-center text-sm text-neutral-600">
          New here?{' '}
          <Link href={alternateHref} className="font-semibold text-emerald-700 hover:text-emerald-800">
            Create an account
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t border-neutral-100">
          <AuthTrustFooter />
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
