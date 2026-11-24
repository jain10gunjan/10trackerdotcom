'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useCredits } from '@/context/CreditsContext';
import { parseJsonResponse } from '@/lib/toastAsync';
import { formatExamSlug } from '@/lib/platformExams';

const DASHBOARD_TOAST_ID = 'home-dashboard-load';
const HOME_FOCUS_STORAGE_KEY = 'tt_home_focus_exam';

function readStoredFocusExam() {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.localStorage.getItem(HOME_FOCUS_STORAGE_KEY) || '')
      .trim()
      .toLowerCase();
  } catch {
    return '';
  }
}

function examLabelFromSlug(slug) {
  const s = String(slug || '').trim();
  if (!s) return 'your exam';
  return formatExamSlug(s);
}

export function useHomeDashboard({ enabled = true, focusExam = '' } = {}) {
  const { applyWalletSnapshot, refreshWallet } = useCredits();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [heatmapRange, setHeatmapRange] = useState('12mo');
  const walletSeededRef = useRef(false);
  const abortRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);
  const loadedFocusRef = useRef('');
  const heatmapRangeRef = useRef(heatmapRange);
  const resolvedFocusRef = useRef(null);
  const appliedFocusRef = useRef('');
  const propFocus = String(focusExam || '').trim().toLowerCase();
  heatmapRangeRef.current = heatmapRange;

  const loadDashboard = useCallback(
    async (opts = {}) => {
      if (!enabled) return null;

      const focusSlug = propFocus || readStoredFocusExam();
      const reason =
        opts.reason ||
        (!hasLoadedOnceRef.current
          ? 'initial'
          : loadedFocusRef.current !== focusSlug
            ? 'exam'
            : 'reload');

      const showToast = opts.toast !== false;
      const label = opts.examLabel || examLabelFromSlug(focusSlug);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      if (showToast) {
        const loadingMsg =
          reason === 'exam'
            ? `Switching to ${label}…`
            : reason === 'reload'
              ? 'Refreshing your home…'
              : 'Loading your home…';
        toast.loading(loadingMsg, { id: DASHBOARD_TOAST_ID });
      }

      try {
        const params = new URLSearchParams();
        if (focusSlug) params.set('exam', focusSlug);
        if (heatmapRangeRef.current === '90d') params.set('heatmapRange', '90d');
        const qs = params.toString();
        const res = await fetch(`/api/user/dashboard${qs ? `?${qs}` : ''}`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await parseJsonResponse(res);
        if (!data.success) {
          throw new Error(data.error || 'Failed to load dashboard');
        }
        if (controller.signal.aborted) return null;

        setDashboard(data);
        appliedFocusRef.current = String(data.focusedExam?.slug || focusSlug || '')
          .trim()
          .toLowerCase();
        if (data.heatmap?.range) {
          setHeatmapRange(data.heatmap.range);
        }
        if (data.wallet) {
          walletSeededRef.current = true;
          // Local credit hydration can flush a sync request. Do not hold the
          // home skeleton on it — the payload is already rendered.
          void applyWalletSnapshot(data.wallet);
        }
        if (data.partialErrors?.length) {
          console.warn('dashboard partial errors', data.partialErrors);
        }

        hasLoadedOnceRef.current = true;
        loadedFocusRef.current = focusSlug;

        if (showToast) {
          const successMsg =
            reason === 'exam'
              ? `Ready — ${label}`
              : reason === 'reload'
                ? 'Home updated'
                : 'Home ready';
          toast.success(successMsg, { id: DASHBOARD_TOAST_ID });
        }

        return data;
      } catch (e) {
        if (e?.name === 'AbortError') {
          // A newer request superseded this one — leave toast for the new load.
          return null;
        }
        console.error('home dashboard', e);
        setError(e.message || 'Failed to load dashboard');
        if (!walletSeededRef.current) {
          refreshWallet({ force: true });
        }
        if (showToast) {
          toast.error(e.message || 'Could not load your home', {
            id: DASHBOARD_TOAST_ID,
          });
        }
        return null;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [enabled, propFocus, applyWalletSnapshot, refreshWallet]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!enabled) {
      resolvedFocusRef.current = null;
      abortRef.current?.abort();
      return undefined;
    }

    // Prop updates after the homepage reads tt_home_focus_exam. If that slug
    // is the one already in flight, keep the request and its toast.
    const resolved = propFocus || readStoredFocusExam();
    const inFlight =
      resolvedFocusRef.current === resolved &&
      abortRef.current &&
      !abortRef.current.signal.aborted;
    // Dev strict mode aborts the first request on remount. A matching slug
    // must not skip the retry when that request is already dead.
    if (inFlight) return undefined;
    // The homepage copies focusedExam back into focus state after load.
    // That slug is already on screen — do not fetch or toast again.
    if (resolved && appliedFocusRef.current === resolved && hasLoadedOnceRef.current) {
      resolvedFocusRef.current = resolved;
      loadedFocusRef.current = resolved;
      return undefined;
    }
    resolvedFocusRef.current = resolved;
    loadDashboard();
    return undefined;
  }, [loadDashboard, enabled, propFocus]);

  const changeHeatmapRange = useCallback(
    (nextRange) => {
      if (!enabled || nextRange === heatmapRange) return;
      heatmapRangeRef.current = nextRange;
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

  const reload = useCallback(() => loadDashboard({ reason: 'reload' }), [loadDashboard]);

  const initialLoading = loading && !dashboard;
  const switchingExam = loading && Boolean(dashboard);
  const partialError = Boolean(error && dashboard);

  return {
    dashboard,
    loading,
    initialLoading,
    switchingExam,
    heatmapLoading: false,
    error,
    partialError,
    heatmapRange,
    changeHeatmapRange,
    reload,
  };
}
