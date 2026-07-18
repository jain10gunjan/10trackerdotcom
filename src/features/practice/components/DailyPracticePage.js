"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ExamSubpageHeader from "@/features/exam-hub/components/ExamSubpageHeader";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { BookOpen, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import {
  isAnswerCorrect,
  isInlineAnswerQuestion,
  hasPopulatedOptions,
  formatAcceptedAnswers,
} from "@/lib/questionAnswerMode";
import InlineAnswerInput from "@/features/practice/components/InlineAnswerInput";

/* ─── constants ───────────────────────────────────────────────── */

const mathJaxConfig = {
  "fast-preview": { disabled: false },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
  },
  messageStyle: "none",
  showMathMenu: false,
};

const CODE_BLOCK_REGEX =
  /<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi;

const LINK_REGEX = /https?:\/\/[^\s<>"']+/g;

const OPTIONS = ["A", "B", "C", "D"];

/* ─── pure helpers ────────────────────────────────────────────── */

const normalizeCategory = (param) =>
  (param || "gate-cse").toString().trim().toUpperCase().replace(/_/g, "-");

const categoryLabel = (param) =>
  (param || "gate-cse").toString().trim().replace(/-/g, " ").toUpperCase();

const decodeHtml = (html) => {
  if (typeof window === "undefined") return html;
  const el = document.createElement("textarea");
  el.innerHTML = html;
  return el.value;
};

const formatCCode = (raw) => {
  if (!raw) return "";
  let text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\s*#include/g, "\n#include")
    .replace(/\s*int main/g, "\nint main")
    .replace(/{/g, "{\n")
    .replace(/;/g, ";\n")
    .replace(/}\s*/g, "\n}\n")
    .replace(/\n{3,}/g, "\n\n");

  let indentLevel = 0;
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (t.startsWith("}")) indentLevel = Math.max(indentLevel - 1, 0);
      const out = "  ".repeat(indentLevel) + t;
      if (t.includes("{")) indentLevel += 1;
      return out;
    })
    .join("\n")
    .trim();
};

/* ─── rich-content renderers ──────────────────────────────────── */

const renderCQuestionIfNeeded = (html) => {
  if (!html) return null;
  const decoded = decodeHtml(html);
  const preMatch = decoded.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/i);

  let intro = "";
  let codeRaw = "";

  if (preMatch) {
    const start = decoded.indexOf(preMatch[0]);
    intro = decoded.slice(0, start);
    codeRaw = preMatch[1] || "";
  } else {
    const hasInclude = decoded.includes("#include");
    const hasMain = decoded.includes("int main");
    if (!hasInclude && !hasMain) return null;
    const splitIndex = hasInclude
      ? decoded.indexOf("#include")
      : decoded.indexOf("int main");
    intro = decoded.slice(0, splitIndex);
    codeRaw = decoded.slice(splitIndex);
    const stopAt = Math.min(
      ...["</pre", "<ol", "<ul", "<div", "<p", "<span", "<table"]
        .map((m) => (codeRaw.includes(m) ? codeRaw.indexOf(m) : Infinity))
    );
    if (isFinite(stopAt)) codeRaw = codeRaw.slice(0, stopAt);
  }

  const formattedCode = formatCCode(codeRaw);

  return (
    <>
      {intro.trim() && (
        <MathJax dynamic>
          <div dangerouslySetInnerHTML={{ __html: intro }} />
        </MathJax>
      )}
      {formattedCode && (
        <div className="my-3 rounded-lg border border-neutral-200 overflow-x-auto">
          <SyntaxHighlighter
            language="c"
            style={docco}
            customStyle={{ margin: 0, background: "transparent", fontSize: "0.82rem" }}
            wrapLongLines
            showLineNumbers={false}
          >
            {formattedCode}
          </SyntaxHighlighter>
        </div>
      )}
    </>
  );
};

const renderRichContent = (html) => {
  if (!html) return null;

  const source = html.includes("<a")
    ? html
    : html.replace(LINK_REGEX, (url) => {
        const safe = url.replace(/"/g, "&quot;");
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
      });

  const elements = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(CODE_BLOCK_REGEX.source, "gi");

  while ((match = regex.exec(source)) !== null) {
    const [fullMatch, lang, codeHtml] = match;
    const preceding = source.slice(lastIndex, match.index);
    if (preceding.trim()) {
      elements.push(
        <MathJax dynamic key={`mj-${lastIndex}`}>
          <div dangerouslySetInnerHTML={{ __html: preceding }} />
        </MathJax>
      );
    }
    elements.push(
      <div className="my-4" key={`code-${match.index}`}>
        <SyntaxHighlighter
          language={lang || "javascript"}
          style={docco}
          wrapLongLines
          showLineNumbers={false}
        >
          {decodeHtml(codeHtml)}
        </SyntaxHighlighter>
      </div>
    );
    lastIndex = match.index + fullMatch.length;
  }

  const remaining = source.slice(lastIndex);
  if (remaining.trim()) {
    elements.push(
      <MathJax dynamic key={`mj-end-${lastIndex}`}>
        <div dangerouslySetInnerHTML={{ __html: remaining }} />
      </MathJax>
    );
  }

  return elements;
};

/* ─── sub-components ──────────────────────────────────────────── */

function SkeletonSet() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <div className="h-5 w-1/3 rounded bg-neutral-200" />
        <div className="h-3 w-2/3 rounded bg-neutral-100" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <div className="h-4 w-12 rounded-full bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-9 rounded-lg bg-neutral-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OptionButton({ opt, value, selected, answered, correctOption, onSelect }) {
  const isCorrect = correctOption === opt;
  const isChosen = selected === opt;

  let base =
    "w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150 flex items-start gap-2.5";

  let variant;
  if (answered) {
    if (isCorrect) variant = "border-emerald-400 bg-emerald-50 text-emerald-900";
    else if (isChosen) variant = "border-red-300 bg-red-50 text-red-800";
    else variant = "border-neutral-200 bg-white text-neutral-500";
  } else {
    variant = isChosen
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 cursor-pointer";
  }

  const icon = answered
    ? isCorrect
      ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
      : isChosen
      ? <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
      : <span className="h-4 w-4 shrink-0 mt-0.5" />
    : (
      <span className={`flex h-4 w-4 shrink-0 mt-0.5 items-center justify-center rounded-full text-[10px] font-bold border ${
        isChosen ? "border-white text-white" : "border-neutral-300 text-neutral-400"
      }`}>
        {opt}
      </span>
    );

  return (
    <button
      type="button"
      onClick={() => !answered && onSelect(opt)}
      className={`${base} ${variant}`}
      disabled={answered}
    >
      {icon}
      <MathJax hideUntilTypeset="first" inline dynamic>
        <span dangerouslySetInnerHTML={{ __html: value }} />
      </MathJax>
    </button>
  );
}

function QuestionCard({ q, idx, selected, onAnswer }) {
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const inlineMode = isInlineAnswerQuestion(q);
  const answered = inlineMode ? submitted : !!selected;
  const userValue = inlineMode ? textAnswer : selected;
  const isCorrect = answered && isAnswerCorrect(userValue, q.correct_option, q);

  const visibleOptions = OPTIONS.filter((opt) => {
    const v = q[`options_${opt}`];
    return typeof v === "string" && v.trim() !== "";
  });
  const hasOptions = hasPopulatedOptions(q);

  const showSolution = hasOptions ? answered : solutionOpen || answered;

  const handleInlineSubmit = () => {
    if (!textAnswer.trim() || submitted) return;
    setSubmitted(true);
    onAnswer(q._id, textAnswer.trim());
  };

  useEffect(() => {
    setTextAnswer("");
    setSubmitted(false);
  }, [q._id]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      {/* Question header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-5">
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 tabular-nums">
          Q{idx + 1}
        </span>
        {answered && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
            isCorrect ? "text-emerald-600" : "text-red-500"
          }`}>
            {isCorrect
              ? <><CheckCircle className="h-3.5 w-3.5" /> Correct</>
              : <><XCircle className="h-3.5 w-3.5" /> Incorrect — {formatAcceptedAnswers(q.correct_option)} is right</>
            }
          </span>
        )}
      </div>

      {/* Question body */}
      <div className="px-4 pb-3 sm:px-5 overflow-x-hidden">
        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-neutral-800 sm:text-base break-words">
          {renderCQuestionIfNeeded(q.question) || renderRichContent(q.question)}
        </div>
      </div>

      {/* Options or inline answer */}
      {inlineMode ? (
        <div className="px-4 pb-4 sm:px-5">
          <InlineAnswerInput
            value={textAnswer}
            onChange={setTextAnswer}
            onSubmit={handleInlineSubmit}
            submitted={submitted}
            isCorrect={isCorrect}
            correctOption={q.correct_option}
          />
        </div>
      ) : hasOptions ? (
        <div className="px-4 pb-4 sm:px-5 space-y-2">
          {visibleOptions.map((opt) => (
            <OptionButton
              key={opt}
              opt={opt}
              value={q[`options_${opt}`]}
              selected={selected}
              answered={answered}
              correctOption={q.correct_option}
              onSelect={(o) => onAnswer(q._id, o)}
            />
          ))}
        </div>
      ) : null}

      {/* Solution */}
      {q.solution && (
        <div className={`border-t border-neutral-100 px-4 py-3 sm:px-5 transition-colors ${
          showSolution ? "bg-neutral-50" : "bg-white"
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-700">Explanation</p>
            {!hasOptions && !inlineMode && (
              <button
                type="button"
                onClick={() => setSolutionOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                {solutionOpen ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> Show</>
                )}
              </button>
            )}
          </div>
          {showSolution && (
            <div className="mt-2 prose prose-sm max-w-none text-neutral-700 break-words overflow-x-hidden">
              {renderRichContent(q.solution)}
            </div>
          )}
          {!showSolution && hasOptions && !answered && (
            <p className="mt-1 text-xs text-neutral-400">Answer to reveal.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ total, answered }) {
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div
          className="h-full bg-neutral-900 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-neutral-500 shrink-0">
        {answered}/{total}
      </span>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────── */

export default function DailyPracticeSetPage() {
  const { category, setId } = useParams();
  const safeCategory = category || "gate-cse";
  const label = categoryLabel(safeCategory);

  const [setData, setSetData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    let cancelled = false;
    const fetchSet = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/daily-practice/sets/${setId}`);
        const data = await res.json();
        if (!res.ok || !data?.success)
          throw new Error(data?.error || "Failed to load daily practice set");
        if (!cancelled) {
          setSetData(data.set);
          setQuestions(data.questions || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load daily practice set");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSet();
    return () => { cancelled = true; };
  }, [setId]);

  const handleAnswer = useCallback((qid, option) => {
    setAnswers((prev) => ({ ...prev, [qid]: option }));
  }, []);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-neutral-50">
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <ExamSubpageHeader
            title={setData?.title || 'Daily practice set'}
            description={`Solve MCQs in this daily set for ${label}.`}
            backHref={`/${safeCategory}/daily-practice`}
            backLabel="All daily sets"
          />
          {loading ? (
            <SkeletonSet />
          ) : error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Failed to load set</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Set header ── */}
              <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                      Daily Practice
                    </p>
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                      {setData?.title || "Practice Set"}
                    </h1>
                    {setData?.description && (
                      <p className="mt-1 text-sm text-neutral-500">
                        {setData.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      {label}
                    </span>
                    {setData?.date_for && (
                      <span className="text-xs text-neutral-400">{setData.date_for}</span>
                    )}
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                      No scoring · Practice only
                    </span>
                  </div>
                </div>

                {questions.length > 0 && (
                  <div className="mt-4">
                    <ProgressBar total={questions.length} answered={answeredCount} />
                  </div>
                )}
              </div>

              {/* ── Questions ── */}
              {questions.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
                  <p className="text-sm text-neutral-500">
                    No questions in this set yet. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <QuestionCard
                      key={q._id || idx}
                      q={q}
                      idx={idx}
                      selected={answers[q._id]}
                      onAnswer={handleAnswer}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </MathJaxContext>
  );
}