import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { createPortal } from "react-dom";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, BookOpen, X, Check, AlertTriangle, Clock, Edit3 } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/app/context/AuthContext";

// Supabase client (browser)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Helper function to convert [latex] tags to $ for MathJax
const convertLatexTags = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/\[latex\]/g, '$')
    .replace(/\[\/latex\]/g, '$');
};

// Helper function to convert relative image URLs to absolute URLs
const convertRelativeImageUrls = (text) => {
  if (!text) return text;
  const textStr = String(text);
  
  // Check if the text contains /wp-content/uploads/GATE
  if (textStr.includes('/wp-content/uploads/GATE')) {
    // Replace relative paths in img src attributes
    let processed = textStr.replace(
      /(<img[^>]*src=["'])(\/wp-content\/uploads\/GATE[^"']*)(["'])/gi,
      '$1https://practicepaper.in$2$3'
    );
    
    // Replace relative paths that are not in img tags (standalone URLs)
    // processed = processed.replace(
    //   /(^|[^"'])(\/wp-content\/uploads\/GATE[^\s<>"']+)/g,
    //   '$1https://practicepaper.in$2'
    // );
    
    return processed;
  }
  
  return textStr;
};

// Helper function to convert \n to <br /> for UPSC Prelims
const convertNewlinesToBreaks = (text, isUpscPrelims) => {
  if (!text || !isUpscPrelims) return text;
  
  let processed = String(text);
  
  // First handle escaped \n (literal backslash + n) - this is what comes from database as string
  processed = processed.replace(/\\n/g, '<br />');
  
  // Then handle actual newline characters (Windows \r\n, Mac \r, Unix \n)
  processed = processed.replace(/\r\n/g, '<br />'); // Windows line endings
  processed = processed.replace(/\r/g, '<br />');     // Mac line endings
  processed = processed.replace(/\n/g, '<br />');      // Unix line endings
  
  return processed;
};

// Helper: detect and render <pre> code blocks with syntax highlighting
const CODE_PRE_REGEX = /<pre([^>]*)>([\s\S]*?)<\/pre>/gi;

const extractLanguageFromPre = (preAttrs) => {
  if (!preAttrs) return null;
  const classMatch = /class=["']([^"']*)["']/i.exec(preAttrs);
  if (!classMatch) return null;
  const classes = classMatch[1].split(/\s+/);
  const langClass = classes.find((cls) => cls.startsWith("lang-"));
  if (!langClass) return null;
  const raw = langClass.replace("lang-", "").toLowerCase();
  if (raw === "c_cpp") return "cpp";
  return raw || null;
};

const autoFormatCode = (code, language) => {
  if (!code) return code;
  const cLikeLanguages = ["c", "cpp", "c_cpp", "java", "javascript", "js"];
  if (!cLikeLanguages.includes((language || "").toLowerCase())) {
    return code;
  }

  let formatted = code.trim();

  // Ensure preprocessor directives start on their own line
  formatted = formatted.replace(/#include/g, "\n#include");

  // Newlines before common C constructs
  formatted = formatted
    .replace(/\s*(for\s*\()/g, "\nfor (")
    .replace(/\s*(if\s*\()/g, "\nif (")
    .replace(/\s*(else\s+if\s*\()/g, "\nelse if (")
    .replace(/\s*(else\b)/g, "\nelse")
    .replace(/\s*(while\s*\()/g, "\nwhile (")
    .replace(/\s*(do\s*\b)/g, "\ndo ");

  // Add newlines after semicolons
  formatted = formatted.replace(/;\s*/g, ";\n");

  // Add newlines after opening braces
  formatted = formatted.replace(/{\s*/g, "{\n");

  // Add newlines before closing braces
  formatted = formatted.replace(/\s*}\s*/g, "\n}\n");

  // Collapse multiple blank lines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // Apply indentation based on braces
  const lines = formatted
    .split("\n")
    .map((l) => l.trim())
    .filter((l, idx, arr) => !(l === "" && (idx === 0 || arr[idx - 1] === "")));

  let indentLevel = 0;
  const indentSize = 2;
  const indentedLines = lines.map((line) => {
    if (line === "") return "";
    const trimmed = line.trim();
    const closesBlock = trimmed.startsWith("}") || trimmed.startsWith("};");

    if (closesBlock && indentLevel > 0) {
      indentLevel -= 1;
    }

    const prefix = " ".repeat(indentLevel * indentSize);
    const result = prefix + trimmed;

    const opensBlock = trimmed.endsWith("{");
    if (opensBlock) {
      indentLevel += 1;
    }

    return result;
  });

  return indentedLines.join("\n").trimEnd();
};

const decodeHtmlEntities = (html) => {
  if (typeof window === "undefined" || !html) return html;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  let decoded = textarea.value;

  // Convert common HTML line-break representations into real newlines
  decoded = decoded.replace(/<br\s*\/?>/gi, "\n");
  // Handle escaped \n that may have been stored as text
  decoded = decoded.replace(/\\n/g, "\n");

  return decoded;
};

const renderHtmlWithCodeBlocks = (html, isUpscPrelims) => {
  if (!html) return null;

  const processed = convertRelativeImageUrls(html);
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = CODE_PRE_REGEX.exec(processed)) !== null) {
    const [fullMatch, preAttrs, codeHtml] = match;

    const beforeHtml = processed.slice(lastIndex, match.index);
    if (beforeHtml.trim()) {
      segments.push(
        <div
          key={`html-${lastIndex}`}
          className="mb-2 break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{
            __html: convertNewlinesToBreaks(
              convertLatexTags(beforeHtml),
              isUpscPrelims
            ),
          }}
        />
      );
    }

    const language = extractLanguageFromPre(preAttrs) || "text";
    let code = decodeHtmlEntities(codeHtml);
    // Strip presentational HTML that sometimes gets copied with code
    code = code
      .replace(/<\/?span[^>]*>/gi, "")
      .replace(/<\/?font[^>]*>/gi, "")
      .replace(/<\/?div[^>]*>/gi, "")
      .replace(/&nbsp;/gi, " ");
    code = autoFormatCode(code, language);

    segments.push(
      <div
        key={`code-${match.index}`}
        className="mt-3 mb-3 rounded-lg overflow-x-auto shadow-sm border border-gray-200/50 max-w-full"
      >
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: "12px",
            maxWidth: "100%",
            overflowX: "auto",
          }}
          wrapLines
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );

    lastIndex = match.index + fullMatch.length;
  }

  const remainingHtml = processed.slice(lastIndex);
  if (remainingHtml.trim()) {
    segments.push(
      <div
        key={`html-end-${lastIndex}`}
        className="mt-2 break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
        dangerouslySetInnerHTML={{
          __html: convertNewlinesToBreaks(
            convertLatexTags(remainingHtml),
            isUpscPrelims
          ),
        }}
      />
    );
  }

  return (
    <div className="break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto">
      {segments}
    </div>
  );
};

// Memoized QuestionCard component
const QuestionCard = memo(({ question, category, index, onAnswer, onSkip, questionId: questionIdProp, isCompleted, isCorrect, onReport, onEdit, isEditing, onStartEditing, isAdmin, quizLayout = false, embedded = false, creditsLocked = false, onRequireCredits }) => {
  const richLayout = quizLayout || embedded;
  const { user } = useAuth();
  const questionId = questionIdProp ?? question._id ?? question.id;
  // When questionId prop is passed, call onAnswer(questionId, isCorrect); otherwise onAnswer(isCorrect) for backward compat
  const reportAnswer = useCallback((isCorrect) => {
    if (questionIdProp !== undefined && questionId != null) {
      onAnswer(questionId, isCorrect);
    } else {
      onAnswer(isCorrect);
    }
  }, [questionIdProp, questionId, onAnswer]);
  // Check if this is UPSC Prelims
  const isUpscPrelims = category?.toLowerCase() === 'upsc-prelims' || category?.toLowerCase() === 'upscprelims';
  
  const [state, setState] = useState({
    showSolution: false,
    selectedOption: null,
    isAnswered: isCompleted,
    difficulty: 0,
    showFeedback: false,
    isCorrect: false,
    confidence: 50,
    showReportForm: false,
    reportReason: "",
    editData: {
      question: question.question,
      options_A: question.options_A,
      options_B: question.options_B,
      options_C: question.options_C,
      options_D: question.options_D,
      correct_option: question.correct_option,
      solution: question.solution,
      difficulty: question.difficulty,
    },
    isSaving: false,
  });

  // Keep internal answered/correct state in sync with persisted progress
  useEffect(() => {
    if (!isCompleted) return;
    setState((prev) => ({
      ...prev,
      isAnswered: true,
      // If parent knows correctness, reflect it in local feedback state
      isCorrect: typeof isCorrect === "boolean" ? isCorrect : prev.isCorrect,
      showFeedback: typeof isCorrect === "boolean" ? true : prev.showFeedback,
    }));
  }, [isCompleted, isCorrect]);

  const mayViewSolution =
    isCompleted || (state.isAnswered && state.showFeedback);

  const interactionBlocked = creditsLocked && !isCompleted;

// Optimized MathJax config
  const config = useMemo(() => ({
  "fast-preview": { disabled: false },
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]], processEscapes: true },
  messageStyle: "none",
  showMathMenu: false,
  }), []);

  // Set MathJax global config
  useEffect(() => {
    window.MathJax = { tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], processEscapes: true }, svg: { fontCache: "global" } };
  }, []);

  // Set difficulty level
  useEffect(() => {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    setState((prev) => ({ ...prev, difficulty: difficultyMap[question.difficulty] || 0 }));
  }, [question.difficulty]);

  // Memoized handlers
  const handleOptionClick = useCallback((option) => {
    if (interactionBlocked) {
      onRequireCredits?.();
      return;
    }
    if (state.isAnswered) return;
    setState((prev) => ({ ...prev, selectedOption: option }));
  }, [state.isAnswered, interactionBlocked, onRequireCredits]);

  const handleSubmit = useCallback(() => {
    if (interactionBlocked) {
      onRequireCredits?.();
      return;
    }
    if (!state.selectedOption || state.isAnswered) return;
    const isCorrect = state.selectedOption === question.correct_option;
    setState((prev) => ({ ...prev, isCorrect, showFeedback: true, isAnswered: true }));
    setTimeout(() => reportAnswer(isCorrect), 800);
  }, [state.selectedOption, state.isAnswered, question.correct_option, reportAnswer, interactionBlocked, onRequireCredits]);

  const handleSkip = useCallback(() => {
    if (interactionBlocked) {
      onRequireCredits?.();
      return;
    }
    setState((prev) => ({
      ...prev,
      isAnswered: true,
      showFeedback: false,
      showSolution: false,
    }));
    if (onSkip && questionId != null) {
      onSkip(questionId);
    }
  }, [onSkip, questionId, interactionBlocked, onRequireCredits]);

  const closeReportModal = useCallback(() => {
    setState((prev) => ({ ...prev, showReportForm: false, reportReason: "" }));
  }, []);

  const handleReport = useCallback(() => {
    setState((prev) => ({ ...prev, showReportForm: true }));
  }, []);

  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => setPortalMounted(true), []);

  useEffect(() => {
    if (!state.showReportForm) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !reportSubmitting) closeReportModal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [state.showReportForm, reportSubmitting, closeReportModal]);

  const handleReportSubmit = useCallback(async () => {
    if (!state.reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    const questionId = question._id || question.id;
    const topic = question.topic || question.chapter || category;
    const reason = state.reportReason.trim();

    setReportSubmitting(true);
    try {
      if (onReport) {
        onReport(questionId, reason, topic);
        closeReportModal();
        toast.success("Question reported successfully");
      } else {
        if (!user) {
          toast.error("Please sign in to report questions");
          return;
        }

        const userEmail = user?.primaryEmailAddress?.emailAddress || user?.email;
        if (!userEmail) {
          toast.error("Unable to get user email. Please sign in again.");
          return;
        }

        const { error } = await supabase.from("reported_questions").insert({
          question_id: questionId,
          topic: topic || category || "unknown",
          user_id: userEmail,
          reason,
          reported_at: new Date().toISOString(),
        });

        if (error) throw error;

        closeReportModal();
        toast.success("Question reported successfully");
      }
    } catch (error) {
      console.error("Report error:", error);
      toast.error("Failed to report question. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  }, [onReport, question, category, state.reportReason, user, closeReportModal]);

  const handleSaveEdit = useCallback(async () => {
    if (!isAdmin) return;

    const { question: qText, options_A, options_B, options_C, options_D, correct_option } = state.editData || {};
    if (!qText || !options_A || !options_B || !options_C || !options_D || !correct_option) {
      toast.error("Please fill question, all options and correct option.");
      return;
    }

    try {
      setState((prev) => ({ ...prev, isSaving: true }));
      const { error } = await supabase
        .from("examtracker")
        .update({
          question: qText,
          options_A,
          options_B,
          options_C,
          options_D,
          correct_option,
          solution: state.editData.solution || null,
          solutiontext: state.editData.solution || null,
          difficulty: state.editData.difficulty || "easy",
        })
        .eq("_id", question._id);

      if (error) throw error;

      if (onEdit) onEdit(question._id, state.editData);
      if (onStartEditing) onStartEditing(); // toggle off editor if parent uses it as a toggle
      toast.success("Question updated successfully.");
    } catch (e) {
      toast.error("Failed to save changes. Please try again.");
    }
    finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [isAdmin, onEdit, onStartEditing, question._id, state.editData]);

  const getDifficultyColor = useCallback((level) => ({
    1: "bg-gradient-to-r from-green-400 to-emerald-500",
    2: "bg-gradient-to-r from-yellow-400 to-orange-500",
    3: "bg-gradient-to-r from-red-400 to-pink-500",
  }[level] || "bg-gray-300"), []);

  // JSON-LD Structured Data
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Question",
    "@id": `https://yourdomain.com/questions/${question._id}`,
    "eduQuestionType": "Multiple choice",
    "text": question.question.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML for clean text
    "acceptedAnswer": {
      "@type": "Answer",
      "text": question.correct_option
    },
    "suggestedAnswer": [
      question.options_A && { "@type": "Answer", "text": question.options_A.replace(/<\/?[^>]+(>|$)/g, "") },
      question.options_B && { "@type": "Answer", "text": question.options_B.replace(/<\/?[^>]+(>|$)/g, "") },
      question.options_C && { "@type": "Answer", "text": question.options_C.replace(/<\/?[^>]+(>|$)/g, "") },
      question.options_D && { "@type": "Answer", "text": question.options_D.replace(/<\/?[^>]+(>|$)/g, "") },
    ].filter(Boolean),
    "comment": {
      "@type": "Comment",
      "text": (question.solution || question.solutiontext || "").replace(/<\/?[^>]+(>|$)/g, "")
    },
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "alignmentType": "educationalSubject",
      "targetName": question.topic
    },
    "learningResourceType": "Assessment",
    "datePublished": question.created_at || "2025-09-06",
    "publisher": {
      "@type": "Organization",
      "name": "Your Organization Name"
    }
  }), [question]);

  // Reusable question card renderer
  const renderQuestionCard = useCallback((questionData, questionIndex) => (
      <motion.div
      initial={richLayout ? false : { opacity: 0, y: 10 }}
        animate={richLayout ? false : { opacity: 1, y: 0 }}
      whileHover={richLayout ? undefined : { y: -2 }}
        transition={{ duration: 0.2 }}
      className={
        embedded
          ? `w-full overflow-hidden ${isCompleted ? "ring-2 ring-emerald-500/20 ring-inset" : ""}`
          : `bg-white overflow-hidden ${
              quizLayout
                ? `rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(15,23,42,0.18)] border border-slate-200/80 ${isCompleted ? "ring-2 ring-emerald-500/25" : ""}`
                : `rounded-xl shadow-md border border-gray-100/50 ${isCompleted ? "ring-2 ring-emerald-500/20" : "hover:shadow-lg"}`
            }`
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MathJaxContext config={config}>
        <div className={
          embedded
            ? "bg-neutral-50 p-4 sm:p-5 border-b border-neutral-200"
            : quizLayout
              ? "bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 border-0 border-slate-200/70"
              : "bg-gray-50 p-4 border-0 border-gray-100/60"
        }>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`rounded-xl text-white flex items-center justify-center font-bold ${
                embedded
                  ? "w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base bg-neutral-900"
                  : quizLayout
                    ? "w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base bg-slate-900 shadow-inner"
                    : "w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 text-sm"
              }`}>{questionIndex + 1}</div>
              <div className="flex flex-col space-y-1">
                <span className={`text-xs font-medium uppercase ${embedded ? "text-neutral-500" : "text-gray-500"}`}>Difficulty</span>
                <div className="flex space-x-1">
                  {[1, 2, 3].map((level) => (
                    <div key={level} className={`w-2 h-2 rounded-full ${level <= state.difficulty ? getDifficultyColor(level) : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
              {questionData.year && (
                <div className="px-2 py-1 rounded-lg bg-white/80 text-xs font-semibold text-gray-700 border border-gray-200/60">{questionData.year}</div>
              )}
              {!state.isAnswered && (
                <button 
                  onClick={handleSkip}
                  className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center space-x-1 transition-colors"
                  title="Mark as complete"
                >
                  <CheckCircle size={12} />
                  <span>Mark Complete</span>
                </button>
              )}
              {isAdmin && !isEditing && (
                <button
                  onClick={() => {
                    if (onEdit) {
                      onEdit(questionData);
                      return;
                    }
                    onStartEditing?.();
                  }}
                  className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
              )}
              <button 
                onClick={handleReport}
                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium flex items-center space-x-1 transition-colors"
                title="Report question"
              >
                <AlertTriangle size={12} />
                <span>Report</span>
              </button>
              
              {questionData.topic && (
                <div className="px-2 py-1 rounded-lg bg-white/80 text-[10px] sm:text-xs font-semibold text-gray-700 border border-gray-200/60 max-w-full truncate">
                  {questionData.topic}
                </div>
              )}
              <div className={`px-2 py-1 rounded-lg text-xs font-semibold border ${state.isAnswered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {state.isAnswered ? (
                  <div className="flex items-center space-x-1">
                    <CheckCircle size={12} className="text-emerald-600" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Clock size={12} className="text-amber-600" />
                    <span>Pending</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={`overflow-x-auto ${embedded ? "p-4 sm:p-6" : quizLayout ? "p-4 sm:p-6 md:p-8" : "p-4"}`}>
          {isEditing && isAdmin ? (
            <textarea
              value={state.editData.question}
              onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, question: e.target.value } }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 bg-gray-50/50"
              rows={3}
            />
          ) : (
            <MathJax hideUntilTypeset={"first"} inline dynamic>
              <div className={`break-words overflow-x-auto [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto ${
                embedded
                  ? "text-base sm:text-[1.0625rem] leading-relaxed text-neutral-900 [&_p]:text-neutral-900 [&_li]:text-neutral-900"
                  : quizLayout
                    ? "text-base sm:text-[1.05rem] leading-[1.65] font-medium text-slate-900"
                    : "text-sm leading-relaxed text-gray-800"
              }`}>
                {questionData.directionHTML && questionData.directionHTML !== null && (
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.directionHTML)), isUpscPrelims) }} />
                )}
                {renderHtmlWithCodeBlocks(questionData.question, isUpscPrelims)}

                {questionData.questionextratext && (
                  <div className="mt-2 text-gray-600 text-xs break-words [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto" dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.questionextratext)), isUpscPrelims) }} />
                )}
                {(questionData.category === "GATE-CSE" || questionData.category === "CAT") && questionData.questionCode && (
                  <div className="mt-3 rounded-lg overflow-x-auto shadow-sm border border-gray-200/50 max-w-full">
                    <SyntaxHighlighter 
                      language="javascript" 
                      style={atomOneDark} 
                      customStyle={{ margin: 0, padding: "12px", maxWidth: "100%", overflowX: "auto" }}
                      wrapLines={true}
                      wrapLongLines={true}
                    >
                      {questionData.questionCode}
                  </SyntaxHighlighter>
                </div>
              )}
                {(questionData.category === "GATE-CSE" || questionData.category === "CAT") && questionData.questionImage && (
                  <div className="mt-3 flex justify-center max-w-full overflow-hidden">
                    <Image
                      src={questionData.questionImage}
                      width={160}
                      height={120}
                      className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200/50"
                      alt={`Question ${questionIndex + 1}`}
                    loading="lazy"
                      onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
              </div>
            </MathJax>
          )}
          {(() => {
            const hasOptions = ["A", "B", "C", "D"].some(opt => {
              const optionText = questionData[`options_${opt}`];
              return optionText && String(optionText).trim().length > 0;
            });
            
            if (!hasOptions) return null;
            
            return (
              <div className={`mt-4 ${richLayout ? "space-y-3 sm:space-y-3.5" : "space-y-2"}`}>
                {["A", "B", "C", "D"].map((opt, optIndex) => {
                  const optionText = questionData[`options_${opt}`];
                  if (!optionText || String(optionText).trim().length === 0) return null;
                const isSelected = state.selectedOption === opt;
                const isCorrectOption = opt === questionData.correct_option;
                const optionClass = richLayout
                  ? state.isAnswered && state.showFeedback
                    ? isCorrectOption
                      ? "border-2 border-emerald-500/90 bg-emerald-50/80 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]"
                      : isSelected && !isCorrectOption
                      ? "border-2 border-rose-500/90 bg-rose-50/70 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.12)]"
                      : embedded
                        ? "border border-neutral-200 bg-neutral-50/60 opacity-80"
                        : "border border-slate-200/90 bg-slate-50/40 opacity-80"
                    : isSelected
                    ? embedded
                      ? "border-2 border-neutral-900 bg-neutral-100 shadow-sm ring-2 ring-neutral-900/10"
                      : "border-2 border-slate-900 bg-slate-100 shadow-md ring-2 ring-slate-900/10"
                    : embedded
                      ? "border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.998]"
                      : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/90 active:scale-[0.998]"
                  : state.isAnswered && state.showFeedback
                  ? isCorrectOption
                    ? "border-emerald-500 bg-emerald-50/50"
                    : isSelected && !isCorrectOption
                    ? "border-rose-500 bg-rose-50/50"
                    : "border-gray-200/60"
                  : isSelected
                  ? "border-gray-800 bg-gray-100/50"
                  : "border-2 border-gray-200/60 hover:bg-gray-50/50";
                    return (
                  <div key={opt}>
                    {isEditing && isAdmin ? (
                      <textarea
                        value={state.editData[`options_${opt}`]}
                        onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, [`options_${opt}`]: e.target.value } }))}
                        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400 bg-gray-50/50"
                        rows={2}
                      />
                    ) : (
                      <motion.button
                        initial={richLayout ? { opacity: 0, y: 6 } : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ delay: optIndex * 0.04, duration: 0.2 }}
                        onClick={() => handleOptionClick(opt)}
                        disabled={state.isAnswered || interactionBlocked}
                        type="button"
                        className={`w-full text-left rounded-xl transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out ${richLayout ? "p-3.5 sm:p-4 min-h-[3rem] sm:min-h-[3.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " + (embedded ? "focus-visible:ring-neutral-900/25" : "focus-visible:ring-slate-900/25") : "p-3 rounded-lg"} ${optionClass} ${state.isAnswered ? "cursor-default" : "cursor-pointer"} overflow-x-auto`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                            richLayout
                              ? `w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm ${
                                  isSelected && !state.isAnswered
                                    ? embedded ? "bg-neutral-900 text-white" : "bg-slate-900 text-white"
                                    : state.isAnswered && state.showFeedback && isCorrectOption
                                      ? "bg-emerald-600 text-white"
                                      : state.isAnswered && state.showFeedback && isSelected && !isCorrectOption
                                        ? "bg-rose-600 text-white"
                                        : embedded
                                          ? "bg-neutral-100 text-neutral-700 border border-neutral-200"
                                          : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`
                              : `w-6 h-6 rounded-md text-xs ${isSelected ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`
                          }`}>
                            {opt}
                          </div>
                          <MathJax hideUntilTypeset={"first"} inline dynamic>
                            <div className={`flex-grow break-words min-w-0 [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto ${
                              embedded
                                ? "text-sm sm:text-[0.9375rem] leading-relaxed text-neutral-800"
                                : quizLayout
                                  ? "text-sm sm:text-[0.9375rem] leading-snug text-slate-800"
                                  : "text-xs text-gray-800"
                            }`} dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(optionText)), isUpscPrelims) }} />
                          </MathJax>
                          <div className="flex-shrink-0">
                            {state.isAnswered && state.showFeedback && isCorrectOption && <Check size={14} className="text-green-500" />}
                            {state.isAnswered && state.showFeedback && isSelected && !isCorrectOption && <X size={14} className="text-red-500" />}
                          </div>
                        </div>
                      </motion.button>
                    )}
                  </div>
                    );
                  })}
                </div>
            );
          })()}
          {questionData.options_A && !state.isAnswered && state.selectedOption && !isEditing && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200/50">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Confidence Level</label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">Not sure</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                  value={state.confidence}
                  onChange={(e) => setState((prev) => ({ ...prev, confidence: parseInt(e.target.value) }))}
                  className="flex-grow h-1.5 bg-gray-200 rounded-full cursor-pointer"
                  style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${state.confidence}%, #e5e7eb ${state.confidence}%, #e5e7eb 100%)` }}
                />
                <span className="text-xs text-gray-500">Very sure</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-sm font-bold text-gray-800">{state.confidence}%</span>
              </div>
            </div>
          )}
          {isEditing && isAdmin && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Correct Option</label>
                  <select
                    value={state.editData.correct_option}
                    onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, correct_option: e.target.value } }))}
                    className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
                  >
                    {["A", "B", "C", "D"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Difficulty</label>
                  <select
                    value={state.editData.difficulty}
                    onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, difficulty: e.target.value } }))}
                    className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
                  >
                    {["easy", "medium", "hard"].map((diff) => <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Solution</label>
                <textarea
                  value={state.editData.solution}
                  onChange={(e) => setState((prev) => ({ ...prev, editData: { ...prev.editData, solution: e.target.value } }))}
                  className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300/30 focus:border-gray-400"
                  rows={3}
                />
                  </div>
              <button
                onClick={handleSaveEdit}
                disabled={state.isSaving}
                className={`w-full sm:w-auto px-4 py-1.5 rounded-lg text-white ${state.isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {state.isSaving ? "Saving..." : "Save Changes"}
              </button>
                  </div>
          )}
          {interactionBlocked && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
              <p className="font-medium">You&apos;re out of credits</p>
              <p className="text-amber-800/90 mt-1 text-xs">
                Subscribe for unlimited practice or wait until your balance syncs.
              </p>
              <button
                type="button"
                onClick={() => onRequireCredits?.()}
                className="mt-2 w-full sm:w-auto px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
              >
                View plans & subscribe
              </button>
            </div>
          )}

          {!isEditing && (
            <div className={`mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 ${richLayout ? "sm:mt-6" : ""}`}>
              {!state.isAnswered && questionData.options_A && (
                <button
                  onClick={handleSubmit}
                  disabled={!state.selectedOption || interactionBlocked}
                  type="button"
                  className={`flex-1 font-semibold transition-all duration-200 ${
                    richLayout
                      ? `py-3.5 sm:py-3 rounded-xl text-sm sm:text-base ${
                          state.selectedOption
                            ? embedded
                              ? "bg-neutral-900 text-white hover:bg-neutral-800 shadow-md"
                              : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/15"
                            : embedded
                              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`
                      : `py-2.5 rounded-lg text-sm ${
                    state.selectedOption 
                      ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`
                  }`}
                >
                  Submit Answer
                </button>
              )}
              {mayViewSolution && (
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, showSolution: !prev.showSolution }))}
                className={`flex-1 font-semibold transition-colors flex items-center justify-center gap-2 ${
                  richLayout
                    ? `py-3.5 sm:py-3 rounded-xl text-sm sm:text-base ${
                        state.showSolution
                          ? embedded
                            ? "bg-neutral-100 text-neutral-800 border-2 border-neutral-300"
                            : "bg-slate-100 text-slate-800 border-2 border-slate-300"
                          : embedded
                            ? "bg-white text-neutral-800 border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                            : "bg-white text-slate-800 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`
                    : `py-2.5 rounded-lg text-sm ${
                  state.showSolution 
                    ? "bg-gray-100 text-gray-800 border-2 border-gray-300" 
                    : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800"
                }`
                }`}
              >
                <BookOpen size={richLayout ? 18 : 16} />
                <span>{state.showSolution ? "Hide Solution" : "Show Solution"}</span>
              </button>
              )}
            </div>
          )}
              <AnimatePresence>
            {state.showFeedback && (
                  <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`mt-3 p-3 rounded-lg border-2 ${state.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div className="flex items-center space-x-2">
                  {state.isCorrect ? (
                    <>
                      <CheckCircle size={16} className="text-green-600" />
                          <div>
                        <span className="font-bold text-green-800 text-sm">Correct!</span>
                        <p className="text-green-700 text-xs">You earned 100 points.</p>
                          </div>
                        </>
                      ) : (
                        <>
                      <AlertTriangle size={16} className="text-red-600" />
                          <div>
                        <span className="font-bold text-red-800 text-sm">Incorrect</span>
                        <p className="text-red-700 text-xs">Correct answer: <strong>{questionData.correct_option}</strong></p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {mayViewSolution && state.showSolution && (
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 transition-all duration-300 ease-in-out overflow-x-auto">
                  <h3 className="font-bold mb-1 text-indigo-800 text-sm flex items-center">
                    <BookOpen size={14} className="mr-1 flex-shrink-0" />
                    Solution
                  </h3>
                  {questionData.correct_option && (
                    <div className="mb-1 p-2 bg-white/70 rounded-lg break-words">
                      <span className="font-semibold text-indigo-800 text-xs">Correct Answer: {questionData.correct_option}</span>
                    </div>
                  )}
                  

<MathJax hideUntilTypeset={"first"} inline dynamic>
  <div className="text-gray-700 text-xs break-words overflow-x-auto [&_*]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto">
  {["gate-cse", "gate-me", "gate-da"].includes(
    category?.toLowerCase() || ""
    ) ? (
      <a
        href={convertRelativeImageUrls(questionData.solution)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        Discuss solution
      </a>
    ) : (
      <p
        dangerouslySetInnerHTML={{ __html: convertNewlinesToBreaks(convertLatexTags(convertRelativeImageUrls(questionData.solution)), isUpscPrelims) }}
      >
      </p>
    )}
  </div>
</MathJax>

                </div>
              )}
        </div>
      </MathJaxContext>
    </motion.div>
  ), [state, question, isEditing, isAdmin, onStartEditing, handleOptionClick, handleSubmit, handleSkip, handleSaveEdit, getDifficultyColor, jsonLd, config, isCompleted, quizLayout, embedded, richLayout]);

  const reportModal = state.showReportForm && portalMounted
    ? createPortal(
        <AnimatePresence>
          <motion.div
            key="report-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-question-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10050] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => !reportSubmitting && closeReportModal()}
          >
            <motion.div
              key="report-panel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="report-question-title" className="text-base font-semibold text-neutral-900">
                      Report question
                    </h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Question {index + 1}
                      {question.topic ? ` · ${question.topic}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeReportModal}
                  disabled={reportSubmitting}
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/80 transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 py-4">
                <label htmlFor="report-reason" className="block text-sm font-medium text-neutral-700 mb-2">
                  What&apos;s wrong with this question?
                </label>
                <textarea
                  id="report-reason"
                  value={state.reportReason}
                  onChange={(e) => setState((prev) => ({ ...prev, reportReason: e.target.value }))}
                  placeholder="E.g. incorrect answer, unclear wording, typo, outdated syllabus…"
                  disabled={reportSubmitting}
                  className="w-full min-h-[120px] p-3 text-sm text-neutral-900 placeholder:text-neutral-400 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-y disabled:opacity-60"
                  rows={4}
                  autoFocus
                />
                <p className="text-xs text-neutral-500 mt-2">
                  We review reports within 48 hours and fix issues when confirmed.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-neutral-200 bg-neutral-50">
                <button
                  type="button"
                  onClick={closeReportModal}
                  disabled={reportSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReportSubmit}
                  disabled={reportSubmitting || !state.reportReason.trim()}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reportSubmitting ? "Submitting…" : "Submit report"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div className={embedded ? "space-y-0" : quizLayout ? "space-y-4" : "space-y-4 mb-8"}>
      {renderQuestionCard(question, index)}
      {reportModal}
    </div>
  );
});

QuestionCard.displayName = 'QuestionCard';

export default QuestionCard;