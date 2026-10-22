'use client';

import { Clock, Coins, FileQuestion, Target, X, AlertCircle } from 'lucide-react';
import { usesGateMarking, usesJeeMainMarking, usesMhtCetMarking, usesViteeeMarking, usesWbjeeMarking, usesKcetMarking, usesCatMarking } from '@/features/mock-test/lib/mockTestUtils';
import { useCredits } from '@/context/CreditsContext';
import { CREDIT_COST } from '@/features/credits/lib/constants';

export default function PreflightModal({ test, examcategory, open, onClose, onConfirm, isRetake }) {
  const { credits, unlimited, costs } = useCredits();
  const mockCost = costs?.mock_test ?? CREDIT_COST.mock_test;
  if (!open || !test) return null;

  const gateMarking = usesGateMarking(examcategory);
  const jeeMarking = !gateMarking && usesJeeMainMarking(examcategory);
  const mhtMarking = !gateMarking && !jeeMarking && usesMhtCetMarking(examcategory);
  const viteeeMarking = !gateMarking && !jeeMarking && !mhtMarking && usesViteeeMarking(examcategory);
  const wbjeeMarking = !gateMarking && !jeeMarking && !mhtMarking && !viteeeMarking && usesWbjeeMarking(examcategory);
  const kcetMarking = !gateMarking && !jeeMarking && !mhtMarking && !viteeeMarking && !wbjeeMarking && usesKcetMarking(examcategory);
  const catMarking = !gateMarking && !jeeMarking && !mhtMarking && !viteeeMarking && !wbjeeMarking && !kcetMarking && usesCatMarking(examcategory);
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
                  <strong className="text-neutral-800">GATE marking:</strong>{' '}
                  {totalQ === 65
                    ? '+1 or +2 per question (as marked), −⅓ of marks for wrong MCQ, 0 for wrong NAT / unattempted. Max 100 marks.'
                    : '+1 correct, −⅓ wrong (MCQ), 0 unattempted.'}
                </li>
              ) : jeeMarking ? (
                <li>
                  <strong className="text-neutral-800">JEE Main marking:</strong> +4 correct, −1 wrong
                  (MCQ and numerical), 0 unattempted. Max {totalQ * 4} marks.
                </li>
              ) : mhtMarking ? (
                <li>
                  <strong className="text-neutral-800">MHT-CET marking:</strong> no negative marking.
                  Physics and Chemistry +1, Mathematics +2, wrong or blank scores 0. Attempt every
                  question. Max {test.weightage_config?.maxMarks || (totalQ === 150 ? 200 : 'paper')} marks.
                  One {durationMin}-minute timer covers both papers.
                </li>
              ) : viteeeMarking ? (
                <li>
                  <strong className="text-neutral-800">VITEEE marking:</strong> +4 correct, −1 wrong, 0
                  blank. Max {totalQ * 4} marks. Guess only when two options can be eliminated. Suggested
                  order: English and Aptitude, then Chemistry, Physics, Mathematics.
                </li>
              ) : wbjeeMarking ? (
                <li>
                  <strong className="text-neutral-800">WBJEE marking:</strong> Category 1 +1 / −0.25,
                  Category 2 +2 / −0.5, Category 3 +2 with no negative marking. One or more options may
                  be correct on Category 3; a wrong option scores 0. Max{' '}
                  {test.weightage_config?.maxMarks || (totalQ === 155 ? 200 : 'paper')} marks. Attempt
                  Category 3 first, then Category 1. Leave Category 2 numericals until the end. One{' '}
                  {durationMin}-minute timer covers both papers.
                </li>
              ) : kcetMarking ? (
                <li>
                  <strong className="text-neutral-800">KCET marking:</strong> +1 correct, 0 wrong, 0
                  blank. There is no negative marking, so attempt every question. Max{' '}
                  {test.weightage_config?.maxMarks || totalQ} marks. One {durationMin}-minute timer
                  covers the three 80-minute papers. Suggested order: Chemistry, then Physics, then
                  Mathematics.
                </li>
              ) : catMarking ? (
                <li>
                  <strong className="text-neutral-800">CAT marking:</strong> +3 correct, −1 for a wrong
                  MCQ, 0 for a wrong TITA, 0 if blank. Max {test.weightage_config?.maxMarks || (totalQ === 68 ? 204 : totalQ * 3)} marks.
                  {totalQ === 68
                    ? ' VARC, DILR, and QA are 40 minutes each. When a section clock ends, that section locks and the next one starts. Unused time does not carry over.'
                    : ` One ${durationMin}-minute timer.`}
                  {' '}VARC: two easier RC passages, then verbal ability. DILR: choose 2–3 sets and leave the hardest. QA: easy Arithmetic and Algebra first. Guess an MCQ only after two options are gone.
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
