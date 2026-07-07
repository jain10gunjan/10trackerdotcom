'use client';

import { memo } from 'react';
import { isInlineAnswerQuestion } from '@/lib/questionAnswerMode';
import GateSolutionFields from '@/components/admin/GateSolutionFields';

function ChapterAdminEditModal({
  question,
  category,
  saving,
  onChange,
  onClose,
  onSave,
}) {
  const inlineMode = isInlineAnswerQuestion(question);

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-neutral-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Admin edit</p>
            <p className="text-lg font-semibold text-neutral-900">Edit question</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl hover:bg-neutral-100 text-neutral-700 text-sm font-medium"
          >
            Close
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <textarea
            value={question.question || ''}
            onChange={(e) => onChange({ ...question, question: e.target.value })}
            className="w-full p-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            rows={4}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <input
                key={opt}
                value={question[`options_${opt}`] || ''}
                onChange={(e) =>
                  onChange({ ...question, [`options_${opt}`]: e.target.value })
                }
                className="w-full p-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder={`Option ${opt}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inlineMode ? (
              <input
                type="text"
                value={question.correct_option || ''}
                onChange={(e) => onChange({ ...question, correct_option: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-2xl sm:col-span-2"
                placeholder="Numerical answer, e.g. 42 (use | for multiple: 42|43)"
              />
            ) : (
              <select
                value={question.correct_option || 'A'}
                onChange={(e) => onChange({ ...question, correct_option: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-2xl"
              >
                {['A', 'B', 'C', 'D'].map((o) => (
                  <option key={o} value={o}>
                    Correct: {o}
                  </option>
                ))}
              </select>
            )}
            <select
              value={question.difficulty || 'easy'}
              onChange={(e) => onChange({ ...question, difficulty: e.target.value })}
              className="w-full p-3 border border-neutral-200 rounded-2xl"
            >
              {['easy', 'medium', 'hard'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <GateSolutionFields
            category={category || question.category}
            solution={question.solution || ''}
            solutiontext={question.solutiontext || ''}
            questionId={question._id}
            onChange={({ solution, solutiontext }) =>
              onChange({
                ...question,
                solution,
                solutiontext,
              })
            }
          />
        </div>
        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 text-sm"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ChapterAdminEditModal);
