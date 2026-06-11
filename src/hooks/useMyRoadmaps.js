'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { parseJsonResponse } from '@/lib/toastAsync';

export function useMyRoadmaps() {
  const { user, isAuthenticated } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [purchasedSlugs, setPurchasedSlugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRoadmaps([]);
      setPurchasedSlugs([]);
      setLoading(false);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/roadmaps/mine', { credentials: 'include', cache: 'no-store' });
        const data = await parseJsonResponse(res);
        if (cancelled) return;
        if (data.success) {
          setRoadmaps(data.roadmaps || []);
          setPurchasedSlugs(data.purchasedSlugs || []);
        }
      } catch {
        if (!cancelled) {
          setRoadmaps([]);
          setPurchasedSlugs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.email]);

  return { roadmaps, purchasedSlugs, loading, loaded };
}
