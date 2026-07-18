'use client';

import { memo, useMemo } from 'react';
import { MathJax } from 'better-react-mathjax';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

function convertLatexTags(text) {
  if (!text) return text;
  return String(text)
    .replace(/\[latex\]/g, '$')
    .replace(/\[\/latex\]/g, '$');
}

function convertRelativeImageUrls(text) {
  if (!text) return text;
  const textStr = String(text);
  if (!textStr.includes('/wp-content/uploads/GATE')) return textStr;
  return textStr.replace(
    /(<img[^>]*src=["'])(\/wp-content\/uploads\/GATE[^"']*)(["'])/gi,
    '$1https://practicepaper.in$2$3'
  );
}

function toSafeHtml(html, isUpscPrelims, convertNewlinesToBreaks) {
  return convertNewlinesToBreaks(
    convertLatexTags(convertRelativeImageUrls(html)),
    isUpscPrelims
  );
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Exam-style linked set: shared statement once, then stacked sub-questions.
 * Only used when parseLinkedQuestionSet succeeds — normal MCQs never hit this.
 */
function LinkedQuestionSetView({
  linkedSet,
  correctLetters,
  selectedLinked,
  onSelect,
  isAnswered,
  showFeedback,
  interactionBlocked,
  isUpscPrelims,
  convertNewlinesToBreaks,
  richLayout,
  embedded,
}) {
  const htmlClass =
    'break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto';

  const statementHtml = useMemo(
    () => toSafeHtml(linkedSet.statementHtml, isUpscPrelims, convertNewlinesToBreaks),
    [linkedSet.statementHtml, isUpscPrelims, convertNewlinesToBreaks]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 px-3.5 py-3 sm:px-4 sm:py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-sky-800/80 mb-2">
          Common statement
        </p>
        <MathJax hideUntilTypeset="first" inline dynamic>
          <div
            className={`${htmlClass} text-sm sm:text-[0.95rem] leading-relaxed text-neutral-900`}
            dangerouslySetInnerHTML={{ __html: statementHtml }}
          />
        </MathJax>
      </div>

      {linkedSet.subQuestions.map((sq, sqIndex) => {
        const selected = selectedLinked[sqIndex] || null;
        const correctLetter = correctLetters[sqIndex];
        const label = sq.number ? `Q.${sq.number}` : `Part ${sqIndex + 1}`;

        return (
          <div
            key={`${sq.number || 'p'}-${sqIndex}`}
            className="rounded-xl border border-neutral-200 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-bold tracking-wide">
                {label}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                Linked {sqIndex + 1}/{linkedSet.subQuestions.length}
              </span>
            </div>

            <MathJax hideUntilTypeset="first" inline dynamic>
              <div
                className={`${htmlClass} text-sm sm:text-[0.95rem] leading-relaxed text-neutral-900 mb-3`}
                dangerouslySetInnerHTML={{
                  __html: toSafeHtml(sq.stemHtml, isUpscPrelims, convertNewlinesToBreaks),
                }}
              />
            </MathJax>

            <div className={richLayout ? 'space-y-3' : 'space-y-2'}>
              {sq.options.map((optionHtml, optIndex) => {
                const opt = OPTION_LETTERS[optIndex];
                if (!opt || !optionHtml?.trim()) return null;

                const isSelected = selected === opt;
                const isCorrectOption = correctLetter != null && opt === correctLetter;

                const optionClass = richLayout
                  ? isAnswered && showFeedback && correctLetter
                    ? isCorrectOption
                      ? 'border-2 border-emerald-500/90 bg-emerald-50/80'
                      : isSelected && !isCorrectOption
                        ? 'border-2 border-rose-500/90 bg-rose-50/70'
                        : embedded
                          ? 'border border-neutral-200 bg-neutral-50/60 opacity-80'
                          : 'border border-slate-200/90 bg-slate-50/40 opacity-80'
                    : isSelected
                      ? embedded
                        ? 'border-2 border-neutral-900 bg-neutral-100 shadow-sm ring-2 ring-neutral-900/10'
                        : 'border-2 border-slate-900 bg-slate-100 shadow-md ring-2 ring-slate-900/10'
                      : embedded
                        ? 'border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                        : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/90'
                  : isAnswered && showFeedback && correctLetter
                    ? isCorrectOption
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : isSelected && !isCorrectOption
                        ? 'border-rose-500 bg-rose-50/50'
                        : 'border-gray-200/60'
                    : isSelected
                      ? 'border-gray-800 bg-gray-100/50'
                      : 'border-2 border-gray-200/60 hover:bg-gray-50/50';

                return (
                  <motion.button
                    key={opt}
                    type="button"
                    initial={richLayout ? { opacity: 0, y: 4 } : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: optIndex * 0.03, duration: 0.18 }}
                    onClick={() => onSelect(sqIndex, opt)}
                    disabled={isAnswered || interactionBlocked}
                    className={`w-full text-left rounded-xl transition-[transform,box-shadow,border-color,background-color] duration-200 ${
                      richLayout ? 'p-3.5 sm:p-4' : 'p-3 rounded-lg'
                    } ${optionClass} ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`rounded-lg flex items-center justify-center font-bold flex-shrink-0 w-8 h-8 text-xs ${
                          isSelected && !isAnswered
                            ? embedded
                              ? 'bg-neutral-900 text-white'
                              : 'bg-slate-900 text-white'
                            : isAnswered && showFeedback && isCorrectOption
                              ? 'bg-emerald-600 text-white'
                              : isAnswered && showFeedback && isSelected && !isCorrectOption
                                ? 'bg-rose-600 text-white'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {opt}
                      </div>
                      <MathJax hideUntilTypeset="first" inline dynamic>
                        <div
                          className={`${htmlClass} flex-grow min-w-0 text-sm leading-relaxed text-neutral-800`}
                          dangerouslySetInnerHTML={{
                            __html: toSafeHtml(optionHtml, isUpscPrelims, convertNewlinesToBreaks),
                          }}
                        />
                      </MathJax>
                      <div className="flex-shrink-0">
                        {isAnswered && showFeedback && correctLetter && isCorrectOption && (
                          <Check size={14} className="text-green-500" />
                        )}
                        {isAnswered &&
                          showFeedback &&
                          correctLetter &&
                          isSelected &&
                          !isCorrectOption && <X size={14} className="text-red-500" />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(LinkedQuestionSetView);
