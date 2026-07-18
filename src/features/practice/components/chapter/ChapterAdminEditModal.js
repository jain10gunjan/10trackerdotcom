'use client';

import { memo, useMemo } from 'react';
import { isInlineAnswerQuestion } from '@/lib/questionAnswerMode';
import {
  getLinkedQuestionSet,
  splitLinkedCorrectOption,
  joinLinkedCorrectOption,
  LINKED_CORRECT_SEP,
} from '@/lib/parseLinkedQuestionSet';
import GateSolutionFields from '@/features/admin/components/GateSolutionFields';

const ABCD = ['A', 'B', 'C', 'D'];

function ChapterAdminEditModal({
  question,
  category,
  saving,
  onChange,
  onClose,
  onSave,
}) {
  const linkedSet = useMemo(
    () => (question ? getLinkedQuestionSet(question) : null),
    [question?.question, question?._id]
  );
  const isLinked = Boolean(linkedSet);
  const inlineMode = !isLinked && isInlineAnswerQuestion(question);

  const linkedLetters = useMemo(() => {
    if (!linkedSet) return [];
    const n = linkedSet.subQuestions.length;
    const parts = splitLinkedCorrectOption(question?.correct_option);
    return Array.from({ length: n }, (_, i) => {
      const letter = parts[i];
      return /^[A-D]$/.test(letter) ? letter : '';
    });
  }, [linkedSet, question?.correct_option]);

  const setLinkedLetter = (index, letter) => {
    const next = [...linkedLetters];
    next[index] = letter;
    onChange({
      ...question,
      correct_option: joinLinkedCorrectOption(next, linkedSet.subQuestions.length),
    });
  };

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-neutral-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Admin edit</p>
            <p className="text-lg font-semibold text-neutral-900">
              {isLinked ? 'Edit linked question set' : 'Edit question'}
            </p>
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
          {isLinked ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-3.5 py-3 text-xs text-sky-900">
              Linked set detected ({linkedSet.subQuestions.length} parts). Options live in the
              question HTML; set each part&apos;s correct letter below. Combined value uses{' '}
              <code className="font-mono text-[11px] bg-white/80 px-1 rounded">{LINKED_CORRECT_SEP}</code>
              {' '}e.g. <code className="font-mono text-[11px] bg-white/80 px-1 rounded">A_&amp;_D</code>.
            </div>
          ) : null}

          <textarea
            value={question.question || ''}
            onChange={(e) => onChange({ ...question, question: e.target.value })}
            className="w-full p-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            rows={4}
          />

          {!isLinked ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ABCD.map((opt) => (
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
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inlineMode ? (
              <input
                type="text"
                value={question.correct_option || ''}
                onChange={(e) => onChange({ ...question, correct_option: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-2xl sm:col-span-2"
                placeholder="Numerical answer, e.g. 42 (use | for multiple: 42|43)"
              />
            ) : isLinked ? (
              <div className="sm:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedSet.subQuestions.map((sq, i) => {
                    const label = sq.number ? `Q.${sq.number}` : `Part ${i + 1}`;
                    return (
                      <label key={`${label}-${i}`} className="block space-y-1.5">
                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                          {label} correct
                        </span>
                        <select
                          value={linkedLetters[i] || ''}
                          onChange={(e) => setLinkedLetter(i, e.target.value)}
                          className="w-full p-3 border border-neutral-200 rounded-2xl"
                        >
                          <option value="">Select…</option>
                          {ABCD.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Combined correct_option
                  </span>
                  <input
                    type="text"
                    value={question.correct_option || ''}
                    onChange={(e) =>
                      onChange({ ...question, correct_option: e.target.value.trim() })
                    }
                    className="w-full p-3 border border-neutral-200 rounded-2xl font-mono text-sm"
                    placeholder={`A${LINKED_CORRECT_SEP}D`}
                  />
                  <span className="text-[11px] text-neutral-500">
                    Dropdowns update this field. You can also type it directly.
                  </span>
                </label>
              </div>
            ) : (
              <select
                value={question.correct_option || 'A'}
                onChange={(e) => onChange({ ...question, correct_option: e.target.value })}
                className="w-full p-3 border border-neutral-200 rounded-2xl"
              >
                {ABCD.map((o) => (
                  <option key={o} value={o}>
                    Correct: {o}
                  </option>
                ))}
              </select>
            )}
            <select
              value={question.difficulty || 'easy'}
              onChange={(e) => onChange({ ...question, difficulty: e.target.value })}
              className={`w-full p-3 border border-neutral-200 rounded-2xl ${isLinked ? 'sm:col-span-2' : ''}`}
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
