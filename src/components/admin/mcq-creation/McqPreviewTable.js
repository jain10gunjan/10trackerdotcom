"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import McqCard from "./McqCard";

const PAGE_SIZES = [5, 10, 20, 50];

export default function McqPreviewTable({
  mcqs = [],
  editable = false,
  onMcqsChange,
  emptyMessage = "No MCQs to preview yet.",
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const total = mcqs.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return mcqs.slice(start, start + pageSize);
  }, [mcqs, safePage, pageSize]);

  const updateMcq = (globalIndex, updated) => {
    if (!onMcqsChange) return;
    const next = [...mcqs];
    next[globalIndex] = updated;
    onMcqsChange(next);
  };

  if (!total) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-sm text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{total}</span> question
          {total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-neutral-600">
            Per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-neutral-200 p-1.5 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums text-neutral-700">
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-neutral-200 p-1.5 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {slice.map((mcq, i) => {
          const globalIndex = safePage * pageSize + i;
          return (
            <McqCard
              key={mcq._id || globalIndex}
              mcq={mcq}
              index={globalIndex}
              editable={editable}
              onChange={(updated) => updateMcq(globalIndex, updated)}
            />
          );
        })}
      </div>
    </div>
  );
}
