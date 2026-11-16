'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OgPremiumCheckout from '@/features/og-trackers/components/OgPremiumCheckout';
import OgExamCard from '@/features/og-trackers/components/hub/OgExamCard';
import OgTrackersHero from '@/features/og-trackers/components/hub/OgTrackersHero';
import { useGsapReady, useOgStagger } from '@/features/og-trackers/lib/ogGsap';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import { APP_GUTTER } from '@/lib/appChrome';

export default function OgTrackersCatalogPage() {
  const { user } = useAuth();
  const { animate } = useGsapReady();

  const [exams, setExams] = useState([]);
  const [paths, setPaths] = useState([]);
  const [stats, setStats] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [hierarchyReady, setHierarchyReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupHint, setSetupHint] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/og-trackers', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setExams(data.exams || []);
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

  const gridRef = useOgStagger([loading, exams.length, animate]);

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

  const metrics = [
    { label: 'Exams', value: exams.length || '—' },
    { label: 'Live chapters', value: liveChapters || '—' },
    { label: 'Total steps', value: totalSteps || '—' },
    {
      label: user && userCompleted > 0 ? 'Your clears' : 'Extension',
      value: user && userCompleted > 0 ? userCompleted : 'Required',
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
        onGoPremium={() => setShowCheckout(true)}
      />

      <section className={`max-w-7xl mx-auto ${APP_GUTTER} pb-16 sm:pb-20`}>
        <div className="mb-6">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: GUEST_BRAND.blue }}
          >
            Exam hub
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Choose your exam track
          </h2>
          <p className="mt-2 text-sm text-neutral-600 max-w-xl">
            Each exam opens into chapters. Live chapters launch a full tracker; the rest are ready
            for content when you add YouTube and practice later.
          </p>
        </div>

        {setupHint ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {setupHint}
            {!hierarchyReady ? (
              <span className="block mt-1 text-amber-800/80">
                Also run <code className="text-xs">setup_og_exams_chapters.sql</code> for Exam →
                Chapter structure.
              </span>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-600">
            <Loader2 className="h-5 w-5 animate-spin mr-2" style={{ color: GUEST_BRAND.blue }} />
            Loading exams…
          </div>
        ) : !exams.length ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            No exams published yet. Run the hierarchy migration to seed GATE CSE chapters.
          </div>
        ) : (
          <div ref={gridRef} className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {exams.map((exam) => (
              <OgExamCard key={exam.id || exam.slug} exam={exam} />
            ))}
          </div>
        )}
      </section>

      {showCheckout ? (
        <OgPremiumCheckout
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
