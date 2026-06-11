'use client';

import dynamic from 'next/dynamic';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Award,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Circle,
} from 'lucide-react';
import ExamSubpageHeader from '@/components/examHub/ExamSubpageHeader';
import { useChapterPractice } from '@/hooks/useChapterPractice';
import { mathJaxConfig, progressQuestionId } from '@/lib/practice/chapterPracticeUtils';
import ChapterPracticeSkeleton, { QuestionCardSkeleton } from './ChapterPracticeSkeleton';
import ProgressRing from './ProgressRing';
import DifficultyTabs from './DifficultyTabs';
import ChapterQuestionMap from './ChapterQuestionMap';
import ChapterNavSheet from './ChapterNavSheet';
import ChapterAdminEditModal from './ChapterAdminEditModal';

const QuestionCard = dynamic(() => import('@/components/QuestionCard'), {
  ssr: false,
  loading: () => <QuestionCardSkeleton />,
});

function StatPill({ icon: Icon, label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    err: 'bg-rose-50 text-rose-800 border-rose-200',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${tones[tone]}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="text-neutral-500 font-medium">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function ChapterPracticeApp() {
  const p = useChapterPractice();

  if (p.loading) {
    return <ChapterPracticeSkeleton />;
  }

  const progressWidth = p.nVisible ? ((p.currentIdx + 1) / p.nVisible) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-28 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ExamSubpageHeader
          title={`${p.chapterTitle} — Practice`}
          description={`${p.subjectTitle} · ${p.activeDifficulty} · ${p.stats.total} questions in this level`}
          backHref={p.chapterHref}
          backLabel="Back to chapter"
        >
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-800">
              <Award className="w-3.5 h-3.5" />
              {p.stats.pts} pts
            </span>
            <span className="text-xs text-neutral-500 font-medium tabular-nums">
              Q{p.currentIdx + 1} of {p.nVisible}
              {p.hasMore ? '+' : ''}
            </span>
          </div>
        </ExamSubpageHeader>

        {/* Sticky practice toolbar */}
        <div className="sticky top-20 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-neutral-50/90 backdrop-blur-md border-b border-neutral-200/80 mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 min-w-0 flex-1">
              <span className="shrink-0 px-2 py-1 rounded-lg bg-white border border-neutral-200 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                {p.category}
              </span>
              <span className="truncate text-sm font-semibold text-neutral-800">{p.chapterTitle}</span>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:flex-none sm:min-w-[140px]">
              <span className="text-xs font-bold text-neutral-800 tabular-nums shrink-0">
                {p.currentIdx + 1}
                <span className="text-neutral-400 font-medium">/{p.nVisible}</span>
              </span>
              <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold tabular-nums">
              <Award className="w-3.5 h-3.5 opacity-90" />
              {p.stats.pts}
            </div>

            {p.user ? (
              <button
                key={p.saveBtnKey}
                type="button"
                onClick={p.saveProgress}
                disabled={!p.unsaved || p.saving}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0
                  ${p.unsaved
                    ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800'
                    : 'bg-white text-neutral-500 border-neutral-200'}
                  disabled:opacity-60
                `}
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{p.saving ? 'Saving…' : 'Save'}</span>
                {p.unsaved > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {p.unsaved}
                  </span>
                ) : null}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => p.setShowAuthModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white shrink-0"
              >
                Sign in
              </button>
            )}
          </div>

          <div className="mt-2 h-0.5 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-emerald-400/80 transition-all duration-500"
              style={{ width: `${p.stats.pct}%` }}
            />
          </div>

          <div className="mt-3 lg:hidden">
            <DifficultyTabs
              active={p.activeDifficulty}
              counts={p.counts}
              loading={p.loadingQ}
              onChange={p.changeDifficulty}
              compact
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-44">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Chapter</p>
              <h2 className="text-lg font-bold text-neutral-900 leading-snug">{p.chapterTitle}</h2>
              <p className="text-xs text-neutral-500 mt-1 font-medium">{p.subjectTitle}</p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Your progress</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                  <ProgressRing pct={p.stats.pct} size={54} stroke={5} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-neutral-800">
                    {p.stats.pct}%
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-900 tabular-nums">
                    {p.stats.comp}
                    <span className="text-sm text-neutral-400 font-medium">/{p.stats.total}</span>
                  </p>
                  <p className="text-xs text-neutral-500">{p.stats.acc}% accuracy</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 py-2">
                  <p className="text-sm font-bold text-emerald-800 tabular-nums">{p.stats.corr}</p>
                  <p className="text-[10px] font-semibold text-emerald-600">Correct</p>
                </div>
                <div className="rounded-2xl bg-rose-50 border border-rose-100 py-2">
                  <p className="text-sm font-bold text-rose-800 tabular-nums">{p.stats.wrong}</p>
                  <p className="text-[10px] font-semibold text-rose-600">Wrong</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 border border-neutral-200 py-2">
                  <p className="text-sm font-bold text-neutral-800 tabular-nums">{p.stats.pending}</p>
                  <p className="text-[10px] font-semibold text-neutral-500">Left</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Difficulty</p>
              <DifficultyTabs
                active={p.activeDifficulty}
                counts={p.counts}
                loading={p.loadingQ}
                onChange={p.changeDifficulty}
              />
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Question map</p>
                {p.firstPendingIdx >= 0 ? (
                  <button
                    type="button"
                    onClick={() => p.goTo(p.firstPendingIdx)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Jump to Q{p.firstPendingIdx + 1}
                  </button>
                ) : null}
              </div>
              <ChapterQuestionMap
                questions={p.questions}
                currentIndex={p.currentIdx}
                completedSet={p.compSet}
                correctSet={p.corrSet}
                onSelect={p.goTo}
              />
            </div>
          </aside>

          {/* Main question panel */}
          <div className="min-w-0 space-y-4">
            {p.loadingQ && p.questions.length === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm min-h-[360px]">
                <QuestionCardSkeleton />
              </div>
            ) : p.questions.length === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">No questions available</h3>
                <p className="text-sm text-neutral-500">
                  No {p.activeDifficulty} questions found for this chapter.
                </p>
              </div>
            ) : p.curQ ? (
              <div
                key={p.animKey}
                className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
              >
                {p.isAdmin ? (
                  <div className="flex justify-end px-4 py-2 border-b border-neutral-100 bg-neutral-50">
                    <button
                      type="button"
                      onClick={() => p.rewriteQuestion(p.curQ)}
                      disabled={p.rewritingId === p.curQ._id}
                      className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-neutral-200"
                    >
                      {p.rewritingId === p.curQ._id ? 'Rewriting…' : 'Rewrite question'}
                    </button>
                  </div>
                ) : null}

                <div className="pq-question-host">
                  <MathJaxContext config={mathJaxConfig}>
                    <MathJax>
                      <QuestionCard
                        category={p.category}
                        question={p.curQ}
                        index={p.currentIdx}
                        onAnswer={(ok) => p.handleAnswer(p.curQ._id, ok, p.curQ.topic)}
                        isCompleted={p.compSet.has(progressQuestionId(p.curQ._id))}
                        isCorrect={p.corrSet.has(progressQuestionId(p.curQ._id))}
                        isAdmin={p.isAdmin}
                        embedded
                        creditsLocked={Boolean(p.user) && !p.canAttemptPractice}
                        onRequireCredits={() => p.setShowPaywall(true)}
                        onEdit={(q) => p.setEditingQuestion({ ...q })}
                      />
                    </MathJax>
                  </MathJaxContext>
                </div>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center justify-between gap-4 px-5 py-4 border-t border-neutral-100 bg-neutral-50/50">
                  <button
                    type="button"
                    onClick={p.goPrev}
                    disabled={p.currentIdx === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex gap-1.5 items-center">
                    {p.questions
                      .slice(Math.max(0, p.currentIdx - 3), p.currentIdx + 4)
                      .map((_, ii) => {
                        const ri = Math.max(0, p.currentIdx - 3) + ii;
                        const cur = ri === p.currentIdx;
                        return (
                          <div
                            key={ri}
                            className={`h-1.5 rounded-full transition-all ${
                              cur ? 'w-5 bg-emerald-500' : 'w-1.5 bg-neutral-300'
                            }`}
                          />
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={p.goNext}
                    disabled={p.currentIdx === p.questions.length - 1 && !p.hasMore}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
                  >
                    {p.loadingQ && p.currentIdx >= p.questions.length - 3 ? 'Loading…' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Mobile stats row */}
            <div className="flex flex-wrap gap-2 lg:hidden">
              <StatPill icon={CheckCircle2} label="Correct" value={p.stats.corr} tone="ok" />
              <StatPill icon={XCircle} label="Wrong" value={p.stats.wrong} tone="err" />
              <StatPill icon={Circle} label="Pending" value={p.stats.pending} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-2 px-3 py-2.5 max-w-6xl mx-auto">
          <button
            type="button"
            onClick={p.goPrev}
            disabled={p.currentIdx === 0}
            className="w-11 h-11 rounded-2xl border border-neutral-200 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-700" />
          </button>

          <button
            type="button"
            onClick={() => p.setSheetOpen(true)}
            className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-2xl border border-neutral-200 bg-neutral-50"
          >
            <div className="flex gap-1 items-center flex-1 overflow-hidden">
              {p.questions.slice(0, 10).map((q, i) => {
                const qid = progressQuestionId(q._id);
                const cur = i === p.currentIdx;
                const ok = p.corrSet.has(qid);
                const bad = p.compSet.has(qid) && !ok;
                return (
                  <div
                    key={q._id}
                    className={`h-1.5 rounded-full shrink-0 transition-all ${
                      cur ? 'w-4 bg-emerald-500' : ok ? 'w-1.5 bg-emerald-400' : bad ? 'w-1.5 bg-rose-400' : 'w-1.5 bg-neutral-300'
                    }`}
                  />
                );
              })}
              {p.questions.length > 10 ? (
                <span className="text-[10px] font-bold text-neutral-400 ml-0.5">+{p.questions.length - 10}</span>
              ) : null}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-neutral-900 tabular-nums leading-none">
                {p.currentIdx + 1}/{p.nVisible}
              </p>
              <p className="text-[10px] text-neutral-500">All Qs</p>
            </div>
            <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={p.goNext}
            disabled={p.currentIdx === p.questions.length - 1 && !p.hasMore}
            className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {p.sheetOpen ? (
        <ChapterNavSheet
          questions={p.questions}
          currentIndex={p.currentIdx}
          completedSet={p.compSet}
          correctSet={p.corrSet}
          onSelect={p.goTo}
          onClose={() => p.setSheetOpen(false)}
          hasMore={p.hasMore}
          stats={p.stats}
          user={p.user}
          unsaved={p.unsaved}
          saving={p.saving}
          onSave={p.saveProgress}
          onSignIn={() => p.setShowAuthModal(true)}
        />
      ) : null}

      <ChapterAdminEditModal
        question={p.editingQuestion}
        saving={p.savingEdit}
        onChange={p.setEditingQuestion}
        onClose={() => p.setEditingQuestion(null)}
        onSave={p.saveQuestionEdit}
      />
    </div>
  );
}
