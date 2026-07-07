"use client";

import { FileText, Globe } from "lucide-react";

const OPTIONS = [
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "url", label: "URL", icon: Globe },
];

export default function SourceToggle({ value, onChange, disabled = false }) {
  return (
    <div
      className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1"
      role="tablist"
      aria-label="Source type"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-600 hover:bg-white hover:text-neutral-900"
            } disabled:opacity-50`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
