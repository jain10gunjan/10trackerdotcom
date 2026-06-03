'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { CREDIT_COST } from '@/lib/credits/constants';
import {
  getLocalCreditBalance,
  loadCreditStore,
  saveCreditStore,
} from '@/lib/credits/creditLocalStore';
import {
  flushCreditSync,
  hydrateCreditsFromServer,
  registerCreditSyncLifecycle,
} from '@/lib/credits/creditSyncManager';
import { parseJsonResponse } from '@/lib/toastAsync';

const CreditsContext = createContext({
  loading: true,
  credits: 0,
  unlimited: false,
  subscription: null,
  costs: CREDIT_COST,
  refreshWallet: async () => {},
  setCreditsBalance: () => {},
  flushSync: async () => {},
  showPaywall: false,
  setShowPaywall: () => {},
});

export function useCredits() {
  return useContext(CreditsContext);
}

export function CreditsProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setWallet(null);
      setWalletError(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/credits/wallet', { credentials: 'include' });
      const data = await parseJsonResponse(res);
      if (data.success) {
        await hydrateCreditsFromServer(userId, {
          credits: data.credits,
          unlimited: data.unlimited,
        });

        const displayCredits = getLocalCreditBalance(userId);

        setWallet({
          ...data,
          credits: displayCredits,
        });
        setWalletError(null);

        if (data.signupGrant?.granted && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('credits-welcome-bonus', {
              detail: { credits: data.signupGrant.credits },
            })
          );
        }
      } else {
        setWalletError(data.error || 'Could not load wallet');
      }
    } catch (e) {
      setWalletError('Could not load wallet');
      if (process.env.NODE_ENV === 'development') {
        console.error('refreshWallet', e);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId]);

  const flushSync = useCallback(async () => {
    if (!userId) return;
    const result = await flushCreditSync(userId, { force: true });
    if (result?.needsSubscription) {
      setShowPaywall(true);
    }
    if (typeof result?.credits === 'number') {
      setWallet((prev) => (prev ? { ...prev, credits: result.credits } : prev));
    }
    return result;
  }, [userId]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    if (!userId || !isAuthenticated) return undefined;
    return registerCreditSyncLifecycle(userId);
  }, [userId, isAuthenticated]);

  useEffect(() => {
    const onBalance = (e) => {
      const credits = e.detail?.credits;
      if (typeof credits !== 'number') return;
      setWallet((prev) => ({
        ...(prev || { costs: CREDIT_COST, signupBonus: 60 }),
        credits,
        unlimited: prev?.unlimited ?? false,
      }));
    };
    const onPaywall = () => setShowPaywall(true);
    window.addEventListener('credits-balance-updated', onBalance);
    window.addEventListener('credits-paywall-required', onPaywall);
    return () => {
      window.removeEventListener('credits-balance-updated', onBalance);
      window.removeEventListener('credits-paywall-required', onPaywall);
    };
  }, []);

  const setCreditsBalance = useCallback(
    (nextCredits) => {
      if (typeof nextCredits !== 'number' || Number.isNaN(nextCredits) || !userId) return;

      const store = loadCreditStore(userId);
      saveCreditStore(userId, { ...store, balance: Math.max(0, nextCredits) });

      setWallet((prev) => ({
        ...(prev || { costs: CREDIT_COST, signupBonus: 60 }),
        credits: Math.max(0, nextCredits),
        unlimited: prev?.unlimited ?? false,
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('credits-balance-updated', {
            detail: { credits: Math.max(0, nextCredits) },
          })
        );
      }
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      loading,
      credits: wallet?.credits ?? (userId ? getLocalCreditBalance(userId) : 0),
      unlimited: wallet?.unlimited ?? false,
      subscription: wallet?.subscription ?? null,
      costs: wallet?.costs ?? CREDIT_COST,
      signupBonus: wallet?.signupBonus ?? 60,
      plans: wallet?.plans,
      walletReady: Boolean(wallet) || Boolean(userId),
      walletError,
      refreshWallet,
      setCreditsBalance,
      flushSync,
      showPaywall,
      setShowPaywall,
    }),
    [loading, wallet, walletError, refreshWallet, setCreditsBalance, flushSync, showPaywall, userId]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}
