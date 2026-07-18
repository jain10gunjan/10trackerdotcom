'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { usePracticeCreditGate } from '@/features/credits/lib/usePracticeCreditGate';
import { useCredits } from '@/context/CreditsContext';
import { showPracticeAnswerToast } from '@/features/credits/lib/practiceAnswerToast';
import { applyPracticeProgressUpdate } from '@/features/credits/lib/recordPracticeProgress';
import {
  readProgressBuffer,
} from '@/lib/progressBuffer';
import {
  flushProgressBufferToApi,
  registerProgressFlushLifecycle,
  onProgressFlushed,
} from '@/lib/progressFlushClient';
import { trackPracticeClient } from '@/lib/practiceMetrics';
import toast from 'react-hot-toast';
import { toastPromise, parseJsonResponse } from '@/lib/toastAsync';
import {
  QUESTIONS_PER_PAGE,
  DIFFICULTIES,
  EXAM_MINUTES_PER_QUESTION,
  parseDifficultyParam,
  progressQuestionId,
  formatSlugTitle,
  getDifficultyStorageKey,
} from '@/features/practice/lib/chapterPracticeUtils';
import {
  fetchChapterCounts,
  fetchChapterQuestions,
  fetchChapterQuestionIds,
  fetchChapterQuestionBodies,
} from '@/features/practice/lib/fetchChapterPractice';
import {
  shouldOfferAdvance,
  promptDifficultyAdvance,
  countCompletedInSet,
} from '@/features/practice/lib/difficultyAdvance';
import { buildEffectiveCompletedSet } from '@/features/practice/lib/practiceCompletedSet';
import {
  readChapterFlags,
  toggleChapterFlag,
} from '@/features/practice/lib/chapterFlags';
import {
  getLinkedQuestionSet,
  resolveLinkedCorrectOptions,
  linkedCorrectKeysComplete,
  LINKED_CORRECT_SEP,
} from '@/lib/parseLinkedQuestionSet';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAILS;

/**
 * @param {{ initialData?: object }} [options]
 */
export function useChapterPractice(options = {}) {
  const { initialData } = options;
  const { category, subject, chaptername } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, setShowAuthModal } = useAuth();
  const { chargeForQuestion, canAttemptPractice } = usePracticeCreditGate();
  const { setShowPaywall } = useCredits();

  const userRef = useRef(user);
  const categoryRef = useRef(category);
  const normalizedChapterRef = useRef('');
  const questionsRef = useRef([]);
  const isSavingRef = useRef(false);
  const fetchAbortRef = useRef(null);
  const hasShownToastRef = useRef(false);
  const examModeRef = useRef(false);
  const hydratedInitialRef = useRef(Boolean(initialData?.questions?.length));

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { categoryRef.current = category; }, [category]);

  const isAdmin = useMemo(
    () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL,
    [user]
  );

  const normalizedChapter = useMemo(
    () => (chaptername ? chaptername.replace(/-/g, ' ') : ''),
    [chaptername]
  );

  useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

  const activeDifficulty = useMemo(
    () => parseDifficultyParam(searchParams) ?? initialData?.difficulty ?? 'easy',
    [searchParams, initialData?.difficulty]
  );

  const difficultyStorageKey = useMemo(
    () => getDifficultyStorageKey(category, normalizedChapter),
    [category, normalizedChapter]
  );

  const [questions, setQuestions] = useState(() => initialData?.questions ?? []);
  const [counts, setCounts] = useState(() => initialData?.counts ?? { easy: 0, medium: 0, hard: 0 });
  const [totalQ, setTotalQ] = useState(() => initialData?.totalQ ?? 0);
  const [matchedChapter, setMatchedChapter] = useState(() => initialData?.matchedChapter ?? null);
  const [loading, setLoading] = useState(() => !initialData?.questions);
  const [loadingQ, setLoadingQ] = useState(false);
  const [progress, setProgress] = useState({ completed: [], correct: [], points: 0 });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [difficultyQuestionIds, setDifficultyQuestionIds] = useState(
    () => new Set((initialData?.difficultyIds ?? []).map(progressQuestionId).filter(Boolean))
  );
  const [difficultyIdList, setDifficultyIdList] = useState(
    () => (initialData?.difficultyIds ?? []).map(progressQuestionId).filter(Boolean)
  );

  const progressRef = useRef(progress);
  const difficultyQuestionIdsRef = useRef(difficultyQuestionIds);
  const countsRef = useRef(counts);
  const activeDifficultyRef = useRef(activeDifficulty);
  const changeDifficultyRef = useRef(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { difficultyQuestionIdsRef.current = difficultyQuestionIds; }, [difficultyQuestionIds]);
  useEffect(() => { countsRef.current = counts; }, [counts]);
  useEffect(() => { activeDifficultyRef.current = activeDifficulty; }, [activeDifficulty]);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(() => Boolean(initialData?.hasMore));
  const [rewritingId, setRewritingId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unsaved, setUnsaved] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveBtnKey, setSaveBtnKey] = useState(0);

  const [listFilter, setListFilter] = useState('all'); // all | wrong | flagged
  const [sessionMode, setSessionMode] = useState('practice'); // practice | exam
  const [flagSet, setFlagSet] = useState(() => new Set());
  const [examEndsAt, setExamEndsAt] = useState(null);
  const [examSummary, setExamSummary] = useState(null);
  const [examSolutionsUnlocked, setExamSolutionsUnlocked] = useState(false);
  const [examNow, setExamNow] = useState(() => Date.now());

  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { examModeRef.current = sessionMode === 'exam'; }, [sessionMode]);

  useEffect(() => {
    setFlagSet(readChapterFlags(user?.id, category, normalizedChapter));
  }, [user?.id, category, normalizedChapter]);

  useEffect(() => {
    if (sessionMode !== 'exam' || !examEndsAt) return undefined;
    const tick = () => setExamNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionMode, examEndsAt]);

  const fetchCounts = useCallback(async () => {
    if (!category || !normalizedChapter) return;
    try {
      const d = await fetchChapterCounts(category, normalizedChapter);
      setCounts({ easy: d.easy, medium: d.medium, hard: d.hard });
      setTotalQ(d.total);
      if (d.matchedChapter) setMatchedChapter(d.matchedChapter);
    } catch {
      setCounts({ easy: 0, medium: 0, hard: 0 });
      setTotalQ(0);
    }
  }, [category, normalizedChapter]);

  const fetchDifficultyQuestionIds = useCallback(async (difficulty) => {
    if (!category || !normalizedChapter || !difficulty) return;
    try {
      const d = await fetchChapterQuestionIds({
        category,
        chapter: normalizedChapter,
        difficulty,
      });
      const idsArr = (d.ids ?? []).map(progressQuestionId).filter(Boolean);
      setDifficultyIdList(idsArr);
      setDifficultyQuestionIds(new Set(idsArr));
      if (d.matchedChapter) setMatchedChapter(d.matchedChapter);
    } catch {
      setDifficultyQuestionIds(new Set());
    }
  }, [category, normalizedChapter]);

  const fetchQuestions = useCallback(async (diff, page = 1, append = false) => {
    if (!normalizedChapter || !category) return;
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;
    setLoadingQ(true);
    try {
      const d = await fetchChapterQuestions({
        category,
        chapter: normalizedChapter,
        difficulty: diff,
        page,
        limit: QUESTIONS_PER_PAGE,
        signal: ctrl.signal,
      });
      setQuestions((prev) => (append ? [...prev, ...d.questions] : d.questions));
      setHasMore(d.hasMore);
      if (d.matchedChapter) setMatchedChapter(d.matchedChapter);
      if (!append) setCurrentIdx(0);
    } catch (e) {
      if (e.name === 'AbortError') return;
      toast.error('Failed to load questions');
      setQuestions([]);
      setHasMore(false);
    } finally {
      setLoadingQ(false);
    }
  }, [category, normalizedChapter]);

  const fetchUserProgress = useCallback(async () => {
    const uid = userRef.current?.id;
    const cat = categoryRef.current;
    if (!uid || !cat) {
      setProgress({ completed: [], correct: [], points: 0 });
      return;
    }
    try {
      const topicSet = new Set();
      for (const q of questionsRef.current ?? []) {
        if (q?.topic) topicSet.add(String(q.topic).trim());
      }
      const topics = [...topicSet];
      if (!topics.length) {
        setProgress({ completed: [], correct: [], points: 0 });
        return;
      }

      const area = cat.toLowerCase();
      const res = await fetch(
        `/api/practice/progress?area=${encodeURIComponent(area)}&topics=${encodeURIComponent(topics.join(','))}`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        trackPracticeClient('progress_read_failed', { status: res.status });
        setProgress({ completed: [], correct: [], points: 0 });
        return;
      }
      setProgress({
        completed: data.completed ?? [],
        correct: data.correct ?? [],
        points: data.points ?? 0,
      });
    } catch {
      trackPracticeClient('progress_read_failed', { error: 'network' });
      setProgress({ completed: [], correct: [], points: 0 });
    }
  }, []);

  const refreshUnsaved = useCallback(() => {
    const uid = userRef.current?.id;
    if (!uid) {
      setUnsaved(0);
      return;
    }
    try {
      const buf = readProgressBuffer(uid);
      setUnsaved(Object.keys(buf.entries ?? {}).length);
    } catch {
      setUnsaved(0);
    }
  }, []);

  const saveProgress = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) {
      setShowAuthModal(true);
      return;
    }
    if (isSavingRef.current) return;
    try {
      const buf = readProgressBuffer(currentUser.id);
      if (!Object.keys(buf.entries ?? {}).length) {
        setUnsaved(0);
        return;
      }
      isSavingRef.current = true;
      setSaving(true);
      const result = await flushProgressBufferToApi(currentUser, { silent: false });
      if (!result.ok) {
        refreshUnsaved();
        toast.error(result.error || 'Save failed. Try again.');
        return;
      }
      await fetchUserProgress();
      setUnsaved(0);
      setSaveBtnKey((k) => k + 1);
      toast.success('Progress saved!', { duration: 2200 });
    } catch {
      refreshUnsaved();
      toast.error('Save failed. Try again.');
      trackPracticeClient('progress_save_failed', { error: 'exception' });
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [fetchUserProgress, refreshUnsaved, setShowAuthModal]);

  useEffect(() => {
    if (!user) return undefined;
    const unregister = registerProgressFlushLifecycle(user);
    const off = onProgressFlushed(() => {
      refreshUnsaved();
      fetchUserProgress();
    });
    return () => {
      unregister?.();
      off?.();
    };
  }, [user, refreshUnsaved, fetchUserProgress]);

  const handleAnswer = useCallback((questionId, isCorrect, questionTopic) => {
    if (!userRef.current) {
      setShowAuthModal(true);
      return;
    }
    const qid = progressQuestionId(questionId);
    if (!qid) return;
    const topic =
      questionTopic != null && String(questionTopic).trim()
        ? String(questionTopic).trim()
        : null;
    const area = (categoryRef.current ?? '').toLowerCase();

    const creditCharge = chargeForQuestion({
      user: userRef.current,
      questionId: qid,
      completedIds: progressRef.current.completed,
      area,
      topic,
    });

    if (!creditCharge.ok) return;
    // Already graded / duplicate credit reservation — do not double-write progress.
    if (creditCharge.skipped && (creditCharge.alreadyDone || creditCharge.duplicate)) {
      return;
    }
    if (creditCharge.skipped) return;

    const completedSet = buildEffectiveCompletedSet({
      savedCompleted: progressRef.current.completed,
      userId: userRef.current.id,
      area,
    });
    const diff = activeDifficultyRef.current;
    const ids = difficultyQuestionIdsRef.current;
    const total = countsRef.current[diff] ?? ids.size;
    const offerAdvance =
      !examModeRef.current &&
      shouldOfferAdvance({
        questionId: qid,
        difficultyQuestionIds: ids,
        completedSet,
        totalCount: total,
      });

    showPracticeAnswerToast(isCorrect);

    const unsavedCount = applyPracticeProgressUpdate({
      userId: userRef.current.id,
      questionId: qid,
      isCorrect,
      area,
      topic,
      pointsPerCorrect: 100,
      setProgress,
    });
    if (typeof unsavedCount === 'number') setUnsaved(unsavedCount);

    if (offerAdvance) {
      setTimeout(() => {
        promptDifficultyAdvance({
          current: diff,
          counts: countsRef.current,
          scopeLabel: 'chapter',
          onAdvance: (next) => changeDifficultyRef.current?.(next),
          celebrateFn: (msg) => toast.success(msg, { duration: 3500 }),
          toastFn: (msg) => toast.success(msg, { duration: 3500 }),
        });
      }, 400);
    }
  }, [setShowAuthModal, chargeForQuestion]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !category || !normalizedChapter) return;
    if (parseDifficultyParam(searchParams)) return;
    try {
      const saved = sessionStorage.getItem(difficultyStorageKey);
      if (saved && DIFFICULTIES.includes(saved) && saved !== 'easy') {
        const p = new URLSearchParams(searchParams.toString());
        p.set('difficulty', saved);
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
      }
    } catch {
      /* ignore */
    }
  }, [category, normalizedChapter, pathname, router, searchParams, difficultyStorageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(difficultyStorageKey, activeDifficulty);
    } catch {
      /* ignore */
    }
  }, [activeDifficulty, difficultyStorageKey]);

  const changeDifficulty = useCallback((d) => {
    if (d === activeDifficulty || loadingQ || examModeRef.current) return;
    setCurrentPage(1);
    setHasMore(true);
    setCurrentIdx(0);
    hydratedInitialRef.current = false;
    const p = new URLSearchParams(searchParams.toString());
    p.set('difficulty', d);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [activeDifficulty, loadingQ, router, searchParams, pathname]);

  useEffect(() => {
    changeDifficultyRef.current = changeDifficulty;
  }, [changeDifficulty]);

  useEffect(() => {
    if (!category || !normalizedChapter || !activeDifficulty) return;
    if (
      hydratedInitialRef.current &&
      initialData?.difficulty === activeDifficulty &&
      difficultyQuestionIds.size > 0
    ) {
      return;
    }
    fetchDifficultyQuestionIds(activeDifficulty);
  }, [
    category,
    normalizedChapter,
    activeDifficulty,
    fetchDifficultyQuestionIds,
    initialData?.difficulty,
    difficultyQuestionIds.size,
  ]);

  const savedComp = useMemo(
    () => new Set((progress.completed ?? []).map(progressQuestionId)),
    [progress.completed]
  );
  const savedCorr = useMemo(
    () => new Set((progress.correct ?? []).map(progressQuestionId)),
    [progress.correct]
  );

  const bufferOverlay = useMemo(() => {
    const uid = user?.id;
    if (!uid) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const area = String(category ?? '').toLowerCase();
    const scopeIds =
      difficultyQuestionIds.size > 0
        ? difficultyQuestionIds
        : new Set((questions ?? []).map((q) => progressQuestionId(q?._id)).filter(Boolean));
    if (!scopeIds.size) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const { entries } = readProgressBuffer(uid) ?? { entries: {} };
    const comp = new Set();
    const corr = new Set();
    let ptsDelta = 0;
    for (const [id, e] of Object.entries(entries ?? {})) {
      const qid = progressQuestionId(id);
      if (!qid || !scopeIds.has(qid) || String(e?.area ?? '') !== area) continue;
      comp.add(qid);
      if (e?.correct === true) {
        corr.add(qid);
        if (!savedComp.has(qid)) {
          ptsDelta += typeof e.points === 'number' ? e.points : 100;
        }
      }
    }
    return { comp, corr, ptsDelta };
  }, [user?.id, category, questions, unsaved, savedComp, difficultyQuestionIds]);

  const compSet = useMemo(() => {
    const s = new Set(savedComp);
    bufferOverlay.comp.forEach((id) => s.add(id));
    return s;
  }, [savedComp, bufferOverlay.comp]);

  const corrSet = useMemo(() => {
    const s = new Set(savedCorr);
    bufferOverlay.comp.forEach((id) => {
      if (bufferOverlay.corr.has(id)) s.add(id);
      else s.delete(id);
    });
    return s;
  }, [savedCorr, bufferOverlay.comp, bufferOverlay.corr]);

  const filteredIndices = useMemo(() => {
    const indices = [];
    for (let i = 0; i < questions.length; i++) {
      const qid = progressQuestionId(questions[i]._id);
      if (listFilter === 'wrong') {
        if (!(compSet.has(qid) && !corrSet.has(qid))) continue;
      } else if (listFilter === 'flagged') {
        if (!flagSet.has(qid)) continue;
      }
      indices.push(i);
    }
    return indices;
  }, [questions, listFilter, compSet, corrSet, flagSet]);

  const filteredGlobalIndices = useMemo(() => {
    if (listFilter === 'all' || !difficultyIdList.length) return null;
    const out = [];
    for (const i of filteredIndices) {
      const id = progressQuestionId(questions[i]?._id);
      const gi = difficultyIdList.indexOf(id);
      if (gi >= 0) out.push(gi);
    }
    return out;
  }, [listFilter, difficultyIdList, filteredIndices, questions]);

  const filteredQuestions = useMemo(
    () => filteredIndices.map((i) => questions[i]),
    [filteredIndices, questions]
  );

  const displayIdx = useMemo(() => {
    if (!filteredIndices.length) return 0;
    const pos = filteredIndices.indexOf(currentIdx);
    return pos >= 0 ? pos : 0;
  }, [filteredIndices, currentIdx]);

  const curQ = filteredIndices.length ? questions[filteredIndices[displayIdx]] : null;

  useEffect(() => {
    if (!filteredIndices.length) return;
    if (!filteredIndices.includes(currentIdx)) {
      setCurrentIdx(filteredIndices[0]);
    }
  }, [filteredIndices, currentIdx]);

  const goToLoaded = useCallback((idx) => {
    if (idx < 0 || idx >= questionsRef.current.length) return;
    setAnimKey((k) => k + 1);
    setCurrentIdx(idx);
    if (idx >= questionsRef.current.length - 3 && hasMore && !loadingQ) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchQuestions(activeDifficulty, next, true);
    }
  }, [hasMore, loadingQ, currentPage, activeDifficulty, fetchQuestions]);

  /** Navigate by index in full difficulty id list (question map). Loads body on demand. */
  const goToRaw = useCallback(async (globalIdx) => {
    if (globalIdx < 0) return;

    if (difficultyIdList.length && globalIdx < difficultyIdList.length) {
      const targetId = difficultyIdList[globalIdx];
      const existingIdx = questionsRef.current.findIndex(
        (q) => progressQuestionId(q._id) === targetId
      );
      if (existingIdx >= 0) {
        goToLoaded(existingIdx);
        return;
      }

      setLoadingQ(true);
      try {
        const nearby = difficultyIdList.slice(Math.max(0, globalIdx - 1), globalIdx + 3);
        const { questions: bodies } = await fetchChapterQuestionBodies(nearby);
        if (!bodies?.length) {
          toast.error('Could not load that question');
          return;
        }
        const order = new Map(difficultyIdList.map((id, i) => [id, i]));
        setQuestions((prev) => {
          const byId = new Map(prev.map((q) => [progressQuestionId(q._id), q]));
          for (const q of bodies) byId.set(progressQuestionId(q._id), q);
          const merged = [...byId.values()].sort(
            (a, b) =>
              (order.get(progressQuestionId(a._id)) ?? 0) -
              (order.get(progressQuestionId(b._id)) ?? 0)
          );
          const newIdx = merged.findIndex((q) => progressQuestionId(q._id) === targetId);
          if (newIdx >= 0) {
            setAnimKey((k) => k + 1);
            setCurrentIdx(newIdx);
          }
          return merged;
        });
      } catch {
        toast.error('Failed to load question');
      } finally {
        setLoadingQ(false);
      }
      return;
    }

    goToLoaded(globalIdx);
  }, [difficultyIdList, goToLoaded]);

  const goToFiltered = useCallback((filteredPos) => {
    const raw = filteredIndices[filteredPos];
    if (raw == null) return;
    goToLoaded(raw);
  }, [filteredIndices, goToLoaded]);

  const goNext = useCallback(() => {
    if (filteredIndices.length) {
      const pos = filteredIndices.indexOf(currentIdx);
      if (pos >= 0 && pos < filteredIndices.length - 1) {
        goToLoaded(filteredIndices[pos + 1]);
        return;
      }
      if (pos === filteredIndices.length - 1 && hasMore && listFilter === 'all') {
        goToLoaded(currentIdx + 1);
      }
      return;
    }
    goToLoaded(currentIdx + 1);
  }, [filteredIndices, currentIdx, goToLoaded, hasMore, listFilter]);

  const goPrev = useCallback(() => {
    if (filteredIndices.length) {
      const pos = filteredIndices.indexOf(currentIdx);
      if (pos > 0) goToLoaded(filteredIndices[pos - 1]);
      return;
    }
    goToLoaded(currentIdx - 1);
  }, [filteredIndices, currentIdx, goToLoaded]);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (!category || !normalizedChapter) return;
    if (
      hydratedInitialRef.current &&
      initialData?.difficulty === activeDifficulty
    ) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
      try {
        await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions, initialData?.difficulty]);

  useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
  useEffect(() => {
    if (!user?.id || !questions.length) return;
    fetchUserProgress();
  }, [user, questions, fetchUserProgress]);
  useEffect(() => { refreshUnsaved(); }, [user?.id, refreshUnsaved]);

  useEffect(() => {
    if (!user?.id || !unsaved || hasShownToastRef.current) return;
    hasShownToastRef.current = true;
    toast('You have unsaved answers — save before leaving.', { duration: 3500, icon: '⚠️' });
  }, [user?.id, unsaved]);

  useEffect(() => {
    if (!unsaved) return;
    const warn = 'You have unsaved progress. Leave anyway?';
    const h = (e) => {
      e.preventDefault();
      e.returnValue = warn;
      return warn;
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [unsaved]);

  const extractStem = useCallback((content) => {
    if (!content) return null;
    let t = String(content).trim().replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
    t = t.replace(/^["'\s]*Question\s*:\s*/i, '').trim();
    const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(t);
    if (stop?.index > 0) t = t.slice(0, stop.index).trim();
    t = (t.split(/\n\s*\n/)[0] ?? t).trim();
    return t.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() || null;
  }, []);

  const rewriteQuestion = useCallback(async (question) => {
    if (!isAdmin || !question?._id || rewritingId) return;
    setRewritingId(question._id);
    try {
      await toastPromise(
        async () => {
          const stem = String(question.question ?? '').replace(/<\/?[^>]+(>|$)/g, ' ').trim();
          if (!stem) throw new Error('empty');
          const resp = await fetch('/api/generate-similar', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'rewrite-question', question: stem, maxTokens: 160 }),
          });
          if (!resp.ok) throw new Error(await resp.text());
          const rewritten = extractStem((await parseJsonResponse(resp))?.content);
          if (!rewritten) throw new Error('empty result');
          const { error } = await supabase
            .from('examtracker')
            .update({ question: rewritten })
            .eq('_id', question._id);
          if (error) throw error;
          setQuestions((prev) =>
            prev.map((q) => (q?._id === question._id ? { ...q, question: rewritten } : q))
          );
          return 'Rewritten!';
        },
        {
          loading: 'Rewriting…',
          success: (msg) => msg,
          error: () => 'Failed to rewrite',
        }
      );
    } catch {
      /* toast handles */
    } finally {
      setRewritingId(null);
    }
  }, [extractStem, isAdmin, rewritingId]);

  const saveQuestionEdit = useCallback(async () => {
    if (!editingQuestion?._id) return;

    const linked = getLinkedQuestionSet(editingQuestion);
    if (linked) {
      const letters = resolveLinkedCorrectOptions(editingQuestion, linked);
      if (!linkedCorrectKeysComplete(letters, linked.subQuestions.length)) {
        toast.error(
          `Linked set needs all correct letters, e.g. A${LINKED_CORRECT_SEP}D`
        );
        return;
      }
    }

    setSavingEdit(true);
    try {
      const { error } = await supabase.from('examtracker').upsert({
        _id: editingQuestion._id,
        question: editingQuestion.question,
        options_A: editingQuestion.options_A,
        options_B: editingQuestion.options_B,
        options_C: editingQuestion.options_C,
        options_D: editingQuestion.options_D,
        correct_option: editingQuestion.correct_option,
        solution: editingQuestion.solution ?? null,
        solutiontext: editingQuestion.solutiontext ?? null,
        difficulty: editingQuestion.difficulty,
      });
      if (error) throw error;
      setQuestions((prev) =>
        prev.map((q) => (q?._id === editingQuestion._id ? { ...q, ...editingQuestion } : q))
      );
      toast.success('Question updated successfully');
      setEditingQuestion(null);
    } catch {
      toast.error('Failed to update question');
    } finally {
      setSavingEdit(false);
    }
  }, [editingQuestion]);

  const stats = useMemo(() => {
    const total = counts[activeDifficulty] ?? difficultyQuestionIds.size ?? 0;
    const idSet = difficultyQuestionIds.size
      ? difficultyQuestionIds
      : new Set((questions ?? []).map((q) => progressQuestionId(q._id)).filter(Boolean));

    let comp = 0;
    let corr = 0;
    for (const id of idSet) {
      if (compSet.has(id)) {
        comp += 1;
        if (corrSet.has(id)) corr += 1;
      }
    }
    const wrong = Math.max(0, comp - corr);
    const pending = Math.max(0, total - comp);
    return {
      comp,
      corr,
      wrong,
      pending,
      total,
      pct: total ? Math.round((comp / total) * 100) : 0,
      acc: comp ? Math.round((corr / comp) * 100) : 0,
      pts: progress.points + (bufferOverlay.ptsDelta || 0),
      completedInDifficulty: countCompletedInSet(idSet, compSet),
    };
  }, [
    questions,
    progress,
    counts,
    activeDifficulty,
    compSet,
    corrSet,
    bufferOverlay.ptsDelta,
    difficultyQuestionIds,
  ]);

  const chapterTitle = useMemo(() => formatSlugTitle(normalizedChapter), [normalizedChapter]);
  const subjectTitle = useMemo(() => formatSlugTitle(subject), [subject]);

  const nVisible = filteredQuestions.length;
  const nLoaded = questions.length;

  const firstPendingIdx = useMemo(() => {
    for (const i of filteredIndices.length ? filteredIndices : questions.map((_, idx) => idx)) {
      if (!compSet.has(progressQuestionId(questions[i]._id))) return i;
    }
    return -1;
  }, [questions, filteredIndices, compSet]);

  const firstPendingGlobalIdx = useMemo(() => {
    if (!difficultyIdList.length) {
      return firstPendingIdx;
    }
    for (let i = 0; i < difficultyIdList.length; i++) {
      if (!compSet.has(difficultyIdList[i])) return i;
    }
    return -1;
  }, [difficultyIdList, compSet, firstPendingIdx]);

  const chapterHref = `/${category}/${subject}/${chaptername}`;
  const subjectHref = `/${category}/${subject}`;

  const toggleFlag = useCallback((questionId) => {
    const next = toggleChapterFlag(user?.id, category, normalizedChapter, questionId);
    setFlagSet(new Set(next));
  }, [user?.id, category, normalizedChapter]);

  const startExam = useCallback(() => {
    const pool = listFilter === 'all' ? questions : filteredQuestions;
    const n = Math.max(1, pool.length || counts[activeDifficulty] || 1);
    const ms = n * EXAM_MINUTES_PER_QUESTION * 60 * 1000;
    setSessionMode('exam');
    setExamEndsAt(Date.now() + ms);
    setExamSummary(null);
    setExamSolutionsUnlocked(false);
    toast.success(`Exam started — ${n * EXAM_MINUTES_PER_QUESTION} minutes`, { duration: 2500 });
  }, [listFilter, questions, filteredQuestions, counts, activeDifficulty]);

  const endExam = useCallback(() => {
    const pool = listFilter === 'all' ? questions : filteredQuestions;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    for (const q of pool) {
      const qid = progressQuestionId(q._id);
      if (!compSet.has(qid)) skipped += 1;
      else if (corrSet.has(qid)) correct += 1;
      else wrong += 1;
    }
    setExamSummary({ correct, wrong, skipped, total: pool.length });
    setExamSolutionsUnlocked(true);
    setSessionMode('practice');
    setExamEndsAt(null);
    toast.success('Exam ended — solutions unlocked', { duration: 3000 });
  }, [listFilter, questions, filteredQuestions, compSet, corrSet]);

  useEffect(() => {
    if (sessionMode !== 'exam' || !examEndsAt) return;
    if (examNow >= examEndsAt) endExam();
  }, [sessionMode, examEndsAt, examNow, endExam]);

  const examRemainingMs = sessionMode === 'exam' && examEndsAt
    ? Math.max(0, examEndsAt - examNow)
    : 0;

  const canGoPrev = filteredIndices.length
    ? filteredIndices.indexOf(currentIdx) > 0
    : currentIdx > 0;
  const canGoNext = filteredIndices.length
    ? filteredIndices.indexOf(currentIdx) < filteredIndices.length - 1 ||
      (listFilter === 'all' && (currentIdx < questions.length - 1 || hasMore))
    : currentIdx < questions.length - 1 || hasMore;

  return {
    category,
    subject,
    chaptername,
    subjectTitle,
    chapterTitle,
    chapterHref,
    subjectHref,
    matchedChapter,
    difficultyIdList,
    filteredGlobalIndices,
    user,
    isAdmin,
    loading,
    loadingQ,
    questions: filteredQuestions,
    allQuestions: questions,
    filteredIndices,
    counts,
    totalQ,
    activeDifficulty,
    changeDifficulty,
    currentIdx: displayIdx,
    rawCurrentIdx: currentIdx,
    animKey,
    curQ,
    nVisible,
    nLoaded,
    hasMore,
    stats,
    compSet,
    corrSet,
    unsaved,
    saving,
    saveBtnKey,
    saveProgress,
    sheetOpen,
    setSheetOpen,
    goTo: goToFiltered,
    goToRaw,
    goNext,
    goPrev,
    canGoPrev,
    canGoNext,
    handleAnswer,
    canAttemptPractice,
    setShowPaywall,
    setShowAuthModal,
    editingQuestion,
    setEditingQuestion,
    savingEdit,
    saveQuestionEdit,
    rewritingId,
    rewriteQuestion,
    firstPendingIdx,
    firstPendingGlobalIdx,
    listFilter,
    setListFilter,
    sessionMode,
    startExam,
    endExam,
    examEndsAt,
    examRemainingMs,
    examSummary,
    setExamSummary,
    examSolutionsUnlocked,
    flagSet,
    toggleFlag,
    requireAuthToAttempt: !user,
  };
}
