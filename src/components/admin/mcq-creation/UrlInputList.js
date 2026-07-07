"use client";

import { useState } from "react";
import { Globe, Plus, Trash2 } from "lucide-react";
import { validateUrls } from "@/lib/mcqCreationApi";

export default function UrlInputList({
  urls,
  onChange,
  disabled = false,
}) {
  const [localError, setLocalError] = useState(null);

  const update = (index, value) => {
    const next = [...urls];
    next[index] = value;
    onChange(next);
    setLocalError(null);
  };

  const addRow = () => {
    onChange([...urls, ""]);
  };

  const removeRow = (index) => {
    if (urls.length <= 1) return;
    onChange(urls.filter((_, i) => i !== index));
  };

  const validate = () => {
    const result = validateUrls(urls);
    if (result.error) {
      setLocalError(result.error);
      return null;
    }
    setLocalError(null);
    return result.urls;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Enter one or more page URLs. Each must start with{" "}
        <code className="rounded bg-neutral-100 px-1 text-xs">http://</code> or{" "}
        <code className="rounded bg-neutral-100 px-1 text-xs">https://</code>.
      </p>

      {urls.map((url, index) => (
        <div key={index} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="url"
              value={url}
              disabled={disabled}
              onChange={(e) => update(index, e.target.value)}
              placeholder="https://example.com/aptitude-questions"
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
            />
          </div>
          {urls.length > 1 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeRow(index)}
              className="shrink-0 rounded-xl border border-neutral-200 p-2.5 text-neutral-500 hover:bg-neutral-50 hover:text-red-600 disabled:opacity-40"
              aria-label="Remove URL"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add another URL
      </button>

      {localError && (
        <p className="text-sm text-red-600" role="alert">
          {localError}
        </p>
      )}

      {/* expose validate via data attribute pattern — parent calls validateUrls */}
      <span className="hidden" data-url-validator="true" />
    </div>
  );
}

export { validateUrls };
