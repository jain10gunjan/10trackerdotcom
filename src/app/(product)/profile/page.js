'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, LogOut, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import UserProfileForm from '@/features/profile/components/UserProfileForm';
import OnboardingBrowseLinks from '@/features/profile/components/OnboardingBrowseLinks';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { profileToFormDefaults } from '@/lib/userProfile';
import { TERMS_VERSION } from '@/features/billing/lib/legal';
import logo from '@/assets/10tracker.png';

function resolvePostSaveRedirect(raw) {
  const safe = getSafeRedirect(raw) || '/';
  if (safe === '/profile' || safe.startsWith('/profile?')) return '/';
  return safe;
}

const ONBOARDING_STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'dashboard', label: 'Dashboard' },
];

function OnboardingProgress() {
  return (
    <ol className="mt-5 flex items-center gap-2 sm:gap-3" aria-label="Setup progress">
      {ONBOARDING_STEPS.map((step, index) => {
        const done = index === 0;
        const current = index === 1;
        const upcoming = index === 2;
        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3 min-w-0">
            {index > 0 ? (
              <span className="hidden sm:block h-px w-6 bg-neutral-200 shrink-0" aria-hidden />
            ) : null}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${
                done
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : current
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {done ? <Check className="w-3 h-3" aria-hidden /> : null}
              <span className="truncate">{step.label}</span>
              {upcoming ? <span className="sr-only">(next)</span> : null}
              {current ? <span className="sr-only">(current)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="px-6 sm:px-8 py-8 space-y-8 animate-pulse" aria-hidden>
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 rounded-2xl bg-neutral-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 bg-neutral-100 rounded" />
          <div className="h-9 w-full max-w-sm bg-neutral-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-10 bg-neutral-100 rounded-lg" />
        <div className="h-10 bg-neutral-100 rounded-lg" />
        <div className="h-10 bg-neutral-100 rounded-lg sm:col-span-2" />
        <div className="h-10 bg-neutral-100 rounded-lg" />
        <div className="h-10 bg-neutral-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="h-11 bg-neutral-100 rounded-lg" />
        <div className="h-11 bg-neutral-100 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    gateActive,
    needsTermsReacceptance,
    profile,
    saving,
    saveProfile,
    loadError,
    loading: profileLoading,
    refresh,
  } = useProfileGate();

  const [redirecting, setRedirecting] = useState(false);

  const redirectUrl = useMemo(
    () => resolvePostSaveRedirect(searchParams.get('redirect')),
    [searchParams]
  );

  const isOnboarding = gateActive;
  const isTermsUpdate = needsTermsReacceptance && !isOnboarding;

  const formDefaults = useMemo(
    () =>
      profileToFormDefaults(profile, {
        name: user?.name || user?.fullName,
        image: user?.image,
        email: user?.email,
      }),
    [profile, user]
  );

  const formKey = useMemo(() => {
    if (!profile) return `new-${user?.email || 'anon'}`;
    return [
      profile.updated_at,
      profile.user_email,
      profile.first_name,
      profile.last_name,
      profile.terms_version,
    ]
      .filter(Boolean)
      .join('-');
  }, [profile, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [authLoading, user, router, redirectUrl]);

  const handleSave = useCallback(
    async (formData) => {
      try {
        if (isOnboarding) {
          setRedirecting(true);
          await saveProfile(formData, { silent: true });
          window.location.assign(redirectUrl);
          return;
        }
        return await saveProfile(formData);
      } catch (err) {
        if (isOnboarding) {
          setRedirecting(false);
          toast.error(err.message || 'Could not save profile');
        }
        throw err;
      }
    },
    [saveProfile, redirectUrl, isOnboarding]
  );

  const showForm = Boolean(user && !authLoading && !profileLoading);
  const requireTerms = isOnboarding || isTermsUpdate;

  const termsBanner = isTermsUpdate ? (
    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Our policies were updated ({TERMS_VERSION}). Please review and accept below to continue
      using the platform.
    </div>
  ) : null;

  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-neutral-50 to-neutral-50 relative">
      {redirecting ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-50/95 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-4 text-sm font-medium text-neutral-900">Setting up your dashboard…</p>
          <p className="mt-1 text-xs text-neutral-500">This only takes a moment</p>
        </div>
      ) : null}

      {isOnboarding ? (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
          <Link href="/" className="inline-flex items-center">
            <Image src={logo} alt="10tracker.com" className="h-8 w-auto" priority />
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Sign out
          </button>
        </header>
      ) : null}

      <div
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${
          isOnboarding ? 'py-8 sm:py-10' : 'pb-12'
        }`}
      >
        {!isOnboarding && (
          <Link
            href={redirectUrl}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back
          </Link>
        )}

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            {isOnboarding ? 'Complete your profile' : 'Profile settings'}
          </h1>
          {isOnboarding ? (
            <>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed max-w-xl">
                A few details to unlock mock tests, leaderboards, and your dashboard.
              </p>
              <OnboardingProgress />
            </>
          ) : (
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed max-w-xl">
              Update how you appear on the dashboard and leaderboards.
            </p>
          )}
        </header>

        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
          {(authLoading || profileLoading) && <ProfileFormSkeleton />}

          {loadError && !profileLoading && (
            <div className="m-6 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
              <p className="flex-1">{loadError}</p>
              <button
                type="button"
                onClick={() => refresh()}
                className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {showForm && (
            <div className="px-6 sm:px-8 pb-8">
              <UserProfileForm
                key={formKey}
                suggested={formDefaults}
                saving={saving || redirecting}
                onSave={handleSave}
                submitLabel={
                  isOnboarding
                    ? 'Accept & continue'
                    : isTermsUpdate
                      ? 'Accept & save'
                      : 'Save changes'
                }
                requireTerms={requireTerms}
                returnPath={redirectUrl}
                termsBanner={termsBanner}
                googleImage={user?.image || ''}
                elevateSaveBar={!isOnboarding}
              />
            </div>
          )}
        </div>

        {!isOnboarding && showForm ? (
          <section className="mt-6 bg-white border border-neutral-200/80 rounded-2xl shadow-sm px-6 sm:px-8 py-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-neutral-600" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-neutral-900">Account</h2>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  Signed in as {user?.email}. Sign out on this device anytime.
                </p>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden />
                  Sign out
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {isOnboarding && <OnboardingBrowseLinks returnPath={redirectUrl} />}
      </div>
    </div>
  );
}
