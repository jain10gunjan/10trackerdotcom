'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import UserProfileForm from '@/features/profile/components/UserProfileForm';
import OnboardingBrowseLinks from '@/features/profile/components/OnboardingBrowseLinks';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { applySignupExamDefault, profileToFormDefaults } from '@/lib/userProfile';
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
    <ol className="mt-2 flex items-center gap-1.5" aria-label="Setup progress">
      {ONBOARDING_STEPS.map((step, index) => {
        const done = index === 0;
        const current = index === 1;
        return (
          <li key={step.id} className="flex items-center gap-1.5 min-w-0">
            {index > 0 ? (
              <span className="h-px w-3 bg-neutral-200 shrink-0" aria-hidden />
            ) : null}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                done
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : current
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {done ? <Check className="w-3 h-3" aria-hidden /> : null}
              <span className="truncate">{step.label}</span>
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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4 animate-pulse" aria-hidden>
      <div className="h-4 w-40 bg-neutral-200 rounded" />
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-full bg-neutral-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-neutral-100 rounded" />
          <div className="h-3 w-20 bg-neutral-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-9 bg-neutral-100 rounded-lg" />
        <div className="h-9 bg-neutral-100 rounded-lg" />
      </div>
      <div className="h-9 bg-neutral-100 rounded-lg" />
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
      applySignupExamDefault(
        profileToFormDefaults(profile, {
          name: user?.name || user?.fullName,
          image: user?.image,
          email: user?.email,
        }),
        redirectUrl
      ),
    [profile, user, redirectUrl]
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

  const displayName =
    [formDefaults.first_name, formDefaults.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'Student';

  const firstName = displayName.split(/\s+/)[0];

  const termsBanner = isTermsUpdate ? (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      Our policies were updated ({TERMS_VERSION}). Please review and accept below to continue
      using the platform.
    </div>
  ) : null;

  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {redirecting ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-50/95 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-700" />
          <p className="mt-3 text-sm font-semibold text-neutral-900">Setting up your dashboard…</p>
        </div>
      ) : null}

      {isOnboarding ? (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
          <Link href="/" className="inline-flex items-center">
            <Image src={logo} alt="10tracker.com" className="h-7 w-auto" priority />
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden />
            Sign out
          </button>
        </header>
      ) : null}

      <div
        className={`max-w-2xl mx-auto px-4 sm:px-5 ${
          isOnboarding ? 'py-5 sm:py-6' : 'pt-3 pb-10'
        }`}
      >
        {!isOnboarding && (
          <Link
            href={redirectUrl}
            className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 text-sm font-medium mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Back to home
          </Link>
        )}

        <div className="mb-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              {isOnboarding ? 'Complete your profile' : 'Profile settings'}
            </h1>
            {!isOnboarding ? (
              <p className="text-xs text-neutral-500 shrink-0 hidden sm:block">Hi {firstName}</p>
            ) : null}
          </div>
          {isOnboarding ? (
            <>
              <p className="text-sm text-neutral-600 mt-1">
                A few details to unlock mocks, leaderboards, and your home.
              </p>
              <OnboardingProgress />
            </>
          ) : (
            <p className="text-sm text-neutral-600 mt-0.5 sm:hidden">Hi {firstName}</p>
          )}
        </div>

        {(authLoading || profileLoading) && <ProfileFormSkeleton />}

        {loadError && !profileLoading && (
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <p className="flex-1">{loadError}</p>
            <button
              type="button"
              onClick={() => refresh()}
              className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {showForm && (
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
        )}

        {!isOnboarding && showForm ? (
          <div className="mt-3 rounded-xl border border-neutral-200/90 bg-white shadow-sm px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">Sign out</p>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
              Sign out
            </button>
          </div>
        ) : null}

        {isOnboarding && <OnboardingBrowseLinks returnPath={redirectUrl} />}
      </div>
    </div>
  );
}
