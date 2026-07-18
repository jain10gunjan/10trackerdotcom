'use client';

import { MathJax } from 'better-react-mathjax';
import { BookOpen } from 'lucide-react';
import { formatAcceptedAnswers } from '@/lib/questionAnswerMode';
import { isGateCategory } from '@/lib/gateCategory';
import { normalizeGateOverflowUrl } from '@/lib/gateoverflowUrl';
import { LINKED_CORRECT_SEP } from '@/lib/parseLinkedQuestionSet';
import {
  convertLatexTags,
  convertRelativeImageUrls,
  convertNewlinesToBreaks,
} from './htmlUtils';

export default function QuestionSolution({
  questionData,
  category,
  isLinkedSet,
  linkedSet,
  linkedCorrectLetters,
  normalizeBreaks,
  embedded = false,
}) {
  return (
    <div className="mt-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/80 overflow-x-auto">
      <h3 className="font-bold mb-2 text-indigo-900 text-sm flex items-center">
        <BookOpen size={14} className="mr-1.5 flex-shrink-0" />
        Solution
      </h3>
      {questionData.correct_option ? (
        <div className="mb-2 p-2 bg-white/80 rounded-lg break-words">
          <span className="font-semibold text-indigo-900 text-sm">
            Correct Answer:{' '}
            {isLinkedSet && linkedCorrectLetters
              ? linkedCorrectLetters.every((l) => /^[A-D]$/.test(l))
                ? linkedCorrectLetters.join(LINKED_CORRECT_SEP)
                : linkedCorrectLetters
                    .map((letter, i) => {
                      if (!letter) return null;
                      const label = linkedSet.subQuestions[i]?.number
                        ? `Q.${linkedSet.subQuestions[i].number}`
                        : `Part ${i + 1}`;
                      return `${label} → ${letter}`;
                    })
                    .filter(Boolean)
                    .join(' · ') || formatAcceptedAnswers(questionData.correct_option)
              : formatAcceptedAnswers(questionData.correct_option)}
          </span>
        </div>
      ) : null}

      <MathJax hideUntilTypeset="first" inline dynamic>
        <div
          className={`text-neutral-800 break-words overflow-x-auto [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto ${
            embedded ? 'text-sm leading-relaxed' : 'text-sm'
          }`}
        >
          {isGateCategory(category || questionData.category) ? (
            <>
              {questionData.solutiontext ? (
                <div
                  className="mb-3"
                  dangerouslySetInnerHTML={{
                    __html: convertNewlinesToBreaks(
                      convertLatexTags(convertRelativeImageUrls(questionData.solutiontext)),
                      normalizeBreaks
                    ),
                  }}
                />
              ) : (
                <p className="text-neutral-500 text-sm mb-2">No written solution yet.</p>
              )}
              {normalizeGateOverflowUrl(questionData.solution) ? (
                <a
                  href={convertRelativeImageUrls(questionData.solution)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 underline text-sm font-medium"
                >
                  Discuss on GateOverflow
                </a>
              ) : null}
            </>
          ) : (
            <p
              dangerouslySetInnerHTML={{
                __html: convertNewlinesToBreaks(
                  convertLatexTags(convertRelativeImageUrls(questionData.solution)),
                  normalizeBreaks
                ),
              }}
            />
          )}
        </div>
      </MathJax>
    </div>
  );
}
