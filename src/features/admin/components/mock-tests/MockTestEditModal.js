"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export default function MockTestEditModal({ test, open, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: 60,
    difficulty: "mixed",
    is_active: true,
  });

  useEffect(() => {
    if (!test) return;
    setForm({
      name: test.name || "",
      description: test.description || "",
      duration: test.duration ?? 60,
      difficulty: test.difficulty || "mixed",
      is_active: test.isActive !== false,
    });
  }, [test]);

  if (!open || !test) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-[90] bg-black/40"
        onClick={saving ? undefined : onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-[91] w-[min(96vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Edit mock test</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <label className="block text-xs font-medium text-neutral-600">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-neutral-600">
              Duration (min)
              <input
                type="number"
                min={1}
                max={600}
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-neutral-600">
              Difficulty
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, difficulty: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            Active (visible to students)
          </label>
          <p className="text-[10px] text-neutral-500">
            Questions: {test.totalQuestions ?? 0} · Attempts: {test.attemptCount ?? 0}
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save changes"
              )}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
