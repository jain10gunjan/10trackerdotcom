'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Gift,
  Lock,
  Map,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import LegalTermsCheckbox from '@/components/legal/LegalTermsCheckbox';
import RoadmapCheckout from '@/components/roadmaps/RoadmapCheckout';
import RoadmapDayList from '@/components/roadmaps/RoadmapDayList';
import { COMPACT_WEEK_THRESHOLD } from '@/components/roadmaps/RoadmapDayNav';
import RoadmapDayModal from '@/components/roadmaps/RoadmapDayModal';
import RoadmapProgressRing from '@/components/roadmaps/RoadmapProgressRing';
import RoadmapSaveBar from '@/components/roadmaps/RoadmapSaveBar';
import RoadmapViewerSkeleton from '@/components/roadmaps/RoadmapViewerSkeleton';
import { useRoadmapDraft } from '@/hooks/useRoadmapDraft';
import { ROADMAP_PURCHASE_NOTICE } from '@/lib/roadmaps/constants';
import { calculateRoadmapProgress } from '@/lib/roadmaps/progressUtils';
import { buildDayMeta, filterDayMeta, findNextUnlockedDay } from '@/lib/roadmaps/viewerUtils';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

export default function RoadmapViewer({ slug, initialMeta = null }) {
  const { user, setShowAuthModal } = useAuth();
  const userKey = user?.email?.toLowerCase() || 'guest';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalDayNum, setModalDayNum] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [visibleDayCount, setVisibleDayCount] = useState(25);

  const DAYS_PAGE_SIZE = 25;

  const deferredSearch = useDeferredValue(searchQuery);
  const serverProgressMap = data?.progressMap || {};

  const {
    mergedMap,
    draft,
    dirtyCount,
    isDirty,
    hydrated,
    toggleComplete,
    setNotes,
    discardChanges,
    getTasksToSave,
    resetDraftAfterSave,
  } = useRoadmapDraft(slug, serverProgressMap, userKey);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roadmaps/${encodeURIComponent(slug)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await parseJsonResponse(res);
      if (!json.success) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setVisibleDayCount(DAYS_PAGE_SIZE);
  }, [deferredSearch, slug]);

  const days = data?.days || [];
  const dayMeta = useMemo(() => buildDayMeta(days, mergedMap), [days, mergedMap]);
  const filteredMeta = useMemo(
    () => filterDayMeta(dayMeta, deferredSearch),
    [dayMeta, deferredSearch]
  );
  const unlockedMeta = useMemo(() => dayMeta.filter((d) => !d.locked), [dayMeta]);

  const modalDay = useMemo(
    () => unlockedMeta.find((d) => d.day_number === modalDayNum) || null,
    [unlockedMeta, modalDayNum]
  );

  const mergedProgress = useMemo(
    () => calculateRoadmapProgress(unlockedMeta, mergedMap),
    [unlockedMeta, mergedMap]
  );

  const groupWeeks = dayMeta.length >= COMPACT_WEEK_THRESHOLD;
  const isSearching = Boolean(deferredSearch.trim());
  const displayedMeta = useMemo(() => {
    if (isSearching) return filteredMeta;
    return filteredMeta.slice(0, visibleDayCount);
  }, [filteredMeta, isSearching, visibleDayCount]);
  const hasMoreDays = !isSearching && filteredMeta.length > visibleDayCount;
  const modalIdx = unlockedMeta.findIndex((d) => d.day_number === modalDayNum);

  const handleSaveAll = async () => {
    const tasks = getTasksToSave();
    if (!tasks.length) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const json = await toastPromise(
        async () => {
          const res = await fetch(`/api/roadmaps/${encodeURIComponent(slug)}/progress`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks }),
          });
          const body = await parseJsonResponse(res);
          if (!body.success) throw new Error(body.error || 'Save failed');
          return body;
        },
        {
          loading: 'Saving…',
          success: 'Progress saved',
          error: (err) => err?.message || 'Could not save',
        }
      );

      setData((prev) =>
        prev ? { ...prev, progress: json.progress, progressMap: json.progressMap } : prev
      );
      resetDraftAfterSave();
    } catch (e) {
      setError(e.message || 'Could not save progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return <RoadmapViewerSkeleton title={initialMeta?.title} />;
  }

  if (error && !data) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Map className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to roadmaps
        </Link>
      </div>
    );
  }

  const { roadmap, purchased, totalDays, unlockedDayCount } = data;
  const needsPurchase = !purchased && unlockedDayCount < totalDays;
  const lockedCount = totalDays - unlockedDayCount;
  const displayTitle = roadmap.title || initialMeta?.title;

  return (
    <div className={`min-h-screen ${isDirty && modalDayNum == null ? 'max-md:pb-28 md:pb-24' : ''}`}>
      <div className="border-b border-neutral-200/80 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            All roadmaps
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <RoadmapProgressRing percent={mergedProgress.percent} size={72} label="done" />
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug">
                  {displayTitle}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 tabular-nums">
                  {mergedProgress.completedTasks}/{mergedProgress.totalTasks} tasks ·{' '}
                  {unlockedDayCount}/{totalDays} days unlocked
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {purchased ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                      Full access
                    </span>
                  ) : roadmap.free_preview_days > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                      <Gift className="w-3 h-3" />
                      {roadmap.free_preview_days} free preview day
                      {roadmap.free_preview_days === 1 ? '' : 's'}
                    </span>
                  ) : null}
                  {!purchased ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                      ₹{roadmap.price_inr} · one-time
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {roadmap.description?.trim() ? (
              <div className="mt-4 rounded-xl bg-white/80 border border-neutral-100 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">
                  About this plan
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {roadmap.description.trim()}
                </p>
              </div>
            ) : null}
          </div>

          {needsPurchase ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowCheckout((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      Unlock {lockedCount} more day{lockedCount === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      One-time ₹{roadmap.price_inr} · {ROADMAP_PURCHASE_NOTICE}
                    </p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              </button>

              {showCheckout ? (
                <div className="px-4 sm:px-5 pb-5 border-t border-neutral-100 bg-neutral-50/50">
                  <LegalTermsCheckbox
                    id="roadmap-checkout-terms"
                    checked={termsAccepted}
                    onChange={setTermsAccepted}
                    returnPath={`/roadmaps/${slug}`}
                    className="mt-4 mb-4"
                  />
                  <RoadmapCheckout
                    roadmapSlug={slug}
                    roadmapTitle={roadmap.title}
                    priceInr={roadmap.price_inr}
                    termsAccepted={termsAccepted}
                    onSuccess={() => {
                      setShowCheckout(false);
                      load();
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 text-xs text-red-600">{error}</p>
      ) : null}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="search"
            placeholder={totalDays > 30 ? `Search ${totalDays} days…` : 'Search days or tasks…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 shadow-sm"
          />
        </div>

        {filteredMeta.length === 0 ? (
          <p className="text-center text-sm text-neutral-500 py-12">No days match your search.</p>
        ) : (
          <>
            <RoadmapDayList
              dayMeta={displayedMeta}
              groupWeeks={groupWeeks && !isSearching}
              onOpenDay={setModalDayNum}
              onUnlock={() => setShowCheckout(true)}
            />
            {hasMoreDays ? (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleDayCount((n) => n + DAYS_PAGE_SIZE)}
                  className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 px-5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-emerald-200 transition-colors"
                >
                  Load more days ({filteredMeta.length - visibleDayCount} remaining)
                </button>
              </div>
            ) : null}
            {isSearching ? (
              <p className="text-center text-[11px] text-neutral-400 mt-3">
                Showing {filteredMeta.length} match{filteredMeta.length === 1 ? '' : 'es'}
              </p>
            ) : null}
          </>
        )}

        <p className="text-center text-[11px] text-neutral-400 mt-8 pb-2">
          Tap a day to open tasks · check off locally · save when ready
        </p>
      </div>

      <RoadmapDayModal
        open={modalDayNum != null}
        day={modalDay}
        dayProgress={modalDay?.progress ?? 0}
        mergedMap={mergedMap}
        serverMap={serverProgressMap}
        draft={draft}
        hydrated={hydrated}
        onToggle={toggleComplete}
        onNotesChange={setNotes}
        onClose={() => setModalDayNum(null)}
        hasPrev={modalIdx > 0}
        hasNext={modalIdx >= 0 && modalIdx < unlockedMeta.length - 1}
        onPrevDay={() =>
          setModalDayNum(findNextUnlockedDay(unlockedMeta, modalDayNum, -1))
        }
        onNextDay={() =>
          setModalDayNum(findNextUnlockedDay(unlockedMeta, modalDayNum, 1))
        }
        isDirty={isDirty}
        dirtyCount={dirtyCount}
        saving={saving}
        onSave={handleSaveAll}
        onDiscard={discardChanges}
      />

      {isDirty && hydrated && modalDayNum == null ? (
        <RoadmapSaveBar
          dirtyCount={dirtyCount}
          saving={saving}
          onSave={handleSaveAll}
          onDiscard={discardChanges}
        />
      ) : null}
    </div>
  );
}
