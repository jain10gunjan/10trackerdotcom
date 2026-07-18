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
    <ol className="mt-4 flex items-center gap-2 sm:gap-3" aria-label="Setup progress">
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

function SettingsTab({ active, children }) {
  return (
    <span
      className={`inline-block pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'text-neutral-900 border-neutral-900'
          : 'text-neutral-500 border-transparent'
      }`}
    >
      {children}
    </span>
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
    suggested,
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
        const saved = await saveProfile(formData);
        await refresh();
        return saved;
      } catch (err) {
        if (isOnboarding) {
          setRedirecting(false);
          toast.error(err.message || 'Could not save profile');
        }
        throw err;
      }
    },
    [saveProfile, refresh, redirectUrl, isOnboarding]
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
    <div className="min-h-screen bg-neutral-50 relative">
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
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-neutral-200 bg-white">
          <Link href="/" className="inline-flex items-center">
            <Image src={logo} alt="10tracker.com" className="h-8 w-auto" priority />
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <LogOut className="w-4 h-4" />
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
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        )}

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            {isOnboarding ? 'Complete your profile' : 'Settings'}
          </h1>
          {!isOnboarding && (
            <nav className="mt-5 border-b border-neutral-200">
              <SettingsTab active>Profile</SettingsTab>
            </nav>
          )}
          {isOnboarding && (
            <>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                A few details to unlock mock tests, leaderboards, and your dashboard.
              </p>
              <OnboardingProgress />
            </>
          )}
        </header>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm">
          {(authLoading || profileLoading) && (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
              <p className="text-sm text-neutral-500 mt-3">Loading profile…</p>
            </div>
          )}

          {loadError && !profileLoading && (
            <div className="m-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {loadError}
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
                  isOnboarding ? 'Accept & continue' : isTermsUpdate ? 'Accept & save' : 'Save changes'
                }
                requireTerms={requireTerms}
                returnPath={redirectUrl}
                termsBanner={termsBanner}
              />
            </div>
          )}
        </div>

        {isOnboarding && <OnboardingBrowseLinks returnPath={redirectUrl} />}
      </div>
    </div>
  );
}
