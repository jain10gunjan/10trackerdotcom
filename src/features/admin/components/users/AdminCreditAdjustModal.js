"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { parseJsonResponse, toastPromise } from "@/lib/toastAsync";

export default function AdminCreditAdjustModal({ user, open, onClose, onSaved }) {
  const [mode, setMode] = useState("grant");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("grant");
    setAmount("");
    setNote("");
  }, [open, user?.email]);

  if (!open || !user) return null;

  const currentCredits = user.wallet?.credits ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email) {
      toast.error("User has no email — cannot adjust credits");
      return;
    }

    const parsed = Number(amount);
    if (!Number.isFinite(parsed)) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch("/api/admin/credits", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user.email,
              mode,
              amount: parsed,
              note: note.trim() || undefined,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(data.error || "Failed to update credits");
          }
          onSaved?.(data);
          onClose();
          if (data.unchanged) {
            return "No change — balance unchanged";
          }
          if (mode === "set") {
            return `Balance set to ${data.credits} credits`;
          }
          return `${data.delta > 0 ? "Granted" : "Deducted"} ${Math.abs(data.delta)} credits`;
        },
        {
          loading: "Updating credits…",
          success: (msg) => msg,
          error: (err) => err.message || "Failed to update credits",
        }
      );
    } catch {
      /* toast.promise surfaces the error */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-neutral-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Adjust credits
            </p>
            <h2 className="text-lg font-semibold text-neutral-900">{user.name || user.email}</h2>
            <p className="text-sm text-neutral-600">{user.email}</p>
            <p className="mt-1 text-sm text-amber-800">
              <Coins className="inline w-4 h-4 mr-1 -mt-0.5" />
              Current balance: <strong>{currentCredits}</strong> credits
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("grant")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                mode === "grant"
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700"
              }`}
            >
              Add / subtract
            </button>
            <button
              type="button"
              onClick={() => setMode("set")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                mode === "set"
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-700"
              }`}
            >
              Set balance
            </button>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-neutral-700">
              {mode === "set" ? "New balance" : "Amount (+ grant, − deduct)"}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              placeholder={mode === "set" ? String(currentCredits) : "e.g. 50 or -10"}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              placeholder="Promo, support ticket, etc."
              maxLength={500}
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-neutral-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
