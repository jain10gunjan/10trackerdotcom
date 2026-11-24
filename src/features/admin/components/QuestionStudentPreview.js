'use client';

import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { MATHJAX_CONFIG } from '@/features/admin/components/mcq-extractor/MathContent';
import {
  hasPopulatedOptions,
  isInlineAnswerQuestion,
} from '@/lib/questionAnswerMode';

function OptionRow({ letter, text, isCorrect, revealed }) {
  const base =
    'flex gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors';
  const state = !revealed
    ? 'border-neutral-200 bg-white'
    : isCorrect
      ? 'border-emerald-400 bg-emerald-50'
      : 'border-neutral-200 bg-neutral-50 opacity-70';
  return (
    <div className={`${base} ${state}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
        {letter}
      </span>
      <div
        className="min-w-0 flex-1 break-words [&_img]:max-h-40 [&_img]:max-w-full"
        dangerouslySetInnerHTML={{ __html: text || '—' }}
      />
    </div>
  );
}

/**
 * Student-facing render preview (matches practice QuestionCard layout closely).
 */
export default function QuestionStudentPreview({
  question,
  showSolution = false,
}) {
  if (!question) return null;

  const inline = isInlineAnswerQuestion(question);
  const hasOptions = hasPopulatedOptions(question);
  const correct = String(question.correct_option || '')
    .trim()
    .toUpperCase();

  return (
    <MathJaxContext config={MATHJAX_CONFIG}>
      <div className="rounded-2xl border border-neutral-200 bg-[#fafafa] p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 font-medium text-white">
            Student preview
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 text-neutral-600 ring-1 ring-neutral-200">
            {question.difficulty || '—'}
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 text-neutral-600 ring-1 ring-neutral-200">
            {inline ? 'NAT' : 'MCQ'}
          </span>
          {question.chapter ? (
            <span className="rounded-full bg-white px-2 py-0.5 text-neutral-600 ring-1 ring-neutral-200">
              {question.chapter}
            </span>
          ) : null}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          {question.directionHTML ? (
            <div
              className="mb-3 rounded-r border-l-4 border-sky-500 bg-sky-50 p-3 text-sm"
              dangerouslySetInnerHTML={{ __html: question.directionHTML }}
            />
          ) : null}

          <MathJax dynamic>
            <div
              className="prose prose-sm max-w-none text-neutral-900 [&_img]:mx-auto [&_img]:my-3 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-neutral-200"
              dangerouslySetInnerHTML={{ __html: question.question || '' }}
            />
          </MathJax>

          {question.questionCode ? (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-100">
              <code>{question.questionCode}</code>
            </pre>
          ) : null}

          {question.questionImage ? (
            <div className="mt-3 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.questionImage}
                alt="Question diagram"
                className="max-h-72 max-w-full rounded-lg border border-neutral-200 shadow-sm"
              />
            </div>
          ) : null}

          {inline ? (
            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                Your answer (NAT)
              </label>
              <input
                disabled
                placeholder="Type numeric / short answer"
                className="w-full max-w-xs rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm"
              />
              {showSolution ? (
                <p className="mt-2 text-sm text-emerald-700">
                  Correct: <span className="font-semibold">{question.correct_option}</span>
                </p>
              ) : null}
            </div>
          ) : hasOptions ? (
            <div className="mt-4 space-y-2">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const text = question[`options_${letter}`];
                if (!text) return null;
                return (
                  <OptionRow
                    key={letter}
                    letter={letter}
                    text={text}
                    isCorrect={correct === letter}
                    revealed={showSolution}
                  />
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-700">No options and not detected as NAT.</p>
          )}

          {showSolution ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                Solution
              </p>
              <div
                className="prose prose-sm max-w-none text-neutral-800"
                dangerouslySetInnerHTML={{
                  __html: question.solutiontext || question.solution || '—',
                }}
              />
            </div>
          ) : (
            <p className="mt-4 text-xs text-neutral-500">
              Solution hidden — toggle “Show solution” to preview feedback state.
            </p>
          )}
        </div>
      </div>
    </MathJaxContext>
  );
}
