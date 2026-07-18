import React, { useState } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { CheckCircle, BarChart2, BookOpen } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

const CODE_BLOCK_REGEX =
  /<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi;

const decodeHtml = (html) => {
  if (typeof window === "undefined") return html;
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const renderRichContent = (html) => {
  if (!html) return null;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = CODE_BLOCK_REGEX.exec(html)) !== null) {
    const [fullMatch, lang, codeHtml] = match;

    const precedingHtml = html.slice(lastIndex, match.index);
    if (precedingHtml.trim()) {
      elements.push(
        <MathJax dynamic key={`mj-${lastIndex}`}>
          <div dangerouslySetInnerHTML={{ __html: precedingHtml }} />
        </MathJax>
      );
    }

    const code = decodeHtml(codeHtml);
    elements.push(
      <div className="my-4" key={`code-${match.index}`}>
        <SyntaxHighlighter
          language={lang || "javascript"}
          style={docco}
          wrapLongLines
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );

    lastIndex = match.index + fullMatch.length;
  }

  const remainingHtml = html.slice(lastIndex);
  if (remainingHtml.trim()) {
    elements.push(
      <MathJax dynamic key={`mj-end-${lastIndex}`}>
        <div dangerouslySetInnerHTML={{ __html: remainingHtml }} />
      </MathJax>
    );
  }

  return elements;
};

const QuestionCard = ({
  question,
  index,
  onAnswer,
  isCompleted,
  isAdmin,
  onEdit,
}) => {
  const [showSolution, setShowSolution] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(isCompleted);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleOptionClick = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || isAnswered) return;
    const correct = selectedOption === question.correct_option;
    setIsCorrect(correct);
    setShowFeedback(true);
    setIsAnswered(true);
    setTimeout(() => onAnswer(correct), 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <MathJaxContext>
        <div className="flex justify-between items-center">
          <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <div>
            {isCompleted ? (
              <div className="flex items-center text-green-600">
                <CheckCircle size={14} className="mr-1" /> Completed
              </div>
            ) : (
              <div className="flex items-center text-yellow-600">
                <BarChart2 size={14} className="mr-1" /> Pending
              </div>
            )}
          </div>
        </div>

        {/* Question Content */}
        <div className="p-4">
          {renderRichContent(question.question)}

          {/* Options */}
          {question.options_A && (
            <div className="mt-4 space-y-3">
              {["A", "B", "C", "D"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionClick(opt)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 border rounded-lg transition-all ${
                    selectedOption === opt
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  {opt}. {question[`options_${opt}`]}
                </button>
              ))}
            </div>
          )}

          {/* Submit Button */}
          {!isAnswered && selectedOption && (
            <button
              onClick={handleSubmit}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Submit Answer
            </button>
          )}

          {/* Feedback Message */}
          {showFeedback && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                isCorrect
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isCorrect
                ? "Correct! Well done!"
                : `Not correct. The correct answer is ${question.correct_option}.`}
            </div>
          )}

          {/* Show Solution Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center"
            >
              <BookOpen size={16} className="mr-2" /> Show Solution
            </button>
          </div>

          {/* Solution Display */}
          {showSolution && question.solution && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-gray-700 font-semibold">Solution:</h3>
              {renderRichContent(question.solution)}
            </div>
          )}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default QuestionCard;
