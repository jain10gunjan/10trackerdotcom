'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCredits } from '@/context/CreditsContext';
import { parseJsonResponse } from '@/lib/toastAsync';

export function useHomeDashboard({ enabled = true } = {}) {
  const { applyWalletSnapshot, refreshWallet } = useCredits();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [heatmapRange, setHeatmapRange] = useState('12mo');
  const walletSeededRef = useRef(false);
  const abortRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    if (!enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/dashboard', {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });
      const data = await parseJsonResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Failed to load dashboard');
      }
      if (controller.signal.aborted) return;

      setDashboard(data);
      if (data.heatmap?.range) {
        setHeatmapRange(data.heatmap.range);
      }
      if (data.wallet) {
        await applyWalletSnapshot(data.wallet);
        walletSeededRef.current = true;
      }
      if (data.partialErrors?.length) {
        console.warn('dashboard partial errors', data.partialErrors);
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.error('home dashboard', e);
      setError(e.message || 'Failed to load dashboard');
      if (!walletSeededRef.current) {
        refreshWallet({ force: true });
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, applyWalletSnapshot, refreshWallet]);

  useEffect(() => {
    loadDashboard();
    return () => abortRef.current?.abort();
  }, [loadDashboard]);

  const changeHeatmapRange = useCallback(
    (nextRange) => {
      if (!enabled || nextRange === heatmapRange) return;
      setHeatmapRange(nextRange);

      setDashboard((prev) => {
        const grid = prev?.heatmapsByRange?.[nextRange];
        if (!grid) return prev;
        return {
          ...prev,
          heatmap: grid,
        };
      });
    },
    [enabled, heatmapRange]
  );

  const initialLoading = loading && !dashboard;
  const partialError = Boolean(error && dashboard);

  return {
    dashboard,
    loading,
    initialLoading,
    heatmapLoading: false,
    error,
    partialError,
    heatmapRange,
    changeHeatmapRange,
    reload: loadDashboard,
  };
}
