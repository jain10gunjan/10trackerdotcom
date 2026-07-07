'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { applyProgressUserFilter } from '@/lib/progressIdentity';
import { useAuth } from '@/app/context/AuthContext';
import { usePracticeCreditGate } from '@/lib/credits/usePracticeCreditGate';
import { useCredits } from '@/context/CreditsContext';
import { showPracticeAnswerToast } from '@/lib/credits/practiceAnswerToast';
import { applyPracticeProgressUpdate } from '@/lib/credits/recordPracticeProgress';
import { upsertUserProgress } from '@/lib/userProgressUpsert';
import {
  readProgressBuffer,
  saveProgressBufferToSupabase,
} from '@/lib/progressBuffer';
import toast from 'react-hot-toast';
import { toastPromise, parseJsonResponse } from '@/lib/toastAsync';
import {
  QUESTIONS_PER_PAGE,
  DIFFICULTIES,
  DIFFICULTY_STORAGE_KEY,
  parseDifficultyParam,
  normalizeChapterName,
  chapterNamesMatch,
  progressQuestionId,
  getChapterCandidates,
  formatSlugTitle,
} from '@/lib/practice/chapterPracticeUtils';
import { fetchChapterCounts, fetchChapterQuestions } from '@/lib/practice/fetchChapterPractice';
import {
  shouldOfferAdvance,
  promptDifficultyAdvance,
} from '@/lib/practice/difficultyAdvance';
import { buildEffectiveCompletedSet } from '@/lib/practice/practiceCompletedSet';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAILS;

export function useChapterPractice() {
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
    () => parseDifficultyParam(searchParams) ?? 'easy',
    [searchParams]
  );

  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [totalQ, setTotalQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingQ, setLoadingQ] = useState(false);
  const [progress, setProgress] = useState({ completed: [], correct: [], points: 0 });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [difficultyQuestionIds, setDifficultyQuestionIds] = useState(() => new Set());

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
  const [hasMore, setHasMore] = useState(true);
  const [rewritingId, setRewritingId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unsaved, setUnsaved] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveBtnKey, setSaveBtnKey] = useState(0);

  useEffect(() => { questionsRef.current = questions; }, [questions]);

  const fetchCounts = useCallback(async () => {
    if (!category || !normalizedChapter) return;
    try {
      const d = await fetchChapterCounts(category, normalizedChapter);
      setCounts({ easy: d.easy, medium: d.medium, hard: d.hard });
      setTotalQ(d.total);
    } catch {
      setCounts({ easy: 0, medium: 0, hard: 0 });
      setTotalQ(0);
    }
  }, [category, normalizedChapter]);

  const fetchDifficultyQuestionIds = useCallback(async (difficulty) => {
    if (!category || !normalizedChapter || !difficulty) return;
    try {
      const candidates = getChapterCandidates(normalizedChapter);
      const { data, error } = await supabase
        .from('examtracker')
        .select('_id')
        .eq('category', String(category).toUpperCase())
        .in('chapter', candidates)
        .eq('difficulty', difficulty);
      if (error) throw error;
      const ids = new Set((data ?? []).map((q) => progressQuestionId(q._id)).filter(Boolean));
      setDifficultyQuestionIds(ids);
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
    const ch = normalizedChapterRef.current;
    if (!uid || !ch || !cat) {
      setProgress({ completed: [], correct: [], points: 0 });
      return;
    }
    try {
      const cands = getChapterCandidates(ch);
      const { data: rows, error: re } = await supabase
        .from('examtracker')
        .select('topic, chapter')
        .eq('category', cat.toUpperCase())
        .in('chapter', cands);
      if (re) throw re;

      const topicSet = new Set();
      const norm = normalizeChapterName(ch);
      for (const row of rows ?? []) {
        if (row?.topic && chapterNamesMatch(row.chapter, norm)) {
          topicSet.add(String(row.topic).trim());
        }
      }
      for (const q of questionsRef.current ?? []) {
        if (q?.topic) topicSet.add(String(q.topic).trim());
      }

      const topics = [...topicSet];
      if (!topics.length) {
        setProgress({ completed: [], correct: [], points: 0 });
        return;
      }

      const area = cat.toLowerCase();
      let progressQuery = supabase
        .from('user_progress')
        .select('completedquestions, correctanswers, points, topic')
        .eq('area', area)
        .in('topic', topics);
      progressQuery = applyProgressUserFilter(progressQuery, userRef.current);
      const { data: pd, error: pe } = await progressQuery;
      if (pe && pe.code !== 'PGRST116') throw pe;

      const comp = new Set();
      const corr = new Set();
      let pts = 0;
      for (const item of pd ?? []) {
        (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach((id) => {
          const s = progressQuestionId(id);
          if (s) comp.add(s);
        });
        (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach((id) => {
          const s = progressQuestionId(id);
          if (s) corr.add(s);
        });
        pts += typeof item.points === 'number' ? item.points : 0;
      }
      setProgress({ completed: [...comp], correct: [...corr], points: pts });
    } catch {
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
    const uid = currentUser.id;
    if (isSavingRef.current) return;
    try {
      const buf = readProgressBuffer(uid);
      if (!Object.keys(buf.entries ?? {}).length) {
        setUnsaved(0);
        return;
      }
      isSavingRef.current = true;
      setSaving(true);
      await saveProgressBufferToSupabase({
        supabase,
        upsertUserProgress,
        user: currentUser,
        onMissingTopic: () => {},
      });
      await fetchUserProgress();
      setUnsaved(0);
      setSaveBtnKey((k) => k + 1);
      toast.success('Progress saved!', { duration: 2200 });
    } catch {
      refreshUnsaved();
      toast.error('Save failed. Try again.');
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [fetchUserProgress, refreshUnsaved, setShowAuthModal]);

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
    if (creditCharge.skipped) return;

    const completedSet = buildEffectiveCompletedSet({
      savedCompleted: progressRef.current.completed,
      userId: userRef.current.id,
      area,
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
          celebrateFn: (msg) => toast.success(msg, { duration: 3500, icon: '🎉' }),
        });
      }, 400);
    }
  }, [setShowAuthModal, chargeForQuestion]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !category || !normalizedChapter) return;
    if (parseDifficultyParam(searchParams)) return;
    try {
      const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
      if (saved && DIFFICULTIES.includes(saved) && saved !== 'easy') {
        const p = new URLSearchParams(searchParams.toString());
        p.set('difficulty', saved);
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
      }
    } catch {
      /* ignore */
    }
  }, [category, normalizedChapter, pathname, router, searchParams]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty);
    } catch {
      /* ignore */
    }
  }, [activeDifficulty]);

  const changeDifficulty = useCallback((d) => {
    if (d === activeDifficulty || loadingQ) return;
    setCurrentPage(1);
    setHasMore(true);
    setCurrentIdx(0);
    const p = new URLSearchParams(searchParams.toString());
    p.set('difficulty', d);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [activeDifficulty, loadingQ, router, searchParams, pathname]);

  useEffect(() => {
    changeDifficultyRef.current = changeDifficulty;
  }, [changeDifficulty]);

  useEffect(() => {
    if (!category || !normalizedChapter || !activeDifficulty) return;
    fetchDifficultyQuestionIds(activeDifficulty);
  }, [category, normalizedChapter, activeDifficulty, fetchDifficultyQuestionIds]);

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= questions.length) return;
    setAnimKey((k) => k + 1);
    setCurrentIdx(idx);
    if (idx >= questions.length - 3 && hasMore && !loadingQ) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchQuestions(activeDifficulty, next, true);
    }
  }, [questions.length, hasMore, loadingQ, currentPage, activeDifficulty, fetchQuestions]);

  const goNext = useCallback(() => goTo(currentIdx + 1), [currentIdx, goTo]);
  const goPrev = useCallback(() => goTo(currentIdx - 1), [currentIdx, goTo]);

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
  }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

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
    const visible = new Set(
      (questions ?? []).map((q) => progressQuestionId(q?._id)).filter(Boolean)
    );
    if (!visible.size) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const area = String(category ?? '').toLowerCase();
    const { entries } = readProgressBuffer(uid) ?? { entries: {} };
    const comp = new Set();
    const corr = new Set();
    let ptsDelta = 0;
    for (const [id, e] of Object.entries(entries ?? {})) {
      const qid = progressQuestionId(id);
      if (!qid || !visible.has(qid) || String(e?.area ?? '') !== area) continue;
      comp.add(qid);
      if (e?.correct === true) {
        corr.add(qid);
        if (!savedComp.has(qid)) {
          ptsDelta += typeof e.points === 'number' ? e.points : 100;
        }
      }
    }
    return { comp, corr, ptsDelta };
  }, [user?.id, category, questions, unsaved, savedComp]);

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

  const stats = useMemo(() => {
    const comp = questions.filter((q) => compSet.has(progressQuestionId(q._id))).length;
    const corr = questions.filter((q) => corrSet.has(progressQuestionId(q._id))).length;
    const wrong = comp - corr;
    const pending = questions.length - comp;
    const total = counts[activeDifficulty] ?? 0;
    return {
      comp,
      corr,
      wrong,
      pending,
      total,
      pct: total ? Math.round((comp / total) * 100) : 0,
      acc: comp ? Math.round((corr / comp) * 100) : 0,
      pts: progress.points + (bufferOverlay.ptsDelta || 0),
    };
  }, [questions, progress, counts, activeDifficulty, compSet, corrSet, bufferOverlay.ptsDelta]);

  const chapterTitle = useMemo(() => formatSlugTitle(normalizedChapter), [normalizedChapter]);
  const subjectTitle = useMemo(() => formatSlugTitle(subject), [subject]);

  const curQ = questions[currentIdx];
  const nVisible = questions.length;

  const firstPendingIdx = useMemo(
    () => questions.findIndex((q) => !compSet.has(progressQuestionId(q._id))),
    [questions, compSet]
  );

  const chapterHref = `/${category}/${subject}/${chaptername}`;
  const subjectHref = `/${category}/${subject}`;

  return {
    category,
    subject,
    chaptername,
    subjectTitle,
    chapterTitle,
    chapterHref,
    subjectHref,
    user,
    isAdmin,
    loading,
    loadingQ,
    questions,
    counts,
    totalQ,
    activeDifficulty,
    changeDifficulty,
    currentIdx,
    animKey,
    curQ,
    nVisible,
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
    goTo,
    goNext,
    goPrev,
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
  };
}
