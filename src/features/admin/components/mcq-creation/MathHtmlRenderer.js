"use client";

import { useMemo } from "react";
import { sanitizeMcqHtml } from "@/lib/mcqCreationSanitize";
import { MathHtml } from "@/features/admin/components/mcq-extractor/MathContent";

/** Render MCQ HTML with sanitization + MathJax (parent must provide McqMathProvider). */
export default function MathHtmlRenderer({ html, className = "", as = "div" }) {
  const safe = useMemo(() => sanitizeMcqHtml(html), [html]);
  if (!safe) return null;
  return <MathHtml html={safe} className={className} as={as} />;
}

export { McqMathProvider } from "@/features/admin/components/mcq-extractor/MathContent";
