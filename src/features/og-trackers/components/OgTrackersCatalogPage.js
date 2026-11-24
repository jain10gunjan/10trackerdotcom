'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import OgExamTrackPanel from '@/features/og-trackers/components/hub/OgExamTrackPanel';
import OgMyTrackers from '@/features/og-trackers/components/hub/OgMyTrackers';
import OgTrackSwitcher from '@/features/og-trackers/components/hub/OgTrackSwitcher';
import OgTrackersHero from '@/features/og-trackers/components/hub/OgTrackersHero';
import { useGsapReady, useOgStagger } from '@/features/og-trackers/lib/ogGsap';
import { APP_GUTTER } from '@/lib/appChrome';

function normalizeTrack(value) {
  return value === 'user' ? 'user' : 'exam';
}

export default function OgTrackersCatalogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { animate } = useGsapReady();

  const [exams, setExams] = useState([]);
  const [mine, setMine] = useState([]);
  const [paths, setPaths] = useState([]);
  const [stats, setStats] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [hierarchyReady, setHierarchyReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupHint, setSetupHint] = useState(null);
  const [track, setTrack] = useState(() => normalizeTrack(searchParams?.get('track')));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/og-trackers', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setExams(data.exams || []);
      setMine(data.mine || []);
      setPaths(data.paths || []);
      setStats(data.stats || null);
      setIsPremium(Boolean(data.isPremium));
      setHierarchyReady(Boolean(data.hierarchyReady));
      setSetupHint(data.setupRequired ? data.setupHint : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setTrack(normalizeTrack(searchParams?.get('track')));
  }, [searchParams]);

  const onTrackChange = useCallback(
    (next) => {
      const value = normalizeTrack(next);
      setTrack(value);
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (value === 'exam') params.delete('track');
      else params.set('track', 'user');
      const qs = params.toString();
      router.replace(qs ? `/og-trackers?${qs}` : '/og-trackers', { scroll: false });
    },
    [router, searchParams]
  );

  const gridRef = useOgStagger([loading, exams.length, animate, track]);

  const totalSteps = useMemo(
    () =>
      exams.reduce((s, e) => s + (e.totalSteps || 0), 0) ||
      paths.reduce((s, p) => s + (p.totalResources || 0), 0),
    [exams, paths]
  );

  const liveChapters = useMemo(
    () => exams.reduce((s, e) => s + (e.liveChapterCount || 0), 0),
    [exams]
  );

  const userCompleted =
    (stats?.videosCompleted || 0) +
    (stats?.practiceCompleted || 0) +
    (stats?.mocksCompleted || 0) +
    (stats?.leetcodeSolved || 0) +
    (stats?.hackerrankSolved || 0) +
    (stats?.codestudioSolved || 0);

  const featured =
    exams.find((e) => e.slug === 'gate-cse') ||
    exams.find((e) => e.isFeatured) ||
    exams[0];
  const startHref = featured
    ? `/og-trackers/exam/${featured.slug}`
    : paths[0]
      ? `/og-trackers/${paths[0].slug}`
      : null;

  const examCount = exams.length || paths.length;
  const userCount = mine.length;

  const metrics = [
    { label: 'Exam track', value: examCount || '—' },
    { label: 'Live chapters', value: liveChapters || '—' },
    { label: 'Total steps', value: totalSteps || '—' },
    {
      label: user && userCompleted > 0 ? 'Your clears' : 'User track',
      value: user && userCompleted > 0 ? userCompleted : userCount || 0,
    },
  ];

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900"
      style={{
        fontFamily:
          'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <OgTrackersHero
        loading={loading}
        user={user}
        isPremium={isPremium}
        featured={featured}
        startHref={startHref}
        metrics={metrics}
        onOpenUserTrack={() => onTrackChange('user')}
      />

      <section className={`mx-auto max-w-7xl ${APP_GUTTER} pb-16 sm:pb-20`}>
        <div className="mb-8">
          <OgTrackSwitcher
            value={track}
            onChange={onTrackChange}
            examCount={examCount}
            userCount={user ? userCount : 0}
          />
        </div>

        {track === 'user' ? (
          <OgMyTrackers mine={mine} loading={loading} signedIn={Boolean(user)} />
        ) : (
          <OgExamTrackPanel
            exams={exams}
            paths={paths}
            loading={loading}
            error={error}
            setupHint={setupHint}
            hierarchyReady={hierarchyReady}
            gridRef={gridRef}
          />
        )}
      </section>
    </div>
  );
}
