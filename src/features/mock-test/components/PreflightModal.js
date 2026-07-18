'use client';

import { Clock, Coins, FileQuestion, Target, X, AlertCircle } from 'lucide-react';
import { usesGateMarking } from '@/features/mock-test/lib/mockTestUtils';
import { useCredits } from '@/context/CreditsContext';
import { CREDIT_COST } from '@/features/credits/lib/constants';

export default function PreflightModal({ test, examcategory, open, onClose, onConfirm, isRetake }) {
  const { credits, unlimited, costs } = useCredits();
  const mockCost = costs?.mock_test ?? CREDIT_COST.mock_test;
  if (!open || !test) return null;

  const gateMarking = usesGateMarking(examcategory);
  const durationMin = test.duration || 0;
  const totalQ = test.total_questions || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preflight-title"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-neutral-200 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1">
              {isRetake ? 'Retake test' : 'Before you start'}
            </p>
            <h2 id="preflight-title" className="text-lg font-semibold text-neutral-900 leading-snug">
              {test.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <FileQuestion className="w-3.5 h-3.5" />
                Questions
              </div>
              <p className="text-lg font-semibold text-neutral-900 tabular-nums">{totalQ}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                Duration
              </div>
              <p className="text-lg font-semibold text-neutral-900 tabular-nums">{durationMin} min</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Rules
            </p>
            <ul className="text-sm text-neutral-600 space-y-1.5 list-disc pl-5">
              <li>Timer starts when you begin the first question.</li>
              <li>You can mark questions for review and navigate freely.</li>
              <li>Submit before time runs out to save your score.</li>
              {gateMarking ? (
                <li>
                  <strong className="text-neutral-800">GATE marking:</strong> +1 correct, −⅓ wrong, 0
                  unattempted.
                </li>
              ) : (
                <li>
                  <strong className="text-neutral-800">Scoring:</strong> based on correct answers vs total
                  questions.
                </li>
              )}
            </ul>
          </div>

          {!unlimited && !isRetake && (
            <p className="text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 flex gap-2">
              <Coins className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              First attempt on this test costs {mockCost} credit{mockCost === 1 ? '' : 's'}. You have{' '}
              {credits} remaining. Retakes on the same test are free.
            </p>
          )}

          {!unlimited && isRetake && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex gap-2">
              <Coins className="w-4 h-4 flex-shrink-0 mt-0.5" />
              No additional credits — you have already unlocked this test. You have {credits} credits
              remaining.
            </p>
          )}

          {isRetake && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              This starts a new attempt. Your previous result stays in My Progress.
            </p>
          )}
        </div>

        <div className="p-5 sm:p-6 pt-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-sm font-medium hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            {isRetake ? 'Start retake' : 'Start test'}
          </button>
        </div>
      </div>
    </div>
  );
}
