"use client";

import { HelpCircle } from "lucide-react";

export default function WebSearchToggle({
  checked = true,
  onChange,
  disabled = false,
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-300"
      />
      <span>
        <span className="font-medium">Use OpenAI web search</span>
        <span
          className="ml-1.5 inline-flex align-middle text-neutral-400"
          title="The model browses the page and creates copyright-free MCQs. On failure, falls back to direct page fetch."
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </span>
        <span className="mt-0.5 block text-xs text-neutral-500">
          Model browses the page and generates copyright-free MCQs. Falls back to
          direct fetch if web search fails.
        </span>
      </span>
    </label>
  );
}
