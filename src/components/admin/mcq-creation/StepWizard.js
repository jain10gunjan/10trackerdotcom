"use client";

import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Extract" },
  { n: 2, label: "Review" },
  { n: 3, label: "Rewrite" },
  { n: 4, label: "Export" },
];

export default function StepWizard({ step, onStepChange, maxReachable = 1, children }) {
  return (
    <div className="space-y-6">
      <nav aria-label="MCQ creation steps" className="overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 sm:gap-4">
          {STEPS.map(({ n, label }, idx) => {
            const done = step > n;
            const active = step === n;
            const reachable = n <= maxReachable;
            return (
              <li key={n} className="flex items-center gap-2">
                {idx > 0 && (
                  <span
                    className={`hidden h-px w-6 sm:block sm:w-10 ${
                      done ? "bg-emerald-400" : "bg-neutral-200"
                    }`}
                  />
                )}
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && onStepChange?.(n)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : reachable
                          ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                          : "border-neutral-100 bg-neutral-50 text-neutral-400"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      active
                        ? "bg-white/20"
                        : done
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span className="font-medium">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div>{children}</div>
    </div>
  );
}
