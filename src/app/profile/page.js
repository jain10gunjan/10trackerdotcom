'use client';

import { useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LogOut, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import UserProfileForm from '@/components/profile/UserProfileForm';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { profileToFormDefaults } from '@/lib/userProfile';

function resolvePostSaveRedirect(raw) {
  const safe = getSafeRedirect(raw) || '/';
  if (safe === '/profile' || safe.startsWith('/profile?')) return '/';
  return safe;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    gateActive,
    profile,
    suggested,
    saving,
    saveProfile,
    loadError,
    loading: profileLoading,
    refresh,
  } = useProfileGate();

  const redirectUrl = useMemo(
    () => resolvePostSaveRedirect(searchParams.get('redirect')),
    [searchParams]
  );

  const isOnboarding = gateActive;

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
      profile.phone_number,
    ]
      .filter(Boolean)
      .join('-');
  }, [profile, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const signInTarget = `/profile?redirect=${encodeURIComponent(redirectUrl)}`;
      router.replace(`/sign-in?redirect=${encodeURIComponent(signInTarget)}`);
    }
  }, [authLoading, user, router, redirectUrl]);

  const handleSave = useCallback(
    async (formData) => {
      const completingOnboarding = gateActive;
      try {
        const saved = await saveProfile(formData);
        await refresh();
        if (completingOnboarding) {
          toast.success('Profile saved');
          window.location.assign(redirectUrl);
          return saved;
        }
        toast.success('Profile updated');
        return saved;
      } catch (err) {
        toast.error(err.message || 'Could not save profile');
        throw err;
      }
    },
    [saveProfile, refresh, redirectUrl, gateActive]
  );

  const showForm = Boolean(user && !authLoading && !profileLoading);

  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-neutral-50 ${isOnboarding ? 'flex flex-col' : ''}`}>
      <Toaster position="bottom-right" />

      {isOnboarding ? (
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-neutral-200 bg-white">
          <span className="text-sm font-semibold text-neutral-900">10tracker</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </header>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href={redirectUrl}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      )}

      <div
        className={
          isOnboarding
            ? 'flex-1 flex justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'
        }
      >
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-4">
              <Sparkles className="w-4 h-4 text-neutral-700" />
              <span className="text-sm font-medium text-neutral-700">
                {isOnboarding ? 'One more step' : 'Account'}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
              {isOnboarding ? 'Complete your profile' : 'Edit profile'}
            </h1>
            <p className="text-neutral-600 text-sm">
              {isOnboarding
                ? 'Required before you can use mock tests and leaderboards.'
                : 'Update your name, contact details, and exam preferences.'}
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-sm">
            {(authLoading || profileLoading) && (
              <p className="text-sm text-neutral-500 text-center py-8 mb-4">Loading profile…</p>
            )}

            {loadError && !profileLoading && (
              <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {loadError}
              </p>
            )}

            {showForm && (
              <UserProfileForm
                key={formKey}
                suggested={formDefaults}
                saving={saving}
                onSave={handleSave}
                submitLabel={isOnboarding ? 'Save & continue' : 'Save changes'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
