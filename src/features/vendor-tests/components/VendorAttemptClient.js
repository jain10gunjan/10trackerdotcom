'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Clock,
  Send,
  Save,
  SkipForward,
} from 'lucide-react';
import MathHtmlRenderer, {
  McqMathProvider,
} from '@/features/admin/components/mcq-creation/MathHtmlRenderer';

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function getAnswer(answers, qid) {
  const raw = answers?.[qid];
  if (raw == null) return '';
  if (typeof raw === 'object') return raw.answer ?? '';
  return String(raw);
}

export default function VendorAttemptClient({ slug, attemptId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [warnBlur, setWarnBlur] = useState(0);

  const saveTimer = useRef(null);
  const dirty = useRef(false);
  const submitting = useRef(false);
  const answersRef = useRef(answers);
  const markedRef = useRef(marked);
  const indexRef = useRef(index);
  const questionTopRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    markedRef.current = marked;
  }, [marked]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/attempts/${attemptId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load attempt');
      }
      if (data.attempt?.status && data.attempt.status !== 'in_progress') {
        router.replace(`/practice-tests/${slug}/results/${attemptId}`);
        return;
      }
      setTest(data.test);
      setAttempt(data.attempt);
      setQuestions(data.questions || []);
      setAnswers(data.attempt?.answers || {});
      setMarked(data.attempt?.markedForReview || []);
      setIndex(
        Math.min(
          data.attempt?.currentQuestionIndex || 0,
          Math.max(0, (data.questions || []).length - 1)
        )
      );

      const durationSec = (data.test?.durationMinutes || 60) * 60;
      const started = data.attempt?.startedAt
        ? new Date(data.attempt.startedAt).getTime()
        : Date.now();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setRemaining(Math.max(0, durationSec - elapsed));
      setLastSaved(data.attempt?.lastSavedAt || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, attemptId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (opts = {}) => {
      if (submitting.current) return;
      try {
        const res = await fetch(`/api/practice-tests/${slug}/attempts/${attemptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersRef.current,
            markedForReview: markedRef.current,
            currentQuestionIndex: indexRef.current,
            merge: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (res.status === 403 || res.status === 409) {
            setSaveError(data.error || 'Save blocked');
            if (data.status && data.status !== 'in_progress') {
              router.replace(`/practice-tests/${slug}/results/${attemptId}`);
            }
            return;
          }
          throw new Error(data.error || 'Autosave failed');
        }
        dirty.current = false;
        setLastSaved(data.lastSavedAt);
        setSaveError(null);
        if (opts.toast) toast.success('Saved');
      } catch (err) {
        setSaveError(err.message);
        if (opts.toast) toast.error(err.message);
      }
    },
    [slug, attemptId, router]
  );

  const scheduleSave = useCallback(() => {
    dirty.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // 5s debounce — cuts write load under concurrent attempts
    saveTimer.current = setTimeout(() => persist(), 5000);
  }, [persist]);

  const setAnswer = (qid, value) => {
    setAnswers((prev) => {
      const next = { ...prev };
      const trimmed = String(value ?? '').trim();
      if (!trimmed) {
        delete next[qid];
      } else {
        next[qid] = {
          answer: trimmed,
          timeTaken: prev[qid]?.timeTaken || 0,
        };
      }
      return next;
    });
    scheduleSave();
  };

  const toggleMark = (qid) => {
    setMarked((prev) => {
      const set = new Set(prev.map(String));
      if (set.has(qid)) set.delete(qid);
      else set.add(qid);
      return [...set];
    });
    scheduleSave();
  };

  const goTo = (i) => {
    const next = Math.max(0, Math.min(questions.length - 1, i));
    setIndex(next);
    scheduleSave();
    requestAnimationFrame(() => {
      questionTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const submit = useCallback(
    async ({ auto = false } = {}) => {
      if (submitting.current) return;
      if (!auto) {
        const ok = window.confirm(
          'Submit this attempt? You cannot change answers after submit.'
        );
        if (!ok) return;
      }
      submitting.current = true;
      setBusy(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      try {
        await persist();
        const res = await fetch(
          `/api/practice-tests/${slug}/attempts/${attemptId}/submit`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              answers: answersRef.current,
              markedForReview: markedRef.current,
              auto,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Submit failed');
        }
        toast.success(auto ? 'Time up — auto-submitted' : 'Submitted');
        router.replace(`/practice-tests/${slug}/results/${attemptId}`);
      } catch (err) {
        toast.error(err.message);
        submitting.current = false;
      } finally {
        setBusy(false);
      }
    },
    [persist, slug, attemptId, router]
  );

  const saveAndNext = () => {
    if (index >= questions.length - 1) {
      submit({ auto: false });
      return;
    }
    goTo(index + 1);
  };

  // Timer countdown + auto-submit
  useEffect(() => {
    if (loading || !attempt) return undefined;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, attempt]);

  useEffect(() => {
    if (loading || remaining > 0 || !attempt || submitting.current) return;
    submit({ auto: true });
  }, [remaining, loading, attempt, submit]);

  // Anti-cheat
  useEffect(() => {
    if (!test?.antiCheatEnabled || loading) return undefined;

    const logEvent = (type, meta) => {
      fetch(`/api/practice-tests/${slug}/attempts/${attemptId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, meta }),
      }).catch(() => {});
    };

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        logEvent('visibility_hidden');
        setWarnBlur((n) => n + 1);
      } else {
        logEvent('visibility_visible');
      }
    };
    const onBlur = () => {
      logEvent('window_blur');
      setWarnBlur((n) => n + 1);
    };
    const block = (e) => {
      e.preventDefault();
      logEvent('blocked_action', { kind: e.type });
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('contextmenu', block);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('contextmenu', block);
    };
  }, [test?.antiCheatEnabled, loading, slug, attemptId]);

  // Flush on unload
  useEffect(() => {
    const flush = () => {
      if (!dirty.current || submitting.current) return;
      const body = JSON.stringify({
        answers: answersRef.current,
        markedForReview: markedRef.current,
        currentQuestionIndex: indexRef.current,
        merge: true,
      });
      fetch(`/api/practice-tests/${slug}/attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [slug, attemptId]);

  // Keyboard: Left/Right
  useEffect(() => {
    if (loading) return undefined;
    const onKey = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (indexRef.current > 0) goTo(indexRef.current - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (indexRef.current < questions.length - 1) goTo(indexRef.current + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
      </div>
    );
  }

  if (!questions.length || !test) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-rose-700">
        Could not load this attempt.
      </div>
    );
  }

  const q = questions[index];
  const qid = q._id;
  const currentAnswer = getAnswer(answers, qid);
  const isMarked = marked.map(String).includes(String(qid));
  const answeredCount = questions.filter((qq) => getAnswer(answers, qq._id)).length;
  const lowTime = remaining < 60;
  const isLast = index >= questions.length - 1;
  const hasAnswer = Boolean(String(currentAnswer || '').trim());

  return (
    <McqMathProvider>
      <div className="fixed inset-0 z-40 flex select-none flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-neutral-100 to-neutral-100">
        <header className="shrink-0 border-b border-neutral-200/90 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-neutral-900">
                {test.title}
              </p>
              <p className="text-xs text-neutral-500">
                Q{index + 1} / {questions.length} · answered {answeredCount}
                {lastSaved
                  ? ` · saved ${new Date(lastSaved).toLocaleTimeString()}`
                  : ''}
                {saveError ? ` · save error: ${saveError}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-sm font-semibold tabular-nums ${
                  lowTime
                    ? 'border border-rose-200 bg-rose-50 text-rose-800'
                    : 'border border-neutral-200 bg-neutral-50 text-neutral-800'
                }`}
              >
                <Clock className="h-4 w-4" />
                {formatMmSs(remaining)}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => submit({ auto: false })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit
              </button>
            </div>
          </div>
          {warnBlur > 0 && test.antiCheatEnabled ? (
            <p className="border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
              Focus left the test window {warnBlur} time(s). This is logged.
            </p>
          ) : null}
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 gap-4 overflow-hidden px-4 py-4 lg:gap-6">
          <main className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div ref={questionTopRef} />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Question {index + 1} · {q.marks} mark{q.marks === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => toggleMark(qid)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                  isMarked
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                {isMarked ? 'Marked' : 'Mark for review'}
              </button>
            </div>

            {q.directionhtml ? (
              <div className="mb-4 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700">
                <MathHtmlRenderer html={q.directionhtml} />
              </div>
            ) : null}

            {q.questionimage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.questionimage}
                alt=""
                className="mb-4 max-h-64 rounded-lg object-contain"
              />
            ) : null}

            <div className="prose prose-sm max-w-none text-neutral-900">
              <MathHtmlRenderer html={q.question || ''} />
            </div>

            <div className="mt-6 space-y-2">
              {q.answerMode === 'inline' ? (
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentAnswer}
                  onChange={(e) => setAnswer(qid, e.target.value)}
                  placeholder="Enter your answer"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              ) : (
                (q.options || []).map((opt) => {
                  const selected = currentAnswer === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      onClick={() => setAnswer(qid, opt.letter)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-200'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          selected
                            ? 'bg-teal-700 text-white'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {opt.letter}
                      </span>
                      <MathHtmlRenderer html={opt.html} className="flex-1" />
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {hasAnswer ? (
                  <button
                    type="button"
                    onClick={() => setAnswer(qid, '')}
                    className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-semibold text-neutral-600 shadow-sm hover:bg-neutral-50"
                  >
                    Clear
                  </button>
                ) : null}

                {!isLast ? (
                  <button
                    type="button"
                    onClick={() => goTo(index + 1)}
                    className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
                  >
                    <SkipForward className="h-4 w-4" /> Skip
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={busy || (!hasAnswer && !isLast)}
                  onClick={saveAndNext}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isLast ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isLast ? 'Save & Finish' : 'Save & Next'}
                  {!isLast ? <ChevronRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </main>

          <aside className="hidden w-56 shrink-0 overflow-y-auto rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:block lg:w-60">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Palette
            </p>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((qq, i) => {
                const answered = !!getAnswer(answers, qq._id);
                const flagged = marked.map(String).includes(String(qq._id));
                const active = i === index;
                return (
                  <button
                    key={qq._id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`relative h-9 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-neutral-900 text-white ring-2 ring-teal-300/80'
                        : answered
                          ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200/80'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                    }`}
                  >
                    {i + 1}
                    {flagged ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <ul className="mt-4 space-y-1 text-[11px] text-neutral-500">
              <li>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-emerald-100" />{' '}
                Answered
              </li>
              <li>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-neutral-100" />{' '}
                Not answered
              </li>
              <li>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />{' '}
                Marked
              </li>
            </ul>
          </aside>
        </div>

        {/* Mobile palette strip */}
        <div className="shrink-0 border-t border-neutral-200 bg-white px-3 py-2 sm:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {questions.map((qq, i) => {
              const answered = !!getAnswer(answers, qq._id);
              const active = i === index;
              return (
                <button
                  key={qq._id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-9 w-9 shrink-0 rounded-lg text-xs font-semibold ${
                    active
                      ? 'bg-teal-700 text-white'
                      : answered
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </McqMathProvider>
  );
}
