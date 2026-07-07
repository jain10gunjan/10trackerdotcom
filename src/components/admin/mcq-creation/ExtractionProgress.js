"use client";

import { Loader2 } from "lucide-react";
import {
  PDF_PROGRESS_MESSAGES,
  URL_FETCH_MESSAGES,
  URL_WEB_SEARCH_MESSAGES,
} from "@/lib/mcqCreationApi";

export default function ExtractionProgress({
  active = false,
  message,
  sourceType = "pdf",
  useWebSearch = true,
  messages,
}) {
  if (!active) return null;

  const defaultMessages =
    messages ||
    (sourceType === "url"
      ? useWebSearch
        ? URL_WEB_SEARCH_MESSAGES
        : URL_FETCH_MESSAGES
      : PDF_PROGRESS_MESSAGES);

  const defaultMessage =
    sourceType === "url"
      ? useWebSearch
        ? "Searching web and generating MCQs…"
        : "Fetching page and generating MCQs…"
      : "Extracting text from PDF…";

  return (
    <div
      className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-indigo-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-indigo-900">
            {message || defaultMessage}
          </p>
          <ul className="mt-3 space-y-1.5">
            {defaultMessages.map((m, i) => (
              <li
                key={i}
                className="text-xs text-indigo-700/80 before:mr-2 before:content-['•']"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
