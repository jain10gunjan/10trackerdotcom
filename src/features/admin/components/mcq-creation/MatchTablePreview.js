"use client";

import { sanitizeMcqHtml } from "@/lib/mcqCreationSanitize";
import MathHtmlRenderer from "./MathHtmlRenderer";

export default function MatchTablePreview({ directionHTML }) {
  if (!directionHTML) return null;
  const safe = sanitizeMcqHtml(directionHTML);
  if (!safe.trim()) return null;

  return (
    <div className="mb-4 overflow-x-auto rounded-xl border border-amber-200 bg-amber-50/50 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
        Match the following
      </p>
      <MathHtmlRenderer
        html={safe}
        className="prose-table text-sm text-neutral-800 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-neutral-300 [&_th]:bg-neutral-100 [&_th]:px-2 [&_th]:py-1"
      />
    </div>
  );
}
