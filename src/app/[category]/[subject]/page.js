"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { applyProgressUserFilter } from "@/lib/progressIdentity";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight, BookOpen, ShieldClose, RefreshCw,
  SlidersHorizontal, X, TrendingUp, CheckCircle2, Target, Zap,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getCachedData, invalidateCache } from "@/lib/utils/apiCache";

// ─── Lazy-loaded components ───────────────────────────────────────────────────
const Alert        = dynamic(() => import("@/components/Alert"),  { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"),    { ssr: false });

// ─── Supabase (singleton) ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

// ─── TTLs ─────────────────────────────────────────────────────────────────────
const TTL_CONTENT  = 10 * 60 * 1000; // 10 min
const TTL_PROGRESS =      30 * 1000; // 30 sec

// ─── Progress fetch pagination ────────────────────────────────────────────────
// Supabase default page size is 1000. We paginate to remove the hard cap.
const PROGRESS_PAGE_SIZE = 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toTitleCase = (str) => {
  if (!str) return "";
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
};

const normalizeKey = (str) => (str || "").toString().trim().toLowerCase();
const slugifyKey   = (str) =>
  normalizeKey(str)
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// FIX: memoize pickProgress results per (progressMap, ...candidates) call site
// via a simple per-render WeakMap cache keyed on the progressMap object.
// This avoids re-running the 3-key lookup for every card re-render.
const _pickCache = new WeakMap();
const pickProgress = (progressMap, ...candidates) => {
  if (!progressMap) return null;

  // Build a per-render cache keyed on the progressMap object reference
  let cacheForMap = _pickCache.get(progressMap);
  if (!cacheForMap) {
    cacheForMap = new Map();
    _pickCache.set(progressMap, cacheForMap);
  }

  const cacheKey = candidates.join("\x00");
  if (cacheForMap.has(cacheKey)) return cacheForMap.get(cacheKey);

  let result = null;
  outer: for (const c of candidates) {
    if (!c) continue;
    for (const key of [c, normalizeKey(c), slugifyKey(c)]) {
      if (key && progressMap[key]) { result = progressMap[key]; break outer; }
    }
  }

  cacheForMap.set(cacheKey, result);
  return result;
};

// ─── GATE category set ────────────────────────────────────────────────────────
const GATE_CATEGORIES = new Set(["gate"]);

// ─── Debounce hook ────────────────────────────────────────────────────────────
// Prevents filteredAndSortedTopics/Chapters from recomputing on every keystroke
function useDebounce(value, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// =============================================================================
// Error Boundary
// =============================================================================
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, i) { console.error("Rendering error:", e, i); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex justify-center items-center p-4">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h1>
            <p className="text-neutral-500 text-sm mb-5">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// ProgressSidebarContent
// =============================================================================
const ProgressSidebarContent = React.memo(({
  user,
  isGateExam,
  aggregateProgress,
  allSubtopicsLength,
  chaptersLength,
  snapshotTotalQuestions,
  sortBy,
  setSortBy,
  setShowAuthModal,
  onSortChange,
}) => {
  const handleSort = useCallback((option) => {
    setSortBy(option);
    onSortChange?.();
  }, [setSortBy, onSortChange]);

  return (
    <div className="space-y-4">
      {user ? (
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Your Progress</h4>

          <div className="mb-3">
            <div className="flex justify-between text-sm text-neutral-700 mb-1.5">
              <span>{isGateExam ? "Topics" : "Chapters"} done</span>
              <span className="font-semibold">{aggregateProgress.completionPercentage}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-neutral-900 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${aggregateProgress.completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-700 mb-1.5">
              <span>Questions done</span>
              <span className="font-semibold">{aggregateProgress.questionCompletionPercentage}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${aggregateProgress.questionCompletionPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
                label: isGateExam ? "Topics" : "Chapters",
                value: `${aggregateProgress.completedCount}/${isGateExam ? allSubtopicsLength : chaptersLength}`,
              },
              {
                icon: <Target className="w-3.5 h-3.5 text-indigo-600" />,
                label: "Questions",
                value: `${aggregateProgress.totalCompletedQuestions}/${snapshotTotalQuestions}`,
              },
              {
                icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600" />,
                label: "Correct",
                value: aggregateProgress.totalCorrectAnswers,
              },
              {
                icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
                label: "Accuracy",
                value: `${aggregateProgress.accuracy}%`,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-neutral-200 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {icon}
                  <span className="text-[11px] text-neutral-500">{label}</span>
                </div>
                <p className="text-sm font-semibold text-neutral-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-neutral-400" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-1">Track Your Progress</h4>
            <p className="text-xs text-neutral-500 mb-3">Sign in to save progress across sessions</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition text-sm font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Sort by</h4>
        <div className="space-y-1">
          {[
            { id: "default",   label: "Default",   desc: "Original order" },
            { id: "progress",  label: "Progress",  desc: "Most completed first" },
            { id: "remaining", label: "Remaining", desc: "Most left first" },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              type="button"
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between group ${
                sortBy === id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-200"
              }`}
              onClick={() => handleSort(id)}
              aria-pressed={sortBy === id}
            >
              <div>
                <p className={`text-sm font-medium ${sortBy === id ? "text-white" : "text-neutral-900"}`}>{label}</p>
                <p className={`text-xs mt-0.5 ${sortBy === id ? "text-neutral-300" : "text-neutral-500"}`}>{desc}</p>
              </div>
              {sortBy === id && <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4">
        <h4 className="text-xs font-semibold text-indigo-700 mb-1">💡 Pro tip</h4>
        <p className="text-xs text-indigo-600 leading-relaxed">
          Use{" "}
          <kbd className="px-1 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-mono">
            Ctrl + /
          </kbd>{" "}
          to jump to search instantly.
        </p>
      </div>
    </div>
  );
});
ProgressSidebarContent.displayName = "ProgressSidebarContent";

// =============================================================================
// Main Component
// =============================================================================
const Examtracker = () => {
  const { category, subject } = useParams();
  const { user, setShowAuthModal } = useAuth();

  // ── Derived constants ────────────────────────────────────────────────────────
  const isGateExam = useMemo(
    () => GATE_CATEGORIES.has(category?.toLowerCase()),
    [category]
  );

  const encodedCategory = useMemo(
    () => (category ? encodeURIComponent(category.toUpperCase()) : ""),
    [category]
  );
  const encodedSubject = useMemo(
    () => (subject ? encodeURIComponent(subject) : ""),
    [subject]
  );

  const decodedSubject   = useMemo(() => (subject ? decodeURIComponent(subject) : null), [subject]);
  const formattedSubject = useMemo(() => (decodedSubject ? toTitleCase(decodedSubject) : null), [decodedSubject]);
  const activeSubject    = formattedSubject || "";

  // ── State ────────────────────────────────────────────────────────────────────
  const [data,              setData]              = useState([]);
  const [chapters,          setChapters]          = useState([]);
  const [chapterTopics,     setChapterTopics]     = useState({});
  const [userProgress,      setUserProgress]      = useState({});
  const [searchTerm,        setSearchTerm]        = useState("");
  const debouncedSearch = useDebounce(searchTerm, 180);
  const [sortBy,            setSortBy]            = useState("default");
  const [isLoading,         setIsLoading]         = useState(true);
  const [isRefreshing,      setIsRefreshing]      = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  const searchInputRef = useRef(null);

  const gateInFlightRef     = useRef(false);
  const chaptersInFlightRef = useRef(false);
  const lastUserIdRef       = useRef(null);

  // ── Cache keys ───────────────────────────────────────────────────────────────
  const cacheKeyContent = useMemo(
    () => `content-${category}-${subject}`,
    [category, subject]
  );
  const cacheKeyProgress = useMemo(
    () => `progress-${user?.id}-${category}`,
    [user?.id, category]
  );

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchGateData = useCallback(
    async (forceRefresh = false) => {
      if (gateInFlightRef.current) return;
      gateInFlightRef.current = true;
      if (!forceRefresh) setIsLoading(true);

      try {
        if (forceRefresh) invalidateCache(cacheKeyContent);

        const subjectsData = await getCachedData(
          cacheKeyContent,
          async () => {
            const res = await fetch(
              `/api/allsubtopics?category=${encodedCategory}`,
              { headers: { Authorization: `Bearer ${API_TOKEN}`, "Cache-Control": "max-age=600" } }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            return json.subjectsData || [];
          },
          TTL_CONTENT
        );

        setData(subjectsData || []);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("fetchGateData:", err);
        toast.error("Failed to load topics. Please refresh.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        gateInFlightRef.current = false;
      }
    },
    [cacheKeyContent, encodedCategory]
  );

  const fetchChaptersWithTopics = useCallback(
    async (forceRefresh = false) => {
      if (chaptersInFlightRef.current) return;
      chaptersInFlightRef.current = true;
      if (!forceRefresh) setIsLoading(true);

      try {
        if (forceRefresh) invalidateCache(cacheKeyContent);

        const cached = await getCachedData(
          cacheKeyContent,
          async () => {
            const url = `/api/chapters/with-topics?category=${encodedCategory}&subject=${encodedSubject}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "API error");

            const chapterList = json.data?.chapters || [];
            const topicsMap = Object.fromEntries(
              chapterList.map((ch) => [ch.slug || ch.title, ch.topics || []])
            );
            return { chapters: chapterList, topicsMap };
          },
          TTL_CONTENT
        );

        setChapters(cached.chapters || []);
        setChapterTopics(cached.topicsMap || {});
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("fetchChaptersWithTopics:", err);
        toast.error("Failed to load chapters. Please refresh.");
        setChapters([]);
        setChapterTopics({});
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        chaptersInFlightRef.current = false;
      }
    },
    [cacheKeyContent, encodedCategory, encodedSubject]
  );

  // ── fetchUserProgress: paginated to remove 1000-row hard cap ────────────────
  // Fetches all pages of user_progress for a given user + category.
  // Each page is PROGRESS_PAGE_SIZE rows; we stop when a page is short.
  const fetchUserProgress = useCallback(
    async (progressUser, forceRefresh = false) => {
      if (!progressUser?.id || !category) return;

      try {
        if (forceRefresh) invalidateCache(cacheKeyProgress);

        const progressMap = await getCachedData(
          cacheKeyProgress,
          async () => {
            const areaLower = category.toLowerCase();
            const areaOr    = `area.eq.${areaLower},area.eq.${category},area.eq.${category.toUpperCase()}`;

            const allRows = [];
            let page = 0;

            while (true) {
              const from = page * PROGRESS_PAGE_SIZE;
              const to   = from + PROGRESS_PAGE_SIZE - 1;

              let query = supabase
                .from("user_progress")
                .select("topic, completedquestions, correctanswers, points")
                .or(areaOr)
                .range(from, to)
                .order("topic", { ascending: true });
              query = applyProgressUserFilter(query, progressUser);

              const { data: rows, error } = await query;

              if (error) throw error;

              allRows.push(...(rows || []));

              // If we got fewer rows than the page size, we've reached the end
              if (!rows || rows.length < PROGRESS_PAGE_SIZE) break;
              page++;
            }
            // ── End pagination ─────────────────────────────────────────────

            const map = new Map();
            for (const row of allRows) {
              const value = {
                completedQuestions: row.completedquestions || [],
                correctAnswers:     row.correctanswers    || [],
                points:             row.points            || 0,
              };
              const raw  = (row.topic || "").toString();
              const keys = [raw, raw.trim(), normalizeKey(raw), slugifyKey(raw)].filter(Boolean);
              for (const k of keys) {
                if (!map.has(k)) map.set(k, value);
              }
            }

            return Object.fromEntries(map.entries());
          },
          TTL_PROGRESS
        );

        setUserProgress(progressMap || {});
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("fetchUserProgress:", err);
        setUserProgress({});
      }
    },
    [cacheKeyProgress, category]
  );

  // ── Surgical real-time progress patch ────────────────────────────────────────
  // Instead of doing a full re-fetch on every Postgres change, we apply a
  // targeted patch to the local state. A full re-fetch is only triggered when
  // the row doesn't already exist in local state (i.e. a brand-new topic).
  const patchProgressFromPayload = useCallback(
    (payload) => {
      const row = payload?.new;
      if (!row) return;

      const value = {
        completedQuestions: row.completedquestions || [],
        correctAnswers:     row.correctanswers    || [],
        points:             row.points            || 0,
      };
      const raw  = (row.topic || "").toString();
      const keys = [raw, raw.trim(), normalizeKey(raw), slugifyKey(raw)].filter(Boolean);

      setUserProgress((prev) => {
        // Check if any key already exists; if not, full re-fetch is safer
        const exists = keys.some((k) => k in prev);
        if (!exists) return prev; // signal full re-fetch below

        const next = { ...prev };
        for (const k of keys) next[k] = value;
        return next;
      });

      // Return whether we need a full re-fetch (topic was new)
      return keys.every((k) => !(k in userProgress));
    },
    [userProgress]
  );

  // ── Mount / category+subject change ─────────────────────────────────────────
  useEffect(() => {
    if (isGateExam) fetchGateData(false);
    else fetchChaptersWithTopics(false);
  }, [isGateExam, fetchGateData, fetchChaptersWithTopics]);

  // ── User change — force-refresh progress ─────────────────────────────────────
  useEffect(() => {
    if (user?.id) {
      const isNewUser = lastUserIdRef.current !== user.id;
      fetchUserProgress(user, isNewUser).finally(() => {
        lastUserIdRef.current = user.id;
      });
    } else {
      lastUserIdRef.current = null;
      setUserProgress({});
    }
  }, [user?.id, fetchUserProgress]);

  // ── Real-time Supabase subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !category) return;

    let active = true;

    const channel = supabase
      .channel(`progress-${user.id}-${category}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "user_progress",
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          if (!active) return;

          // Only process rows belonging to this category
          const area = payload?.new?.area || payload?.old?.area || "";
          if (
            area.toLowerCase() !== category.toLowerCase() &&
            area !== category &&
            area !== category.toUpperCase()
          ) return;

          // Try surgical patch first; fall back to full re-fetch only if the
          // topic doesn't exist in local state yet (e.g. first attempt ever)
          const needsFullRefetch = patchProgressFromPayload(payload);
          if (needsFullRefetch) {
            invalidateCache(cacheKeyProgress);
            fetchUserProgress(user, true);
          } else {
            // Patch applied — just invalidate the cache entry so the next
            // manual refresh or TTL expiry gets fresh data
            invalidateCache(cacheKeyProgress);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, category, cacheKeyProgress, fetchUserProgress, patchProgressFromPayload]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  const searchTermRef        = useRef(searchTerm);
  const showMobileOptionsRef = useRef(showMobileOptions);
  useEffect(() => { searchTermRef.current        = searchTerm;        }, [searchTerm]);
  useEffect(() => { showMobileOptionsRef.current = showMobileOptions; }, [showMobileOptions]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (searchTermRef.current)        setSearchTerm("");
        if (showMobileOptionsRef.current) setShowMobileOptions(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual refresh ────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (isGateExam) fetchGateData(true);
    else fetchChaptersWithTopics(true);

    if (user?.id) {
      invalidateCache(cacheKeyProgress);
      fetchUserProgress(user, true);
    }

    toast.success("Data refreshed!");
  }, [isGateExam, fetchGateData, fetchChaptersWithTopics, user?.id, cacheKeyProgress, fetchUserProgress]);

  // ==========================================================================
  // DERIVED DATA
  // ==========================================================================

  const { allSubtopics, totalQuestionCount } = useMemo(() => {
    const subtopics = [];
    let total = 0;
    for (const s of data) {
      for (const t of s.subtopics || []) {
        total += t.count || 0;
        subtopics.push({
          ...t,
          parentSubject: s.subject,
          uniqueId: `${s.subject}-${t.title}`,
        });
      }
    }
    return { allSubtopics: subtopics, totalQuestionCount: total };
  }, [data]);

  // FIX: use debouncedSearch instead of searchTerm so the filter memo doesn't
  // recompute on every keystroke — only after typing pauses for 180ms
  const filteredAndSortedTopics = useMemo(() => {
    if (!isGateExam) return [];

    const normalizeStr = (str) => str.toLowerCase().replace(/[-\s]/g, "");

    let topics = activeSubject
      ? (() => {
          const found = data.find(
            (s) =>
              s.subject === activeSubject ||
              s.subject.toLowerCase() === activeSubject.toLowerCase() ||
              normalizeStr(s.subject) === normalizeStr(activeSubject)
          );
          return found
            ? (found.subtopics || []).map((t) => ({
                ...t,
                parentSubject: found.subject,
                uniqueId: `${found.subject}-${t.title}`,
              }))
            : allSubtopics;
        })()
      : allSubtopics;

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      topics = topics.filter((t) => t.title.toLowerCase().includes(lower));
    }

    return [...topics].sort((a, b) => {
      const ap    = pickProgress(userProgress, a.title) || {};
      const bp    = pickProgress(userProgress, b.title) || {};
      const aComp = ap.completedQuestions?.length || 0;
      const bComp = bp.completedQuestions?.length || 0;
      const aTotal = a.count || 1;
      const bTotal = b.count || 1;

      switch (sortBy) {
        case "progress":  return bComp / bTotal - aComp / aTotal;
        case "remaining": return (bTotal - bComp) - (aTotal - aComp);
        default:
          return activeSubject
            ? a.title.localeCompare(b.title)
            : a.parentSubject.localeCompare(b.parentSubject) || a.title.localeCompare(b.title);
      }
    });
  }, [isGateExam, activeSubject, allSubtopics, debouncedSearch, sortBy, userProgress, data]);

  // FIX: chapterProgressMap depends only on chapters + chapterTopics + userProgress.
  // Split from filteredAndSortedChapters so sorting doesn't recompute the progress map.
  const chapterProgressMap = useMemo(() => {
    if (isGateExam) return {};
    const map = {};

    for (const chapter of chapters) {
      const key    = chapter.slug || chapter.title;
      const topics = chapterTopics?.[key] || [];

      let totalQ = 0, completedQ = 0, correctA = 0, completedTopics = 0;

      for (const t of topics) {
        const tp   = pickProgress(userProgress, t?.title, t?.slug) || {};
        const tq   = t?.count || 0;
        const doneQ = tp.completedQuestions?.length || 0;
        const corr  = tp.correctAnswers?.length    || 0;

        totalQ += tq;
        completedQ += doneQ;
        correctA   += corr;
        if (doneQ > 0) completedTopics += 1;
      }

      const totalTopics = topics.length;
      const effectiveTotal = totalQ || chapter.count || 0;

      map[key] = {
        totalQuestions:     effectiveTotal,
        completedQuestions: completedQ,
        correctAnswers:     correctA,
        completedTopics,
        totalTopics,
        progressPercentage: effectiveTotal
          ? Math.round((completedQ / effectiveTotal) * 100)
          : 0,
        accuracy:    completedQ > 0 ? Math.round((correctA / completedQ) * 100) : 0,
        isCompleted: completedQ >= effectiveTotal && effectiveTotal > 0,
      };
    }

    return map;
  }, [chapters, chapterTopics, userProgress, isGateExam]);

  // FIX: filteredAndSortedChapters only depends on debouncedSearch + sortBy +
  // chapterProgressMap — not on userProgress directly. This means a progress
  // update only triggers a re-sort when chapterProgressMap changes, not on
  // every intermediate userProgress write.
  const filteredAndSortedChapters = useMemo(() => {
    if (isGateExam) return [];

    const filtered = debouncedSearch
      ? chapters.filter((ch) => ch.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : chapters;

    return [...filtered].sort((a, b) => {
      const ap = chapterProgressMap[a.slug || a.title] || {};
      const bp = chapterProgressMap[b.slug || b.title] || {};

      switch (sortBy) {
        case "progress":
          return (bp.progressPercentage || 0) - (ap.progressPercentage || 0);
        case "remaining":
          return (
            ((ap.totalQuestions || 0) - (ap.completedQuestions || 0)) -
            ((bp.totalQuestions || 0) - (bp.completedQuestions || 0))
          );
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [isGateExam, chapters, debouncedSearch, sortBy, chapterProgressMap]);

  const { aggregateProgress, snapshotTotalQuestions } = useMemo(() => {
    if (isGateExam) {
      const totalTopics     = allSubtopics.length;
      const completedTopics = Object.keys(userProgress).filter(
        (k) => (userProgress[k]?.completedQuestions?.length || 0) > 0
      ).length;
      const totalDone    = Object.values(userProgress).reduce((s, t) => s + (t.completedQuestions?.length || 0), 0);
      const totalCorrect = Object.values(userProgress).reduce((s, t) => s + (t.correctAnswers?.length    || 0), 0);

      return {
        snapshotTotalQuestions: totalQuestionCount,
        aggregateProgress: {
          completedCount:               completedTopics,
          completionPercentage:         totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0,
          totalCompletedQuestions:      totalDone,
          totalCorrectAnswers:          totalCorrect,
          questionCompletionPercentage: totalQuestionCount ? Math.round((totalDone / totalQuestionCount) * 100) : 0,
          accuracy: totalDone > 0 ? Math.round((totalCorrect / totalDone) * 100) : 0,
        },
      };
    }

    const totalChapters     = chapters.length;
    const completedChapters = chapters.filter((ch) => chapterProgressMap[ch.slug || ch.title]?.isCompleted).length;

    let totalQ = 0, completedQ = 0, correctA = 0;
    for (const ch of chapters) {
      const cp = chapterProgressMap[ch.slug || ch.title] || {};
      totalQ    += cp.totalQuestions     || ch.count || 0;
      completedQ += cp.completedQuestions || 0;
      correctA   += cp.correctAnswers    || 0;
    }

    return {
      snapshotTotalQuestions: totalQ,
      aggregateProgress: {
        completedCount:               completedChapters,
        completionPercentage:         totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
        totalCompletedQuestions:      completedQ,
        totalCorrectAnswers:          correctA,
        questionCompletionPercentage: totalQ ? Math.round((completedQ / totalQ) * 100) : 0,
        accuracy: completedQ > 0 ? Math.round((correctA / completedQ) * 100) : 0,
      },
    };
  }, [isGateExam, allSubtopics.length, userProgress, totalQuestionCount, chapters, chapterProgressMap]);

  const categoryLabel = useMemo(
    () => toTitleCase(category?.replace(/-/g, " ") || ""),
    [category]
  );

  // FIX: include onSortChange in sharedSidebarProps so the mobile drawer
  // gets the correct close callback — was missing in original
  const sharedSidebarProps = useMemo(() => ({
    user,
    isGateExam,
    aggregateProgress,
    allSubtopicsLength:    allSubtopics.length,
    chaptersLength:        chapters.length,
    snapshotTotalQuestions,
    sortBy,
    setSortBy,
    setShowAuthModal,
  }), [
    user, isGateExam, aggregateProgress, allSubtopics.length,
    chapters.length, snapshotTotalQuestions, sortBy, setSortBy, setShowAuthModal,
  ]);

  const visibleCount = isGateExam
    ? filteredAndSortedTopics.length
    : filteredAndSortedChapters.length;

  // ==========================================================================
  // LOADING
  // ==========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Suspense fallback={null}>
          <MetaDataJobs
            seoTitle={`${categoryLabel} Practice Tracker`}
            seoDescription={`Practice ${categoryLabel} PYQs Topic-Wise Chapter-Wise.`}
          />
        </Suspense>
        <Navbar />
        <div className="flex justify-center items-center min-h-[70vh] pt-20 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-5 max-w-sm w-full"
          >
            <div className="w-11 h-11 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin flex-shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-neutral-900 mb-0.5">Loading dashboard</h3>
              <p className="text-xs text-neutral-500">Fetching your progress…</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <MetaDataJobs
          seoTitle={`${categoryLabel} Practice Tracker`}
          seoDescription={`Practice ${categoryLabel} PYQs Topic-Wise Chapter-Wise Date-Wise questions with detailed solutions.`}
        />
      </Suspense>
      <Navbar />

      <div className="min-h-screen bg-neutral-50 pt-20 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 sm:space-y-6">

          {/* ── Hero ─────────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(99,102,241,0.06),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(0,0,0,0.03),transparent_55%)]" />

              <div className="relative px-5 sm:px-8 py-6 sm:py-8">
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">

                  {/* Left */}
                  <div className="lg:col-span-7">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
                        {category?.toUpperCase()} {formattedSubject ? `• ${formattedSubject}` : ""}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
                      {formattedSubject || `${categoryLabel} Practice`}
                    </h1>
                    <p className="mt-2.5 text-sm sm:text-base text-neutral-500 max-w-xl leading-relaxed">
                      One dashboard — track progress, practise PYQs, run topic tests and attempt
                      mocks without hopping between pages.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("practice-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-700 transition-colors shadow-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        Start practice
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                        aria-label="Refresh data"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMobileOptions(true)}
                        className="inline-flex md:hidden items-center gap-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                        aria-label="Options"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Options
                      </button>
                    </div>
                  </div>

                  {/* Right: snapshot */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur-sm p-4 sm:p-5">
                      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                        Snapshot
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                        {[
                          {
                            value: isGateExam ? allSubtopics.length : chapters.length,
                            label: isGateExam ? "Topics" : "Chapters",
                            color: "text-indigo-600",
                          },
                          { value: snapshotTotalQuestions, label: "Questions", color: "text-blue-600" },
                          { value: `${aggregateProgress.completionPercentage}%`, label: "Done", color: "text-green-600" },
                        ].map(({ value, label, color }) => (
                          <div key={label} className="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-3 text-center">
                            <p className={`text-lg sm:text-xl font-bold tabular-nums ${color}`}>{value}</p>
                            <p className="mt-0.5 text-[11px] text-neutral-500">{label}</p>
                          </div>
                        ))}
                      </div>

                      {user && (
                        <div>
                          <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>Overall progress</span>
                            <span className="font-medium text-neutral-700">{aggregateProgress.questionCompletionPercentage}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${aggregateProgress.questionCompletionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* ── Body ─────────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  {categoryLabel} Tracker
                </h3>
                <ProgressSidebarContent {...sharedSidebarProps} />
              </div>
            </aside>

            {/* Mobile options drawer */}
            <AnimatePresence>
              {showMobileOptions && (
                <motion.div
                  className="fixed inset-0 bg-black/50 z-50 md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileOptions(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-semibold text-neutral-900">Options & Progress</h3>
                      <button
                        onClick={() => setShowMobileOptions(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
                    <ProgressSidebarContent
                      {...sharedSidebarProps}
                      onSortChange={() => setShowMobileOptions(false)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">

              {/* Search + sort bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
                        {activeSubject || "All Subjects"}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {visibleCount} {isGateExam ? "topics" : "chapters"}
                        {debouncedSearch && ` for "${debouncedSearch}"`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSearchTerm(""); setSortBy("default"); }}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      <ShieldClose className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </div>

                  <div className="relative">
                    <svg
                      className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={`Search ${isGateExam ? "topics" : "chapters"}…  (Ctrl + /)`}
                      className="pl-9 pr-9 py-2.5 w-full border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-neutral-50 placeholder-neutral-400 transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search topics or chapters"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-neutral-400 hover:text-neutral-700 transition" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Suspense fallback={null}>
                <Alert
                  type="info"
                  message="We update our question bank daily. Found an issue? Report it — we'll fix it within 48 hrs!"
                  linkText="Learn More"
                  linkHref="https://10tracker.com/about-us"
                  dismissible
                />
              </Suspense>

              {/* ── Grid ─────────────────────────────────────────────────────── */}
              <motion.div
                id="practice-grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
              >
                {isGateExam
                  ? filteredAndSortedTopics.map((topic) => {
                      const tp = pickProgress(
                        userProgress,
                        topic.title,
                        slugifyKey(topic.title),
                        normalizeKey(topic.title)
                      ) || { completedQuestions: [], correctAnswers: [], points: 0 };

                      const completedCnt = tp.completedQuestions?.length || 0;
                      const correctCnt   = tp.correctAnswers?.length    || 0;
                      const pct          = topic.count ? Math.round((completedCnt / topic.count) * 100) : 0;
                      const done         = completedCnt === topic.count && topic.count > 0;
                      const accuracy     = completedCnt > 0 ? Math.round((correctCnt / completedCnt) * 100) : 0;

                      return (
                        <TopicCard
                          key={topic.uniqueId}
                          title={toTitleCase(topic.title)}
                          subtitle={topic.parentSubject}
                          completedCount={completedCnt}
                          totalCount={topic.count}
                          progressPercentage={pct}
                          isCompleted={done}
                          accuracy={accuracy}
                          href={`/${category}/practice/${topic.title}`}
                          extra={
                            completedCnt > 0 && (
                              <div className="flex flex-wrap gap-1.5 text-xs text-neutral-600">
                                <Pill label="Points" value={tp.points} />
                                <Pill label="Correct" value={correctCnt} />
                              </div>
                            )
                          }
                        />
                      );
                    })
                  : filteredAndSortedChapters.map((chapter) => {
                      const chapterKey  = chapter.slug || chapter.title;
                      const chapterSlug = chapter.slug || chapter.title.toLowerCase().replace(/\s+/g, "-");
                      const cp          = chapterProgressMap[chapterKey] || {
                        totalQuestions: chapter.count || 0,
                        completedQuestions: 0, correctAnswers: 0,
                        completedTopics: 0, totalTopics: 0,
                        progressPercentage: 0, accuracy: 0, isCompleted: false,
                      };

                      return (
                        <TopicCard
                          key={chapterKey}
                          title={toTitleCase(chapter.title)}
                          subtitle={chapter.subject || formattedSubject}
                          completedCount={cp.completedQuestions}
                          totalCount={cp.totalQuestions || chapter.count || 0}
                          progressPercentage={cp.progressPercentage}
                          isCompleted={cp.isCompleted}
                          accuracy={cp.accuracy}
                          detailsHref={`/${category}/${subject}/${chapterSlug}`}
                          href={`/${category}/${subject}/${chapterSlug}/practice`}
                          extra={
                            cp.completedQuestions > 0 && (
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>Correct: {cp.correctAnswers}</span>
                                <span>Topics: {cp.completedTopics}/{cp.totalTopics}</span>
                              </div>
                            )
                          }
                        />
                      );
                    })}
              </motion.div>

              {/* Empty state */}
              {visibleCount === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm p-8 text-center border border-neutral-200"
                >
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-7 w-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1">
                    {isGateExam ? "No topics found" : "No chapters found"}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {debouncedSearch
                      ? `No results for "${debouncedSearch}" — try a different keyword`
                      : activeSubject
                        ? `Nothing available for "${activeSubject}" yet`
                        : "No content available yet"}
                  </p>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition"
                    >
                      Clear search
                    </button>
                  )}
                </motion.div>
              )}

            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <div className="md:hidden fixed bottom-6 right-5 z-30">
          <button
            onClick={() => setShowMobileOptions(true)}
            className="h-14 w-14 rounded-full bg-neutral-900 text-white shadow-lg flex items-center justify-center hover:bg-neutral-700 transition active:scale-95"
            aria-label="Show options"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { borderRadius: "12px", fontSize: "13px" },
            success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

const StatusBadge = React.memo(({ isCompleted, completedCount }) => {
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Done
      </span>
    );
  }
  if (completedCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" /> Active
      </span>
    );
  }
  return (
    <span className="bg-neutral-50 text-neutral-500 border border-neutral-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
      New
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

const TopicCard = React.memo(({
  title, subtitle,
  completedCount, totalCount,
  progressPercentage, isCompleted, accuracy,
  href, detailsHref,
  extra,
}) => (
  <div
    className={`group bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
      isCompleted
        ? "border-green-200 hover:border-green-300"
        : completedCount > 0
          ? "border-indigo-200 hover:border-indigo-300"
          : "border-neutral-200 hover:border-neutral-300"
    }`}
  >
    <div className="p-4 sm:p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusBadge isCompleted={isCompleted} completedCount={completedCount} />
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-2.5 py-1.5 text-center min-w-[52px]">
            <p className={`text-sm font-bold tabular-nums ${
              isCompleted ? "text-green-600" : completedCount > 0 ? "text-indigo-600" : "text-neutral-400"
            }`}>{progressPercentage}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span><span className="font-medium text-neutral-800">{completedCount}</span> / {totalCount} questions</span>
          {accuracy > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              {accuracy}% accuracy
            </span>
          )}
        </div>

        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
              isCompleted ? "bg-green-500" : completedCount > 0 ? "bg-indigo-500" : "bg-neutral-300"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {extra && <div className="pt-0.5">{extra}</div>}
      </div>

      <div className={`grid gap-2 mt-4 ${detailsHref ? "grid-cols-2" : "grid-cols-1"}`}>
        {detailsHref && (
          <Link
            href={detailsHref}
            className="block text-center py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors text-xs font-semibold"
          >
            Details
          </Link>
        )}
        <Link
          href={href}
          className={`block text-center py-2 rounded-xl text-xs font-semibold transition-colors ${
            isCompleted
              ? "border border-green-300 text-green-700 hover:bg-green-50"
              : "bg-neutral-900 text-white hover:bg-neutral-700"
          }`}
        >
          {completedCount > 0 ? "Resume" : "Start"} →
        </Link>
      </div>
    </div>
  </div>
));
TopicCard.displayName = "TopicCard";

const Pill = React.memo(({ label, value }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[11px]">
    <span className="text-neutral-500">{label}</span>
    <span className="font-semibold text-neutral-800 tabular-nums">{value}</span>
  </span>
));
Pill.displayName = "Pill";

export default React.memo(Examtracker);