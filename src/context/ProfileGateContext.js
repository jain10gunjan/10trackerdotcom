'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { isProfileExemptPath, buildProfileSetupHref } from '@/lib/profileGatePaths';
import { getSafeRedirect } from '@/lib/safeRedirect';
import { profileToFormDefaults } from '@/lib/userProfile';
import { parseJsonResponse, toastPromise, PROFILE_TOAST } from '@/lib/toastAsync';

const EMPTY_SUGGESTED = {
  first_name: '',
  last_name: '',
  country: 'India',
  phone_number: '',
  city: '',
  state: '',
  bio: '',
  target_exam: '',
  target_exams: [],
  avatar_url: '',
  email: '',
};

const ProfileGateContext = createContext({
  profile: null,
  needsProfile: false,
  needsProfileCompletion: false,
  needsTermsReacceptance: false,
  termsReacceptRequired: false,
  suggested: EMPTY_SUGGESTED,
  loading: true,
  saving: false,
  loadError: null,
  gateActive: false,
  saveProfile: async () => {},
  acceptTerms: async () => {},
  refresh: async () => {},
  displayName: null,
});

export function useProfileGate() {
  return useContext(ProfileGateContext);
}

function applyGateFromResponse(data, setters, sessionHints) {
  const {
    setProfile,
    setNeedsProfile,
    setNeedsProfileCompletion,
    setNeedsTermsReacceptance,
    setSuggested,
    setLoadError,
  } = setters;

  if (data.success) {
    setProfile(data.profile);
    setNeedsProfile(Boolean(data.needsProfile));
    setNeedsProfileCompletion(Boolean(data.needsProfileCompletion ?? data.needsProfile));
    setNeedsTermsReacceptance(Boolean(data.needsTermsReacceptance));
    setSuggested(
      profileToFormDefaults(data.profile, {
        name: sessionHints.name,
        image: sessionHints.image,
        email: sessionHints.email,
      })
    );
    setLoadError(null);
    return true;
  }
  setLoadError(data.error || 'Could not load profile');
  setNeedsProfile(true);
  setNeedsProfileCompletion(true);
  setNeedsTermsReacceptance(false);
  return false;
}

export function ProfileGateProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const skipGateRedirectRef = useRef(false);

  const [profile, setProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [needsTermsReacceptance, setNeedsTermsReacceptance] = useState(false);
  const [suggested, setSuggested] = useState(EMPTY_SUGGESTED);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const sessionHints = useMemo(
    () => ({
      name: user?.name || user?.fullName,
      image: user?.image,
      email: user?.email,
    }),
    [user]
  );

  const setters = useMemo(
    () => ({
      setProfile,
      setNeedsProfile,
      setNeedsProfileCompletion,
      setNeedsTermsReacceptance,
      setSuggested,
      setLoadError,
    }),
    []
  );

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setNeedsProfile(false);
      setNeedsProfileCompletion(false);
      setNeedsTermsReacceptance(false);
      setLoadError(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/user/profile', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await parseJsonResponse(res);
      applyGateFromResponse(data, setters, sessionHints);
      return data;
    } catch (e) {
      console.error('Profile load failed', e);
      setLoadError('Network error loading profile');
      setNeedsProfile(true);
      setNeedsProfileCompletion(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, sessionHints, setters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) {
      skipGateRedirectRef.current = false;
    }
  }, [user]);

  const applySaveResponse = useCallback(
    (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to save');
      }
      skipGateRedirectRef.current = true;
      applyGateFromResponse(data, setters, sessionHints);
      return data.profile;
    },
    [sessionHints, setters]
  );

  const saveProfile = useCallback(
    async (formData, opts = {}) => {
      const run = async () => {
        const { email: _e, user_email: _ue, id: _id, ...payload } = formData || {};
        const res = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save profile');
        }
        return applySaveResponse(data);
      };

      setSaving(true);
      try {
        if (opts.silent) return await run();
        return await toastPromise(() => run(), {
          loading: PROFILE_TOAST.saveLoading,
          success: PROFILE_TOAST.saveSuccess,
          ...opts.messages,
        });
      } finally {
        setSaving(false);
      }
    },
    [applySaveResponse]
  );

  const acceptTerms = useCallback(async (opts = {}) => {
    const run = async () => {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ termsOnly: true, termsAccepted: true }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept terms');
      }
      return applySaveResponse(data);
    };

    setSaving(true);
    try {
      if (opts.silent) return await run();
      return await toastPromise(() => run(), {
        loading: PROFILE_TOAST.termsLoading,
        success: PROFILE_TOAST.termsSuccess,
        ...opts.messages,
      });
    } finally {
      setSaving(false);
    }
  }, [applySaveResponse]);

  /** Full onboarding — incomplete profile fields */
  const gateActive = Boolean(user && needsProfileCompletion);
  /** Modal — profile done but TERMS_VERSION changed */
  const termsReacceptRequired = Boolean(user && needsTermsReacceptance && !needsProfileCompletion);

  useEffect(() => {
    if (!gateActive && !termsReacceptRequired) {
      skipGateRedirectRef.current = false;
    }
  }, [gateActive, termsReacceptRequired]);

  useEffect(() => {
    if (skipGateRedirectRef.current) return;
    if (authLoading || loading || !user || !gateActive) return;
    if (isProfileExemptPath(pathname)) return;

    const search = typeof window !== 'undefined' ? window.location.search : '';
    const returnPath = getSafeRedirect(`${pathname || '/'}${search}`) || `${pathname || '/'}${search}`;
    router.replace(buildProfileSetupHref(returnPath));
  }, [authLoading, loading, user, gateActive, pathname, router]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    null;

  const value = useMemo(
    () => ({
      profile,
      needsProfile,
      needsProfileCompletion,
      needsTermsReacceptance,
      termsReacceptRequired,
      suggested,
      loading: authLoading || loading,
      saving,
      loadError,
      gateActive,
      saveProfile,
      acceptTerms,
      refresh,
      displayName,
    }),
    [
      profile,
      needsProfile,
      needsProfileCompletion,
      needsTermsReacceptance,
      termsReacceptRequired,
      suggested,
      authLoading,
      loading,
      saving,
      loadError,
      gateActive,
      saveProfile,
      acceptTerms,
      refresh,
      displayName,
    ]
  );

  return (
    <ProfileGateContext.Provider value={value}>{children}</ProfileGateContext.Provider>
  );
}
