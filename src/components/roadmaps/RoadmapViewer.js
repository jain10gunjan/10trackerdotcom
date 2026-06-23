'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Gift,
  Lock,
  Map,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import LegalTermsCheckbox from '@/components/legal/LegalTermsCheckbox';
import RoadmapCheckout from '@/components/roadmaps/RoadmapCheckout';
import RoadmapDayList from '@/components/roadmaps/RoadmapDayList';
import RoadmapDayNav, { COMPACT_WEEK_THRESHOLD } from '@/components/roadmaps/RoadmapDayNav';
import RoadmapDayModal from '@/components/roadmaps/RoadmapDayModal';
import RoadmapProgressRing from '@/components/roadmaps/RoadmapProgressRing';
import RoadmapSaveBar from '@/components/roadmaps/RoadmapSaveBar';
import RoadmapStreakBadges from '@/components/roadmaps/RoadmapStreakBadges';
import RoadmapViewerSkeleton from '@/components/roadmaps/RoadmapViewerSkeleton';
import { useRoadmapDraft } from '@/hooks/useRoadmapDraft';
import { useRoadmapKeyboard } from '@/hooks/useRoadmapKeyboard';
import { ROADMAP_DAYS_PAGE_SIZE, ROADMAP_PURCHASE_NOTICE } from '@/lib/roadmaps/constants';
import { calculateRoadmapProgress } from '@/lib/roadmaps/progressUtils';
import {
  computeCompletedDayStreak,
  computeEarnedMilestones,
  countCompletedDays,
  findResumeDay,
} from '@/lib/roadmaps/streakUtils';
import { getLastViewedDay, setLastViewedDay } from '@/lib/roadmaps/viewerSessionStore';
import {
  buildDayMeta,
  extractFocusAreas,
  filterDayMeta,
  filterDayMetaByFocus,
  findNextUnlockedDay,
  mergeSummariesWithDays,
} from '@/lib/roadmaps/viewerUtils';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

function buildDaysQuery({ offset, focusArea, search }) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(ROADMAP_DAYS_PAGE_SIZE),
  });
  if (focusArea && focusArea !== 'All') params.set('focus', focusArea);
  if (search?.trim()) params.set('search', search.trim());
  return params.toString();
}

export default function RoadmapViewer({ slug, initialMeta = null }) {
  const { user, setShowAuthModal } = useAuth();
  const userKey = user?.email?.toLowerCase() || 'guest';
  const searchInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [loadedDays, setLoadedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [modalDayNum, setModalDayNum] = useState(null);
  const [navDayNum, setNavDayNum] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusFilter, setFocusFilter] = useState('All');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  const [showResumeBanner, setShowResumeBanner] = useState(true);

  const deferredSearch = useDeferredValue(searchQuery);
  const deferredFocus = useDeferredValue(focusFilter);
  const serverProgressMap = data?.progressMap || {};

  const {
    mergedMap,
    draft,
    dirtyCount,
    isDirty,
    hydrated,
    toggleComplete,
    setNotes,
    setAllTasksStatus,
    discardChanges,
    getTasksToSave,
    resetDraftAfterSave,
  } = useRoadmapDraft(slug, serverProgressMap, userKey);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadedDays([]);
    try {
      const params = new URLSearchParams({
        dayOffset: '0',
        dayLimit: String(ROADMAP_DAYS_PAGE_SIZE),
      });
      if (deferredFocus !== 'All') params.set('focus', deferredFocus);
      if (deferredSearch.trim()) params.set('search', deferredSearch.trim());

      const res = await fetch(`/api/roadmaps/${encodeURIComponent(slug)}?${params}`, {
        credentials: 'include',
      });
      const json = await parseJsonResponse(res);
      if (!json.success) throw new Error(json.error || 'Failed to load');
      setData(json);
      setLoadedDays(json.days || []);
    } catch (e) {
      setError(e.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [slug, deferredFocus, deferredSearch]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const daySummaries = data?.daySummaries || [];
  const mergedDays = useMemo(
    () => mergeSummariesWithDays(daySummaries, loadedDays),
    [daySummaries, loadedDays]
  );

  const dayMeta = useMemo(() => buildDayMeta(mergedDays, mergedMap), [mergedDays, mergedMap]);

  const filteredMeta = useMemo(() => {
    let list = dayMeta;
    if (deferredFocus !== 'All') list = filterDayMetaByFocus(list, deferredFocus);
    if (deferredSearch.trim()) list = filterDayMeta(list, deferredSearch);
    return list;
  }, [dayMeta, deferredFocus, deferredSearch]);

  const unlockedMeta = useMemo(() => dayMeta.filter((d) => !d.locked), [dayMeta]);
  const focusAreas = useMemo(
    () => data?.focusAreas || extractFocusAreas(dayMeta),
    [data?.focusAreas, dayMeta]
  );

  const loadedDayNumbers = useMemo(
    () => new Set(loadedDays.map((d) => d.day_number)),
    [loadedDays]
  );

  const displayedMeta = useMemo(() => {
    if (deferredSearch.trim() || deferredFocus !== 'All') return filteredMeta;
    return filteredMeta.filter((d) => d.locked || loadedDayNumbers.has(d.day_number));
  }, [filteredMeta, deferredSearch, deferredFocus, loadedDayNumbers]);

  const pagination = data?.pagination;
  const hasMoreDays = Boolean(pagination?.hasMore);

  const loadMoreDays = async () => {
    if (!pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextOffset = loadedDays.length;
      const qs = buildDaysQuery({
        offset: nextOffset,
        focusArea: deferredFocus,
        search: deferredSearch,
      });
      const res = await fetch(`/api/roadmaps/${encodeURIComponent(slug)}/days?${qs}`, {
        credentials: 'include',
      });
      const json = await parseJsonResponse(res);
      if (!json.success) throw new Error(json.error || 'Failed to load more');
      setLoadedDays((prev) => {
        const byNum = Object.fromEntries(prev.map((d) => [d.day_number, d]));
        for (const d of json.days || []) byNum[d.day_number] = d;
        return Object.values(byNum).sort((a, b) => a.day_number - b.day_number);
      });
      setData((prev) =>
        prev ? { ...prev, pagination: json.pagination } : prev
      );
    } catch (e) {
      setError(e.message || 'Could not load more days');
    } finally {
      setLoadingMore(false);
    }
  };

  const resumeDay = useMemo(() => findResumeDay(dayMeta), [dayMeta]);
  const lastViewedDay = useMemo(() => getLastViewedDay(slug), [slug, hydrated]);

  useEffect(() => {
    if (!hydrated || !unlockedMeta.length) return;
    const initial = resumeDay ?? lastViewedDay ?? unlockedMeta[0]?.day_number;
    if (initial && navDayNum == null) setNavDayNum(initial);
  }, [hydrated, unlockedMeta, resumeDay, lastViewedDay, navDayNum]);

  const modalDay = useMemo(
    () => unlockedMeta.find((d) => d.day_number === modalDayNum) || null,
    [unlockedMeta, modalDayNum]
  );

  const mergedProgress = useMemo(
    () => calculateRoadmapProgress(unlockedMeta, mergedMap),
    [unlockedMeta, mergedMap]
  );

  const streakStats = useMemo(() => computeCompletedDayStreak(dayMeta), [dayMeta]);
  const earnedMilestones = useMemo(
    () => computeEarnedMilestones(dayMeta, mergedProgress.percent),
    [dayMeta, mergedProgress.percent]
  );
  const completedDaysCount = useMemo(() => countCompletedDays(dayMeta), [dayMeta]);

  const groupWeeks = (data?.totalDays ?? dayMeta.length) >= COMPACT_WEEK_THRESHOLD;
  const modalIdx = unlockedMeta.findIndex((d) => d.day_number === modalDayNum);

  const modalTaskStats = useMemo(() => {
    if (!modalDay?.focus_areas) return { total: 0, completed: 0 };
    const tasks = modalDay.focus_areas.flatMap((fa) => fa.tasks || []);
    const total = tasks.length;
    const completed = tasks.filter((t) => mergedMap[t.task_id]?.status === 'completed').length;
    return { total, completed };
  }, [modalDay, mergedMap]);

  const openDay = useCallback(
    async (dayNum) => {
      const existing = mergedDays.find((d) => d.day_number === dayNum);
      const hasTasks = (existing?.focus_areas || []).some((fa) => fa.tasks?.length);

      if (!hasTasks && !existing?.locked) {
        try {
          const res = await fetch(
            `/api/roadmaps/${encodeURIComponent(slug)}/days?dayNumber=${dayNum}`,
            { credentials: 'include' }
          );
          const json = await parseJsonResponse(res);
          if (json.success && json.days?.[0]) {
            setLoadedDays((prev) => {
              const byNum = Object.fromEntries(prev.map((d) => [d.day_number, d]));
              byNum[dayNum] = json.days[0];
              return Object.values(byNum).sort((a, b) => a.day_number - b.day_number);
            });
          }
        } catch {
          /* open with summary if fetch fails */
        }
      }

      setModalDayNum(dayNum);
      setNavDayNum(dayNum);
      setLastViewedDay(slug, dayNum);
    },
    [slug, mergedDays]
  );

  const handleJumpSubmit = () => {
    const n = Number(jumpValue);
    if (!Number.isFinite(n) || n < 1) return;
    const target = dayMeta.find((d) => d.day_number === n);
    if (!target) return;
    if (target.locked) {
      setShowCheckout(true);
      return;
    }
    openDay(n);
    setJumpValue('');
  };

  useRoadmapKeyboard({
    enabled: Boolean(data),
    searchInputRef,
    modalOpen: modalDayNum != null,
    onCloseModal: () => setModalDayNum(null),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onPrevDay: () => {
      const next = findNextUnlockedDay(unlockedMeta, navDayNum ?? unlockedMeta[0]?.day_number, -1);
      if (next != null) setNavDayNum(next);
    },
    onNextDay: () => {
      const next = findNextUnlockedDay(unlockedMeta, navDayNum ?? unlockedMeta[0]?.day_number, 1);
      if (next != null) setNavDayNum(next);
    },
  });

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
  const continueDay = resumeDay ?? lastViewedDay;

  return (
    <div className={`min-h-screen ${isDirty && modalDayNum == null ? 'max-md:pb-28 md:pb-24' : ''}`}>
      <div className="border-b border-neutral-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
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
                <RoadmapStreakBadges
                  currentStreak={streakStats.currentStreak}
                  bestStreak={streakStats.bestStreak}
                  earnedMilestones={earnedMilestones}
                  completedDays={completedDaysCount}
                />
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

          {showResumeBanner && continueDay && !modalDayNum ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <p className="text-sm text-emerald-900">
                {resumeDay ? 'Pick up where you left off' : 'Continue from last visit'} — Day{' '}
                {continueDay}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openDay(continueDay)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <Play className="w-3.5 h-3.5" />
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setShowResumeBanner(false)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 px-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

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
                      loadMeta();
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 text-xs text-red-600">{error}</p>
      ) : null}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 items-start">
          <aside className="hidden lg:block sticky top-24">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Day navigator
            </p>
            <RoadmapDayNav
              dayMeta={dayMeta}
              selectedDayNum={navDayNum}
              onSelectDay={(n) => {
                const day = dayMeta.find((d) => d.day_number === n);
                if (day?.locked) {
                  setShowCheckout(true);
                  return;
                }
                openDay(n);
              }}
              jumpValue={jumpValue}
              onJumpChange={setJumpValue}
              onJumpSubmit={handleJumpSubmit}
              useWeekGroups={groupWeeks}
            />
            <p className="mt-3 text-[10px] text-neutral-400 leading-relaxed">
              Shortcuts: <kbd className="px-1 py-0.5 rounded bg-neutral-100">/</kbd> search ·{' '}
              <kbd className="px-1 py-0.5 rounded bg-neutral-100">j</kbd>/
              <kbd className="px-1 py-0.5 rounded bg-neutral-100">k</kbd> navigate
            </p>
          </aside>

          <div>
            <div className="lg:hidden mb-4">
              <RoadmapDayNav
                dayMeta={dayMeta}
                selectedDayNum={navDayNum}
                onSelectDay={(n) => {
                  const day = dayMeta.find((d) => d.day_number === n);
                  if (day?.locked) {
                    setShowCheckout(true);
                    return;
                  }
                  openDay(n);
                }}
                jumpValue={jumpValue}
                onJumpChange={setJumpValue}
                onJumpSubmit={handleJumpSubmit}
                useWeekGroups={false}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder={totalDays > 30 ? `Search ${totalDays} days… (press /)` : 'Search days or tasks… (press /)'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 shadow-sm"
                />
              </div>
              {focusAreas.length > 1 ? (
                <select
                  value={focusFilter}
                  onChange={(e) => setFocusFilter(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-[140px]"
                >
                  <option value="All">All focus areas</option>
                  {focusAreas.map((fa) => (
                    <option key={fa} value={fa}>
                      {fa}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {filteredMeta.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No days match your filters.</p>
            ) : (
              <>
                <RoadmapDayList
                  dayMeta={displayedMeta}
                  groupWeeks={groupWeeks && !deferredSearch.trim() && deferredFocus === 'All'}
                  onOpenDay={openDay}
                  onUnlock={() => setShowCheckout(true)}
                />
                {hasMoreDays ? (
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={loadMoreDays}
                      disabled={loadingMore}
                      className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 px-5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-emerald-200 transition-colors disabled:opacity-60"
                    >
                      {loadingMore
                        ? 'Loading…'
                        : `Load more days (${(pagination?.total ?? 0) - loadedDays.length} remaining)`}
                    </button>
                  </div>
                ) : null}
                {deferredSearch.trim() || deferredFocus !== 'All' ? (
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
        </div>
      </div>

      <RoadmapDayModal
        open={modalDayNum != null}
        day={modalDay}
        dayProgress={modalDay?.progress ?? 0}
        totalDays={totalDays}
        totalTasks={modalTaskStats.total}
        completedTasks={modalTaskStats.completed}
        mergedMap={mergedMap}
        serverMap={serverProgressMap}
        draft={draft}
        hydrated={hydrated}
        onToggle={toggleComplete}
        onNotesChange={setNotes}
        onSetAllTasksStatus={setAllTasksStatus}
        onClose={() => setModalDayNum(null)}
        hasPrev={modalIdx > 0}
        hasNext={modalIdx >= 0 && modalIdx < unlockedMeta.length - 1}
        onPrevDay={() => openDay(findNextUnlockedDay(unlockedMeta, modalDayNum, -1))}
        onNextDay={() => openDay(findNextUnlockedDay(unlockedMeta, modalDayNum, 1))}
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
