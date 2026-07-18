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
  Flag,
  Timer,
} from 'lucide-react';
import ExamSubpageHeader from '@/features/exam-hub/components/ExamSubpageHeader';
import { useChapterPractice } from '@/features/practice/hooks/useChapterPractice';
import { mathJaxConfig, progressQuestionId } from '@/features/practice/lib/chapterPracticeUtils';
import ChapterPracticeSkeleton, { QuestionCardSkeleton } from './ChapterPracticeSkeleton';
import ProgressRing from './ProgressRing';
import DifficultyTabs from './DifficultyTabs';
import ChapterQuestionMap from './ChapterQuestionMap';
import ChapterNavSheet from './ChapterNavSheet';
import ChapterAdminEditModal from './ChapterAdminEditModal';

const QuestionCard = dynamic(() => import('@/features/practice/components/QuestionCard'), {
  ssr: false,
  loading: () => <QuestionCardSkeleton />,
});

function formatExamTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function ChapterPracticeApp({ initialData = null }) {
  const p = useChapterPractice({ initialData });

  if (p.loading) {
    return <ChapterPracticeSkeleton />;
  }

  const progressWidth = p.stats.total ? (p.stats.comp / p.stats.total) * 100 : 0;
  const curQid = p.curQ ? progressQuestionId(p.curQ._id) : '';

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-28 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ExamSubpageHeader
          title={`${p.chapterTitle} — Practice`}
          description={`${p.subjectTitle} · ${p.activeDifficulty} · ${p.stats.total} questions`}
          backHref={p.chapterHref}
          backLabel="Back to chapter"
        >
          <p className="mt-2 text-xs text-neutral-500 font-medium">
            {p.subjectTitle} › {p.chapterTitle} › Practice
          </p>
        </ExamSubpageHeader>

        <div className="sticky top-20 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-neutral-50/95 backdrop-blur-md border-b border-neutral-200/80 mb-5">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-bold text-neutral-800 tabular-nums shrink-0">
                {p.currentIdx + 1}
                <span className="text-neutral-400 font-medium">/{p.nVisible || p.stats.total}</span>
              </span>
              <div className="h-1.5 flex-1 max-w-[160px] rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-neutral-500 tabular-nums hidden sm:inline">
                {p.stats.pct}% done
              </span>
            </div>

            {p.sessionMode === 'exam' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold tabular-nums">
                <Timer className="w-3.5 h-3.5" />
                {formatExamTime(p.examRemainingMs)}
              </div>
            ) : null}

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

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <FilterChip active={p.listFilter === 'all'} onClick={() => p.setListFilter('all')}>All</FilterChip>
            <FilterChip active={p.listFilter === 'wrong'} onClick={() => p.setListFilter('wrong')}>Wrong</FilterChip>
            <FilterChip active={p.listFilter === 'flagged'} onClick={() => p.setListFilter('flagged')}>
              <span className="inline-flex items-center gap-1"><Flag className="w-3 h-3" /> Flagged</span>
            </FilterChip>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            {p.sessionMode === 'exam' ? (
              <button
                type="button"
                onClick={p.endExam}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
              >
                End exam
              </button>
            ) : (
              <button
                type="button"
                onClick={p.startExam}
                disabled={!p.nVisible && !p.stats.total}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
              >
                Exam mode
              </button>
            )}
          </div>

          <div className="mt-2 lg:hidden">
            <DifficultyTabs
              active={p.activeDifficulty}
              counts={p.counts}
              loading={p.loadingQ || p.sessionMode === 'exam'}
              onChange={p.changeDifficulty}
              compact
            />
          </div>
        </div>

        {p.examSummary ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-900">Exam summary</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Correct {p.examSummary.correct} · Wrong {p.examSummary.wrong} · Skipped {p.examSummary.skipped}
                {' '}(/ {p.examSummary.total})
              </p>
            </div>
            <button
              type="button"
              onClick={() => p.setExamSummary(null)}
              className="text-xs font-semibold text-emerald-800 underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">
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
                  <p className="text-xs text-neutral-500 mt-0.5 inline-flex items-center gap-1">
                    <Award className="w-3 h-3" /> {p.stats.pts} pts
                  </p>
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
                loading={p.loadingQ || p.sessionMode === 'exam'}
                onChange={p.changeDifficulty}
              />
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Question map</p>
                {p.firstPendingGlobalIdx >= 0 ? (
                  <button
                    type="button"
                    onClick={() => p.goToRaw(p.firstPendingGlobalIdx)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Jump to open
                  </button>
                ) : null}
              </div>
              <ChapterQuestionMap
                questions={p.allQuestions}
                idList={p.difficultyIdList}
                currentIndex={p.rawCurrentIdx}
                currentId={curQid || null}
                completedSet={p.compSet}
                correctSet={p.corrSet}
                flagSet={p.flagSet}
                onSelect={p.goToRaw}
                visibleIndices={p.listFilter === 'all' ? null : p.filteredGlobalIndices}
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {p.loadingQ && p.nLoaded === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm min-h-[360px]">
                <QuestionCardSkeleton />
              </div>
            ) : p.nVisible === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {p.listFilter === 'all' ? 'No questions available' : 'Nothing in this filter'}
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  {p.listFilter === 'all'
                    ? `No ${p.activeDifficulty} questions found for this chapter.`
                    : 'Try All, or clear Wrong / Flagged.'}
                </p>
                {p.listFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => p.setListFilter('all')}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-900 text-white"
                  >
                    Show all
                  </button>
                ) : null}
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
                        isCompleted={p.compSet.has(curQid)}
                        isCorrect={p.corrSet.has(curQid)}
                        isAdmin={p.isAdmin}
                        embedded
                        skipMathJaxContext
                        creditsLocked={Boolean(p.user) && !p.canAttemptPractice}
                        onRequireCredits={() => p.setShowPaywall(true)}
                        requireAuth={p.requireAuthToAttempt}
                        onRequireAuth={() => p.setShowAuthModal(true)}
                        flagged={p.flagSet.has(curQid)}
                        onToggleFlag={p.toggleFlag}
                        hideSolution={p.sessionMode === 'exam' && !p.examSolutionsUnlocked}
                        onEdit={(q) => p.setEditingQuestion({ ...q })}
                      />
                    </MathJax>
                  </MathJaxContext>
                </div>

                <div className="hidden sm:flex items-center justify-between gap-4 px-5 py-4 border-t border-neutral-100 bg-neutral-50/50">
                  <button
                    type="button"
                    onClick={p.goPrev}
                    disabled={!p.canGoPrev}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={p.goNext}
                    disabled={!p.canGoNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
                  >
                    {p.loadingQ ? 'Loading…' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 lg:hidden">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct {p.stats.corr}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold bg-rose-50 text-rose-800 border-rose-200">
                <XCircle className="w-3.5 h-3.5" /> Wrong {p.stats.wrong}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold bg-neutral-50 text-neutral-700 border-neutral-200">
                <Circle className="w-3.5 h-3.5" /> Left {p.stats.pending}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-2 px-3 py-2.5 max-w-6xl mx-auto">
          <button
            type="button"
            onClick={p.goPrev}
            disabled={!p.canGoPrev}
            className="w-11 h-11 rounded-2xl border border-neutral-200 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-700" />
          </button>

          <button
            type="button"
            onClick={() => p.setSheetOpen(true)}
            className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-2xl border border-neutral-200 bg-neutral-50"
          >
            <div className="flex gap-1 items-center flex-1 overflow-hidden justify-center">
              {(() => {
                const start = Math.max(0, p.rawCurrentIdx - 4);
                const end = Math.min(p.nLoaded, start + 9);
                const slice = p.allQuestions.slice(start, end);
                return slice.map((q, ii) => {
                  const i = start + ii;
                  const qid = progressQuestionId(q._id);
                  const cur = i === p.rawCurrentIdx;
                  const ok = p.corrSet.has(qid);
                  const bad = p.compSet.has(qid) && !ok;
                  const flagged = p.flagSet.has(qid);
                  return (
                    <div
                      key={q._id}
                      className={`h-1.5 rounded-full shrink-0 transition-all ${
                        cur
                          ? 'w-4 bg-emerald-500'
                          : flagged
                            ? 'w-1.5 bg-amber-400'
                            : ok
                              ? 'w-1.5 bg-emerald-400'
                              : bad
                                ? 'w-1.5 bg-rose-400'
                                : 'w-1.5 bg-neutral-300'
                      }`}
                    />
                  );
                });
              })()}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-neutral-900 tabular-nums leading-none">
                {p.currentIdx + 1}/{p.nVisible}
              </p>
              <p className="text-[10px] text-neutral-500">Map</p>
            </div>
            <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={p.goNext}
            disabled={!p.canGoNext}
            className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {p.sheetOpen ? (
        <ChapterNavSheet
          questions={p.allQuestions}
          idList={p.difficultyIdList}
          currentIndex={p.rawCurrentIdx}
          currentId={curQid || null}
          completedSet={p.compSet}
          correctSet={p.corrSet}
          flagSet={p.flagSet}
          onSelect={p.goToRaw}
          onClose={() => p.setSheetOpen(false)}
          hasMore={p.hasMore}
          stats={p.stats}
          user={p.user}
          unsaved={p.unsaved}
          saving={p.saving}
          onSave={p.saveProgress}
          onSignIn={() => p.setShowAuthModal(true)}
          visibleIndices={p.listFilter === 'all' ? null : p.filteredGlobalIndices}
        />
      ) : null}

      <ChapterAdminEditModal
        question={p.editingQuestion}
        category={p.category}
        saving={p.savingEdit}
        onChange={p.setEditingQuestion}
        onClose={() => p.setEditingQuestion(null)}
        onSave={p.saveQuestionEdit}
      />
    </div>
  );
}
