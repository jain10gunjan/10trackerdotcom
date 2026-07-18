'use client';

import GateSolutionFields from '@/features/admin/components/GateSolutionFields';
import { isInlineAnswerQuestion } from '@/lib/questionAnswerMode';

/** Admin edit fields shown inside QuestionCard when editing. */
export default function QuestionAdminBar({
  category,
  questionId,
  editData,
  setEditData,
  inlineAnswerMode,
  isSaving,
  onSave,
}) {
  const needsOptions = !isInlineAnswerQuestion(editData);

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200/50 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">
            {inlineAnswerMode || !needsOptions ? 'Correct Answer' : 'Correct Option'}
          </label>
          {inlineAnswerMode || !needsOptions ? (
            <input
              type="text"
              value={editData.correct_option || ''}
              onChange={(e) => setEditData({ ...editData, correct_option: e.target.value })}
              placeholder="Numerical answer, e.g. 42 (use | for multiple: 42|43)"
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
            />
          ) : (
            <select
              value={editData.correct_option}
              onChange={(e) => setEditData({ ...editData, correct_option: e.target.value })}
              className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
            >
              {['A', 'B', 'C', 'D'].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Difficulty</label>
          <select
            value={editData.difficulty}
            onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
            className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
          >
            {['easy', 'medium', 'hard'].map((diff) => (
              <option key={diff} value={diff}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <GateSolutionFields
        category={category}
        solution={editData.solution || ''}
        solutiontext={editData.solutiontext || ''}
        questionId={questionId}
        onChange={({ solution, solutiontext }) =>
          setEditData({ ...editData, solution, solutiontext })
        }
        urlClassName="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 text-sm"
        textClassName="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 font-mono text-xs"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={`w-full sm:w-auto px-4 py-1.5 rounded-lg text-white ${
          isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
