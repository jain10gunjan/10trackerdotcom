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
import { isProfileExemptPath } from '@/lib/profileGatePaths';
import { profileToFormDefaults } from '@/lib/userProfile';
import { parseJsonResponse } from '@/lib/toastAsync';

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
  suggested: EMPTY_SUGGESTED,
  loading: true,
  saving: false,
  loadError: null,
  gateActive: false,
  saveProfile: async () => {},
  refresh: async () => {},
  displayName: null,
});

export function useProfileGate() {
  return useContext(ProfileGateContext);
}

export function ProfileGateProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const skipGateRedirectRef = useRef(false);

  const [profile, setProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
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

  const applyProfileResponse = useCallback(
    (data) => {
      if (data.success) {
        setProfile(data.profile);
        setNeedsProfile(Boolean(data.needsProfile));
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
      return false;
    },
    [sessionHints]
  );

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setNeedsProfile(false);
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
      applyProfileResponse(data);
      return data;
    } catch (e) {
      console.error('Profile load failed', e);
      setLoadError('Network error loading profile');
      setNeedsProfile(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, applyProfileResponse]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProfile = useCallback(
    async (formData) => {
      setSaving(true);
      try {
        const { email: _e, user_email: _ue, id: _id, ...payload } = formData || {};
        const res = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to save profile');
        }
        skipGateRedirectRef.current = true;
        setProfile(data.profile);
        setNeedsProfile(false);
        setLoadError(null);
        setSuggested(
          profileToFormDefaults(data.profile, {
            name: sessionHints.name,
            image: sessionHints.image,
            email: sessionHints.email,
          })
        );
        return data.profile;
      } finally {
        setSaving(false);
      }
    },
    [sessionHints]
  );

  const gateActive = Boolean(user && needsProfile);

  useEffect(() => {
    if (skipGateRedirectRef.current) return;
    if (authLoading || loading || !user || !gateActive) return;
    if (isProfileExemptPath(pathname)) return;

    const search = typeof window !== 'undefined' ? window.location.search : '';
    const returnPath = `${pathname || '/'}${search}`;
    router.replace(`/profile?redirect=${encodeURIComponent(returnPath)}`);
  }, [authLoading, loading, user, gateActive, pathname, router]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    null;

  const value = useMemo(
    () => ({
      profile,
      needsProfile,
      suggested,
      loading: authLoading || loading,
      saving,
      loadError,
      gateActive,
      saveProfile,
      refresh,
      displayName,
    }),
    [
      profile,
      needsProfile,
      suggested,
      authLoading,
      loading,
      saving,
      loadError,
      gateActive,
      saveProfile,
      refresh,
      displayName,
    ]
  );

  return (
    <ProfileGateContext.Provider value={value}>{children}</ProfileGateContext.Provider>
  );
}
