"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { parseJsonResponse, toastPromise } from "@/lib/toastAsync";
import { SUBSCRIPTION_PLANS } from "@/features/credits/lib/constants";

const FALLBACK_PLANS = Object.values(SUBSCRIPTION_PLANS);

export default function AdminAssignSubscriptionModal({ user, open, onClose, onSaved }) {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [planId, setPlanId] = useState(FALLBACK_PLANS[1]?.id || FALLBACK_PLANS[0]?.id || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setPlanId(FALLBACK_PLANS[1]?.id || FALLBACK_PLANS[0]?.id || "");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/pricing", { credentials: "include" });
        const data = await res.json();
        const rows = (data?.plans || [])
          .filter((plan) => plan.is_active !== false)
          .map((plan) => ({
            id: plan.id,
            name: plan.name,
            priceInr: plan.price_inr,
            durationHours: plan.duration_hours,
            durationDays: plan.duration_days,
          }));
        if (!cancelled && rows.length) {
          setPlans(rows);
          setPlanId((current) => (rows.some((plan) => plan.id === current) ? current : rows[0].id));
        }
      } catch {
        /* keep the built-in plans */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user?.email]);

  if (!open || !user) return null;

  const selected = plans.find((plan) => plan.id === planId) || plans[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email) {
      toast.error("User has no email — cannot assign a plan");
      return;
    }
    if (!planId) {
      toast.error("Choose a plan");
      return;
    }

    setSaving(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch("/api/admin/subscriptions", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user.email,
              planId,
              note: note.trim() || undefined,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(data.error || "Failed to assign subscription");
          }
          onSaved?.(data);
          onClose();
          return `Assigned ${data.planName || data.planId}. Logged at ₹0 paid.`;
        },
        {
          loading: "Assigning plan…",
          success: (msg) => msg,
          error: (err) => err.message || "Failed to assign subscription",
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
              Assign subscription
            </p>
            <h2 className="text-lg font-semibold text-neutral-900">{user.name || user.email}</h2>
            <p className="text-sm text-neutral-600">{user.email}</p>
            <p className="mt-1 text-sm text-neutral-600">
              <CreditCard className="inline w-4 h-4 mr-1 -mt-0.5" />
              No Razorpay charge. The grant is logged for the month and year report.
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
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Plan</span>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 bg-white"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · ₹{plan.priceInr}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <p className="text-xs text-neutral-500">
              Cash recorded: ₹0. List price logged: ₹{selected.priceInr}. That list price is not added to revenue.
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              placeholder="Support, promo, founder access…"
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
            Assign
          </button>
        </div>
      </form>
    </div>
  );
}
