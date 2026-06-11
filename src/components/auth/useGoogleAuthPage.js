'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { resolvePostAuthRedirect } from '@/lib/resolvePostAuthRedirect';
import { buildAuthResumePath } from '@/lib/profileGatePaths';
import { getAuthRedirectHint } from '@/lib/auth/authRedirectHint';

export function useGoogleAuthPage(authPage = 'sign-in') {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectUrl = useMemo(
    () => getSafeRedirect(searchParams.get('redirect')) || '/',
    [searchParams]
  );

  const redirectHint = useMemo(() => getAuthRedirectHint(redirectUrl), [redirectUrl]);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (!authError) return;
    if (authError === 'Configuration') {
      setError(
        'Google sign-in is misconfigured. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local, then restart the dev server.'
      );
      return;
    }
    if (authError === 'AccessDenied') {
      setError('Sign-in was cancelled or denied.');
      return;
    }
    setError('Sign-in failed. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    (async () => {
      const target = await resolvePostAuthRedirect(redirectUrl);
      if (!cancelled) router.replace(target);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router, redirectUrl]);

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: buildAuthResumePath(authPage, redirectUrl),
      });
    } catch (err) {
      console.error('Google auth failed:', err);
      setError('Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const alternateHref = useMemo(() => {
    const other = authPage === 'sign-up' ? '/sign-in' : '/sign-up';
    if (redirectUrl && redirectUrl !== '/') {
      return `${other}?redirect=${encodeURIComponent(redirectUrl)}`;
    }
    return other;
  }, [authPage, redirectUrl]);

  return {
    isLoading,
    error,
    redirectHint,
    handleGoogleAuth,
    alternateHref,
    isAuthenticated: status === 'authenticated',
  };
}
