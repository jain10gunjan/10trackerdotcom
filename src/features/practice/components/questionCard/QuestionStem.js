'use client';

import { MathJax } from 'better-react-mathjax';
import {
  convertLatexTags,
  convertRelativeImageUrls,
  convertNewlinesToBreaks,
} from './htmlUtils';

/** Question stem / direction / extra text block. */
export default function QuestionStem({
  questionData,
  normalizeBreaks,
  renderHtmlWithCodeBlocks,
  isEditing,
  isAdmin,
  editQuestion,
  onEditQuestionChange,
}) {
  if (isEditing && isAdmin) {
    return (
      <textarea
        value={editQuestion}
        onChange={(e) => onEditQuestionChange(e.target.value)}
        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 bg-gray-50/50"
        rows={3}
      />
    );
  }

  return (
    <div className="mb-4">
      {questionData.directionHTML && questionData.directionHTML !== null && (
        <div
          className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{
            __html: convertNewlinesToBreaks(
              convertLatexTags(convertRelativeImageUrls(questionData.directionHTML)),
              normalizeBreaks
            ),
          }}
        />
      )}
      <MathJax dynamic>
        <div className="prose prose-sm max-w-none text-neutral-900">
          {renderHtmlWithCodeBlocks(questionData.question, normalizeBreaks)}
        </div>
      </MathJax>
      {questionData.questionextratext ? (
        <div
          className="mt-2 text-gray-600 text-xs break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{
            __html: convertNewlinesToBreaks(
              convertLatexTags(convertRelativeImageUrls(questionData.questionextratext)),
              normalizeBreaks
            ),
          }}
        />
      ) : null}
    </div>
  );
}
