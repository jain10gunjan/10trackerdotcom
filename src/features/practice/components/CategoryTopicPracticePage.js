"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, memo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { usePracticeCreditGate } from "@/features/credits/lib/usePracticeCreditGate";
import { useCredits } from "@/context/CreditsContext";
import { normalizeQuestionId } from "@/features/credits/lib/practiceCreditUtils";
import { showPracticeAnswerToast } from "@/features/credits/lib/practiceAnswerToast";
import { applyPracticeProgressUpdate } from "@/features/credits/lib/recordPracticeProgress";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import { applyProgressUserFilter, mergeProgressRows } from "@/lib/progressIdentity";
import {
  readProgressBuffer,
  writeProgressBuffer,
  saveProgressBufferToSupabase,
} from "@/lib/progressBuffer";
import toast from "react-hot-toast";
import { Clock } from "lucide-react";
import {
  shouldOfferAdvance,
  promptDifficultyAdvance,
} from "@/features/practice/lib/difficultyAdvance";
import { buildEffectiveCompletedSet } from "@/features/practice/lib/practiceCompletedSet";

// Lazy-loaded components
const QuestionCard = dynamic(() => import("@/features/practice/components/QuestionCard"), { 
  ssr: false,
  loading: () => <QuestionSkeleton />
});
import ExamSubpageHeader from "@/features/exam-hub/components/ExamSubpageHeader";

// Constants
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "jain10gunjan@gmail.com";
const QUESTIONS_PER_PAGE = 5;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum cache entries
const POINTS_PER_CORRECT_ANSWER = 100;

const DIFFICULTIES = ["easy", "medium", "hard"];
const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

const parseDifficultyParam = (sp) => {
  if (!sp) return null;
  const raw = sp.get("difficulty");
  if (!raw) return null;
  const d = String(raw).toLowerCase();
  return DIFFICULTIES.includes(d) ? d : null;
};

// Utility: Parse page number from URL
const parsePageFromUrl = (searchParams) => {
  const pageFromUrl = searchParams?.get("page");
  const parsed = parseInt(pageFromUrl || "1", 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

// Utility: Format topic name
const formatTopicName = (pagetopic) => {
  return pagetopic?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "";
};

// Utility: Error handler
const handleError = (error, userMessage, logMessage) => {
  if (process.env.NODE_ENV === 'development' && logMessage) {
    console.error(logMessage, error);
  }
  toast.error(userMessage);
};

// Simple Skeleton
const QuestionSkeleton = memo(() => (
  <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
    <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  </div>
));

QuestionSkeleton.displayName = 'QuestionSkeleton';

// Simple Difficulty Button
const DifficultyButton = memo(({ difficulty, count, active, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
      active 
        ? "bg-neutral-900 text-white" 
        : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
    }`}
  >
    <span className="capitalize">{difficulty}</span>
    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
      active ? "bg-white/20" : "bg-neutral-100"
    }`}>
      {count || 0}
    </span>
  </button>
));

DifficultyButton.displayName = 'DifficultyButton';

const Pagetracker = memo(() => {
  const mathJaxConfig = useMemo(() => ({
    "fast-preview": { disabled: false },
    tex: { 
      inlineMath: [["$", "$"], ["\\(", "\\)"]], 
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
      processEscapes: true,
    },
    messageStyle: "none",
    showMathMenu: false,
  }), []);

  const { category, pagetopic } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, setShowAuthModal } = useAuth();
  const { chargeForQuestion, canAttemptPractice } = usePracticeCreditGate();
  const { setShowPaywall } = useCredits();

  // State
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  // Single source of truth: difficulty comes from URL (?difficulty=) so pagination / navigation keeps the tab
  const activeDifficulty = useMemo(
    () => parseDifficultyParam(searchParams) || "easy",
    [searchParams]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [progress, setProgress] = useState({
    completed: [],
    correct: [],
    points: 0
  });
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const [difficultyQuestionIds, setDifficultyQuestionIds] = useState(new Set()); // Store question IDs for current difficulty
  const difficultyQuestionIdsRef = useRef(difficultyQuestionIds);
  const countsRef = useRef(counts);
  const activeDifficultyRef = useRef(activeDifficulty);
  const handleDifficultyChangeRef = useRef(null);

  useEffect(() => {
    difficultyQuestionIdsRef.current = difficultyQuestionIds;
  }, [difficultyQuestionIds]);
  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);
  useEffect(() => {
    activeDifficultyRef.current = activeDifficulty;
  }, [activeDifficulty]);

  // Single source of truth: derive page from URL to avoid duplicate state + sync effect re-renders
  const currentPage = useMemo(
    () => parsePageFromUrl(searchParams),
    [searchParams]
  );

  // Refs for optimization
  const cacheRef = useRef(new Map());
  const [unsavedCount, setUnsavedCount] = useState(0);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const hasShownUnsavedToastRef = useRef(false);

  // Cache helpers with cleanup
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cacheRef.current.entries());
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) {
        cacheRef.current.delete(key);
      }
    });

    // Limit cache size
    if (cacheRef.current.size > MAX_CACHE_SIZE) {
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, cacheRef.current.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => cacheRef.current.delete(key));
    }
  }, []);

  const getCached = useCallback((key) => {
    cleanupCache();
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      cacheRef.current.delete(key);
    }
    return null;
  }, [cleanupCache]);

  const setCached = useCallback((key, data) => {
    cleanupCache();
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, [cleanupCache]);

  // Fetch counts with optimized query
  const fetchCounts = useCallback(async () => {
    if (!category || !pagetopic) return;

    const cacheKey = `counts-${category}-${pagetopic}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setCounts(cached);
      return;
    }

    try {
      // Fetch all difficulties in one query, count in database
      const { data, error } = await supabase
        .from("examtracker")
        .select("difficulty")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase());

      if (error) throw error;

      // Count in memory (more efficient than multiple queries)
      const countsData = { easy: 0, medium: 0, hard: 0 };
      if (data) {
        data.forEach(q => {
          if (q.difficulty && countsData.hasOwnProperty(q.difficulty)) {
            countsData[q.difficulty]++;
          }
        });
      }

      setCounts(countsData);
      setCached(cacheKey, countsData);
    } catch (error) {
      handleError(error, "Failed to load question counts", "Error fetching counts:");
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch all question IDs for current difficulty (for progress calculation)
  const fetchDifficultyQuestionIds = useCallback(async (difficulty) => {
    if (!pagetopic || !category) return;

    const cacheKey = `questionIds-${category}-${pagetopic}-${difficulty}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      setDifficultyQuestionIds(new Set(cached));
      return;
    }

    try {
      const { data, error } = await supabase
        .from("examtracker")
        .select("_id")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty);

      if (error) throw error;

      const ids = (data || []).map((q) => normalizeQuestionId(q._id)).filter(Boolean);
      setDifficultyQuestionIds(new Set(ids));
      setCached(cacheKey, ids);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching question IDs:", error);
      }
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch questions with pagination (sets loading only on network fetch, not on cache hit)
  const fetchQuestions = useCallback(async (difficulty, page = 1) => {
    if (!pagetopic || !category) return;

    const cacheKey = `questions-${category}-${pagetopic}-${difficulty}-${page}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setQuestions(cached);
      return;
    }

    setIsLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from("examtracker")
        .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, difficulty, year, subject, order_index, directionHTML, topic")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty)
        .order("order_index", { ascending: true })
        .range((page - 1) * QUESTIONS_PER_PAGE, page * QUESTIONS_PER_PAGE - 1);

      if (error) throw error;

      const questionsData = data || [];
      setQuestions(questionsData);
      setCached(cacheKey, questionsData);
    } catch (error) {
      handleError(error, "Failed to load questions", "Error fetching questions:");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    if (!user?.id || !pagetopic || !category) {
      setProgress({ completed: [], correct: [], points: 0 });
      return;
    }

    try {
      let query = supabase
        .from("user_progress")
        .select("completedquestions, correctanswers, points")
        .eq("topic", pagetopic)
        .eq("area", category);
      query = applyProgressUserFilter(query, user);

      const { data, error } = await query;

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const rows = Array.isArray(data) ? data : data ? [data] : [];
      const merged = mergeProgressRows(rows);
      setProgress(merged);
    } catch (error) {
      handleError(error, "Failed to load progress", "Error fetching user progress:");
      setProgress({ completed: [], correct: [], points: 0 });
    }
  }, [user, pagetopic, category]);

  // Helper: Fetch existing progress from database
  const fetchExistingProgress = useCallback(async () => {
    let query = supabase
      .from("user_progress")
      .select("completedquestions, correctanswers, points")
      .eq("topic", pagetopic)
      .eq("area", category);
    query = applyProgressUserFilter(query, user);

    const { data, error } = await query;

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return mergeProgressRows(rows);
  }, [user, pagetopic, category]);

  const refreshUnsavedCount = useCallback(() => {
    const userId = user?.id;
    if (!userId || typeof window === "undefined") { setUnsavedCount(0); return; }
    const buffer = readProgressBuffer(userId);
    setUnsavedCount(Object.keys(buffer.entries ?? {}).length);
  }, [user?.id]);

  // One-time UX hint if buffer exists (e.g. user returned later)
  useEffect(() => {
    if (!user?.id) return;
    if (!unsavedCount) { hasShownUnsavedToastRef.current = false; return; }
    if (hasShownUnsavedToastRef.current) return;
    hasShownUnsavedToastRef.current = true;
    toast("You have unsaved progress. Click “Save Progress” to sync it.", { duration: 3500 });
  }, [user?.id, unsavedCount]);

  // Overlay buffered (unsaved) progress onto what we display for THIS page's loaded questions.
  const effectiveProgress = useMemo(() => {
    if (!user?.id) return progress;
    const visibleIds = new Set((questions ?? []).map((q) => String(q?._id ?? "")).filter(Boolean));
    if (!visibleIds.size) return progress;

    const area = String(category ?? "").trim().toLowerCase();
    const topic = String(pagetopic ?? "").trim();
    const { entries } = readProgressBuffer(user.id);

    const completed = new Set((progress.completed ?? []).map(String));
    const correct = new Set((progress.correct ?? []).map(String));
    let pointsDelta = 0;

    for (const [qidRaw, e] of Object.entries(entries ?? {})) {
      const qid = String(qidRaw ?? "");
      if (!qid || !visibleIds.has(qid)) continue;
      if (String(e?.area ?? "") !== area) continue;
      if (String(e?.topic ?? "") !== topic) continue;

      const alreadyCompleted = completed.has(qid);
      completed.add(qid);

      if (e?.correct === true) {
        correct.add(qid);
        if (!alreadyCompleted) pointsDelta += typeof e?.points === "number" ? e.points : POINTS_PER_CORRECT_ANSWER;
      } else {
        correct.delete(qid);
      }
    }

    return {
      completed: [...completed],
      correct: [...correct],
      points: (progress.points ?? 0) + pointsDelta,
    };
  }, [user?.id, category, pagetopic, questions, unsavedCount, progress]);

  const saveBufferedProgress = useCallback(async () => {
    if (!user?.id) { setShowAuthModal(true); return; }
    if (typeof window === "undefined") return;
    const userId = user.id;
    if (Object.keys(readProgressBuffer(userId).entries ?? {}).length === 0) { setUnsavedCount(0); return; }

    setIsManualSaving(true);
    try {
      await saveProgressBufferToSupabase({ supabase, upsertUserProgress, user });
      toast.success("Progress saved!", { duration: 2000 });
      setUnsavedCount(0);
      fetchUserProgress();
    } catch (e) {
      handleError(e, "Failed to save progress.", "Error saving buffered progress:");
      refreshUnsavedCount();
    } finally {
      setIsManualSaving(false);
    }
  }, [user, setShowAuthModal, fetchUserProgress, refreshUnsavedCount]);

  const persistAttempt = useCallback(
    (questionId, isCorrect, { withCredit }) => {
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      const qid = normalizeQuestionId(questionId);
      const area = String(category ?? "").trim().toLowerCase();
      const topic = String(pagetopic ?? "").trim();

      if (withCredit) {
        const creditCharge = chargeForQuestion({
          user,
          questionId: qid,
          completedIds: progressRef.current.completed,
          area,
          topic,
        });

        if (!creditCharge.ok) return;
        if (creditCharge.skipped) return;

        showPracticeAnswerToast(isCorrect);
      }

      const completedSet = buildEffectiveCompletedSet({
        savedCompleted: progressRef.current.completed,
        userId: user.id,
        area,
        topic,
      });
      const diff = activeDifficultyRef.current;
      const ids = difficultyQuestionIdsRef.current;
      const total = countsRef.current[diff] ?? ids.size;
      const offerAdvance = shouldOfferAdvance({
        questionId: qid,
        difficultyQuestionIds: ids,
        completedSet,
        totalCount: total,
      });

      const unsaved = applyPracticeProgressUpdate({
        userId: user.id,
        questionId: qid,
        isCorrect,
        area,
        topic,
        pointsPerCorrect: POINTS_PER_CORRECT_ANSWER,
        setProgress,
      });
      if (typeof unsaved === "number") setUnsavedCount(unsaved);

      if (offerAdvance) {
        setTimeout(() => {
          promptDifficultyAdvance({
            current: diff,
            counts: countsRef.current,
            scopeLabel: "topic",
            onAdvance: (next) => handleDifficultyChangeRef.current?.(next),
            celebrateFn: (msg) => toast.success(msg, { duration: 3500, icon: "🎉" }),
          });
        }, 400);
      }
    },
    [user, setShowAuthModal, category, pagetopic, chargeForQuestion]
  );

  const handleAnswer = useCallback(
    (questionId, isCorrect) => persistAttempt(questionId, isCorrect, { withCredit: true }),
    [persistAttempt]
  );

  // Restore last difficulty when opening a new topic/chapter link that omits ?difficulty=
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!category || !pagetopic) return;
    if (parseDifficultyParam(searchParams)) return;
    try {
      const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
      if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("difficulty", saved);
        params.delete("page");
        const query = params.toString();
        const basePath = pathname || "";
        router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
      }
    } catch (_) {
      /* ignore */
    }
  }, [category, pagetopic, pathname, router, searchParams]);

  // Persist difficulty choice for cross-page navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty);
    } catch (_) {
      /* ignore */
    }
  }, [activeDifficulty]);

  // Handle difficulty change (page resets to 1 via URL; difficulty always in query string)
  const handleDifficultyChange = useCallback(
    (difficulty) => {
      if (difficulty === activeDifficulty || isLoadingQuestions) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("difficulty", difficulty);
      params.delete("page");
      const query = params.toString();
      const basePath = pathname || "";
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]
  );

  useEffect(() => {
    handleDifficultyChangeRef.current = handleDifficultyChange;
  }, [handleDifficultyChange]);

  const buildPageHref = useCallback(
    (page) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) params.delete("page");
      else params.set("page", String(page));
      const query = params.toString();
      const basePath = pathname || "";
      return query ? `${basePath}?${query}` : basePath;
    },
    [searchParams, pathname]
  );

  // Initial load: counts only when category/topic change (full-page loading)
  useEffect(() => {
    if (!category || !pagetopic) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchCounts();
        if (!cancelled) setIsLoading(false);
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [category, pagetopic, fetchCounts]);

  // Question IDs for current difficulty (when category, topic, or difficulty change — not on page change)
  useEffect(() => {
    if (!category || !pagetopic || !activeDifficulty) return;
    fetchDifficultyQuestionIds(activeDifficulty);
  }, [category, pagetopic, activeDifficulty, fetchDifficultyQuestionIds]);

  // Questions: fetch only when category, topic, difficulty, or PAGE change (loading set inside fetchQuestions on cache miss only)
  useEffect(() => {
    if (!category || !pagetopic) return;
    let cancelled = false;
    const load = async () => {
      await fetchQuestions(activeDifficulty, currentPage);
      if (cancelled) return;
      // no need to set loading false here; fetchQuestions handles it
    };
    load();
    return () => { cancelled = true; };
  }, [category, pagetopic, activeDifficulty, currentPage, fetchQuestions]);

  // Load progress when user changes
  useEffect(() => {
    fetchUserProgress();
  }, [user?.id, pagetopic, category, fetchUserProgress]); // More specific dependencies

  // initialize unsaved count from shared local buffer
  useEffect(() => { refreshUnsavedCount(); }, [refreshUnsavedCount]);

  // unsaved changes warning: tab close/refresh + internal navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!unsavedCount) return;
    const warningText = "You have unsaved progress. Please save before leaving.";

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = warningText;
      return warningText;
    };

    const handleDocumentClickCapture = (e) => {
      const a = e.target?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href) return;
      if (href.startsWith("#")) return;
      if (a.getAttribute("target") === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const ok = window.confirm(warningText);
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handlePopState = () => {
      const ok = window.confirm(warningText);
      if (!ok) window.history.forward();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClickCapture, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClickCapture, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [unsavedCount]);

  // Pagination helpers - must be defined before stats useMemo
  const totalQuestionsForDifficulty = useMemo(
    () => counts[activeDifficulty] || 0,
    [counts, activeDifficulty]
  );

  // Calculate stats with optimized memoization - based on overall progress for current difficulty
  const stats = useMemo(() => {
    const total = totalQuestionsForDifficulty;
    
    if (total === 0 || difficultyQuestionIds.size === 0) {
      return {
        completed: 0,
        correct: 0,
        total: 0,
        completionPercentage: 0,
        accuracy: 0,
        points: effectiveProgress.points
      };
    }

    // Filter progress to only include questions from current difficulty
    const completedForDifficulty = effectiveProgress.completed.filter(id => difficultyQuestionIds.has(id));
    const correctForDifficulty = effectiveProgress.correct.filter(id => difficultyQuestionIds.has(id));
    
    const completed = completedForDifficulty.length;
    const correct = correctForDifficulty.length;
    
    return {
      completed,
      correct,
      total,
      completionPercentage: total ? Math.round((completed / total) * 100) : 0,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      points: effectiveProgress.points
    };
  }, [totalQuestionsForDifficulty, difficultyQuestionIds, effectiveProgress.completed, effectiveProgress.correct, effectiveProgress.points]);
  
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalQuestionsForDifficulty / QUESTIONS_PER_PAGE) || 1),
    [totalQuestionsForDifficulty]
  );

  // Keep URL page in sync with available data (handles invalid/out-of-range page params)
  useEffect(() => {
    // Wait until counts/questions have loaded to avoid resetting valid page params on initial mount
    if (isLoading || isLoadingQuestions || !totalPages) return;
    if (currentPage > totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      if (totalPages === 1) {
        params.delete("page");
      } else {
        params.set("page", String(totalPages));
      }
      const query = params.toString();
      const basePath = pathname || "";
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
    }
  }, [currentPage, totalPages, router, searchParams, pathname, isLoading, isLoadingQuestions]);

  // Format topic name
  const topicName = useMemo(() => formatTopicName(pagetopic), [pagetopic]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex justify-center items-center min-h-[60vh] pt-8 px-4">
          <div className="bg-white p-8 rounded-lg border border-neutral-200 flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            <div>
              <h3 className="text-lg font-medium text-neutral-900">Loading questions</h3>
              <p className="text-sm text-neutral-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        <div className="bg-neutral-50 pt-24 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <ExamSubpageHeader
              title={topicName}
              description={`${totalQuestionsForDifficulty} questions available for practice.`}
              backHref={`/${category}`}
              backLabel="Exam hub"
            />
            <div className="mb-4 sm:mb-8">
              
              {/* Stats Row */}
              <div className="bg-white rounded-lg border border-neutral-200 p-3 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Completion</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.completionPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Correct</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.correct}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Accuracy</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Points</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.points}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-neutral-700">Progress</span>
                  <span className="text-neutral-600">{stats.completed}/{stats.total} questions</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Difficulty Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {["easy", "medium", "hard"].map((difficulty) => (
                  <DifficultyButton
                    key={difficulty}
                    difficulty={difficulty}
                    count={counts[difficulty]}
                    active={activeDifficulty === difficulty}
                    loading={isLoadingQuestions}
                    onClick={() => handleDifficultyChange(difficulty)}
                  />
                ))}
              </div>

              {/* Manual save (buffers across routes) */}
              {user && (
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-xs text-neutral-600">
                    {unsavedCount > 0 ? (
                      <>
                        <span className="font-semibold text-neutral-900">{unsavedCount}</span>{" "}
                        unsaved update{unsavedCount === 1 ? "" : "s"}
                      </>
                    ) : (
                      "All progress saved"
                    )}
                  </p>
                  <button
                    onClick={saveBufferedProgress}
                    disabled={unsavedCount === 0 || isManualSaving}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                      unsavedCount === 0 || isManualSaving
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                    title={unsavedCount > 0 ? "Save all buffered progress" : "No unsaved progress"}
                  >
                    {isManualSaving ? "Saving…" : "Save Progress"}
                  </button>
                </div>
              )}

              {/* Sign in prompt */}
              {!user && (
                <div className="bg-neutral-50 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-neutral-900">Sign in to track progress</p>
                    <p className="text-xs text-neutral-600">Save your answers and track your improvement</p>
                  </div>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-800 whitespace-nowrap"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-4 w-full overflow-x-hidden">
              <MathJaxContext config={mathJaxConfig}>
                <MathJax>
                  {isLoadingQuestions && questions.length === 0 ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <QuestionSkeleton key={i} />)}
                    </div>
                  ) : questions.length > 0 ? (
                    <>
                      {questions.map((question, index) => (
                        <QuestionCard
                          key={question._id}
                          category={category}
                          question={question}
                          index={index}
                          questionId={question._id}
                          onAnswer={handleAnswer}
                          isCompleted={effectiveProgress.completed.map(String).includes(String(question._id))}
                          isCorrect={effectiveProgress.correct.map(String).includes(String(question._id))}
                          isAdmin={user?.email === ADMIN_EMAIL || user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL}
                          creditsLocked={Boolean(user) && !canAttemptPractice}
                          onRequireCredits={() => setShowPaywall(true)}
                        />
                      ))}
                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-sm text-neutral-700">
                          <a
                            href={
                              currentPage === 1 || isLoadingQuestions
                                ? "#"
                                : buildPageHref(currentPage - 1)
                            }
                            aria-disabled={currentPage === 1 || isLoadingQuestions}
                            className={`px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors w-full sm:w-auto text-center ${
                              currentPage === 1 || isLoadingQuestions ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            Previous
                          </a>
                          <span className="text-xs sm:text-sm">
                            Page <span className="font-semibold">{currentPage}</span> of{" "}
                            <span className="font-semibold">{totalPages}</span>
                          </span>
                          <a
                            href={
                              currentPage === totalPages || isLoadingQuestions
                                ? "#"
                                : buildPageHref(currentPage + 1)
                            }
                            aria-disabled={currentPage === totalPages || isLoadingQuestions}
                            className={`px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors w-full sm:w-auto text-center ${
                              currentPage === totalPages || isLoadingQuestions ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            Next
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                      <Clock size={36} className="mx-auto text-neutral-400 mb-3" />
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {totalQuestionsForDifficulty === 0
                          ? "No questions available"
                          : "No questions on this page"}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {totalQuestionsForDifficulty === 0
                          ? `No questions found for ${activeDifficulty} difficulty.`
                          : "You’ve navigated to an empty page. Use the pagination controls to go back to an earlier page."}
                      </p>
                    </div>
                  )}
                </MathJax>
              </MathJaxContext>
            </div>
          </div>
        </div>
</div>
    </>
  );
});

Pagetracker.displayName = 'Pagetracker';

export default Pagetracker;