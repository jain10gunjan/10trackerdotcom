'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import OgChapterCard from '@/features/og-trackers/components/hub/OgChapterCard';
import { HubIcon } from '@/features/og-trackers/components/hub/iconMap';
import ExtensionStatus from '@/features/extension-auth/components/ExtensionStatus';
import { useAuth } from '@/context/AuthContext';
import {
  useGsapReady,
  useOgHeroTimeline,
  useOgStagger,
} from '@/features/og-trackers/lib/ogGsap';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

export default function OgExamHubPage() {
  const params = useParams();
  const examSlug = params?.slug;
  const { user } = useAuth();
  const { animate } = useGsapReady();

  const [exam, setExam] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const heroRef = useOgHeroTimeline(exam?.slug || '');

  const load = useCallback(async () => {
    if (!examSlug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/og-trackers/exams/${examSlug}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load exam');
      setExam(data.exam);
      setChapters(data.chapters || []);
    } catch (err) {
      setError(err.message);
      setExam(null);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [examSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'live') return chapters.filter((c) => c.status === 'live' && c.path);
    if (filter === 'soon') return chapters.filter((c) => c.status !== 'live' || !c.path);
    return chapters;
  }, [chapters, filter]);

  const gridRef = useOgStagger([loading, filtered.length, filter, animate]);

  const liveCount = chapters.filter((c) => c.status === 'live' && c.path).length;

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900"
      style={{
        fontFamily:
          'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <section
        className="relative overflow-hidden"
        style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 90% 8%, ${GUEST_BRAND.soft} 0%, transparent 55%),
              linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 60%, #F5F5F5 100%)
            `,
          }}
          aria-hidden
        />

        <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-6 sm:pt-8 pb-8 sm:pb-10`}>
          <Link
            href="/og-trackers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-950 mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            All exams
          </Link>

          {loading ? (
            <div className="flex items-center py-16 text-neutral-600">
              <Loader2 className="h-5 w-5 animate-spin mr-2" style={{ color: GUEST_BRAND.blue }} />
              Loading chapters…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : exam ? (
            <div ref={heroRef} className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="flex items-start gap-4 min-w-0 flex-1" data-og-reveal>
                <span
                  className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: GUEST_BRAND.blue }}
                >
                  <HubIcon name={exam.icon} className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: GUEST_BRAND.blue }}
                  >
                    Exam track
                  </p>
                  <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
                    {exam.title}
                  </h1>
                  {exam.description ? (
                    <p
                      className="mt-2 text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed"
                      data-og-reveal
                    >
                      {exam.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-neutral-600" data-og-reveal>
                    <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                      {liveCount} live · {chapters.length} chapters
                    </span>
                    {exam.totalSteps > 0 ? (
                      <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 tabular-nums">
                        {exam.totalSteps} steps · {exam.percent}% done
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {!loading && exam ? (
        <section className={`max-w-7xl mx-auto ${APP_GUTTER} pb-16 sm:pb-20`}>
          {user ? <ExtensionStatus variant="both" enabled className="mb-5" /> : null}
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All chapters' },
              { id: 'live', label: 'Live' },
              { id: 'soon', label: 'Coming soon' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.id
                    ? 'border-transparent text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#3F5EB9]/40'
                }`}
                style={filter === f.id ? { backgroundColor: GUEST_BRAND.blue } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!filtered.length ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-sm text-neutral-600">
              No chapters in this filter.
            </div>
          ) : (
            <div ref={gridRef} className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((chapter) => (
                <OgChapterCard key={chapter.id} chapter={chapter} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
