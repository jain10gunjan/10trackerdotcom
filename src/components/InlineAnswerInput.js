'use client';

import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatAcceptedAnswers } from '@/lib/questionAnswerMode';

function InlineAnswerInput({
  value = '',
  onChange,
  onSubmit,
  disabled = false,
  submitted = false,
  isCorrect = false,
  correctOption = '',
  placeholder = 'Enter a number',
  className = '',
  inputClassName = '',
  showHint = true,
}) {
  const canSubmit = !disabled && !submitted && String(value).trim().length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-neutral-700">
        Numerical answer
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        disabled={disabled || submitted}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-label="Numerical answer"
        className={`w-full rounded-xl border px-4 py-3 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 ${
          submitted
            ? isCorrect
              ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-200'
              : 'border-rose-400 bg-rose-50 focus:ring-rose-200'
            : 'border-neutral-200 bg-white focus:border-neutral-400 focus:ring-neutral-200'
        } ${inputClassName}`}
      />
      {showHint && !submitted && (
        <p className="text-xs text-neutral-500">
          Enter a plain number or text value only — no formulas or LaTeX. Must match exactly (e.g. <span className="font-mono">42</span> and <span className="font-mono">42.0</span> are different).
        </p>
      )}
      {!submitted && onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            canSubmit
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Submit answer
        </button>
      )}
      {submitted && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
            isCorrect
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {isCorrect ? (
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div>
            {isCorrect ? (
              <span className="font-medium">Correct!</span>
            ) : (
              <>
                <span className="font-medium">Incorrect.</span>
                {correctOption ? (
                  <p className="mt-0.5 text-xs sm:text-sm">
                    Correct answer:{' '}
                    <strong>{formatAcceptedAnswers(correctOption)}</strong>
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(InlineAnswerInput);
