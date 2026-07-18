'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { parseJsonResponse } from '@/lib/toastAsync';

export function useExamHubProgress(categorySlug) {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || !categorySlug) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/exam-hub/${encodeURIComponent(categorySlug)}/progress`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await parseJsonResponse(res);
        if (!cancelled && json.success) {
          setData(json);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.email, categorySlug]);

  return {
    loading,
    overallPercent: data?.overallPercent ?? 0,
    subjects: data?.subjects ?? [],
    continue: data?.continue ?? null,
    stats: data?.stats ?? null,
  };
}
