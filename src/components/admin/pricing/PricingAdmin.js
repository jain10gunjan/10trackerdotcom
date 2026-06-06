"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Coins, CreditCard, Loader2, Map, Save } from "lucide-react";
import { parseJsonResponse, toastPromise } from "@/lib/toastAsync";

function emptyCreditForm() {
  return {
    signup_bonus_credits: 60,
    practice_question_cost: 1,
    mock_test_cost: 5,
  };
}

export default function PricingAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupHint, setSetupHint] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [creditSettings, setCreditSettings] = useState(emptyCreditForm());
  const [plans, setPlans] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing", { credentials: "include" });
      const data = await parseJsonResponse(res);
      if (!data.success) {
        throw new Error(data.setupHint ? `${data.error}\n${data.setupHint}` : data.error);
      }
      setSetupHint(data.setupHint || null);
      setUsingFallback(Boolean(data.usingFallback));
      setCreditSettings({
        signup_bonus_credits: data.creditSettings?.signup_bonus_credits ?? 60,
        practice_question_cost: data.creditSettings?.practice_question_cost ?? 1,
        mock_test_cost: data.creditSettings?.mock_test_cost ?? 5,
      });
      setPlans(
        (data.plans || []).map((p) => ({
          id: p.id,
          name: p.name || "",
          description: p.description || "",
          price_inr: p.price_inr ?? 0,
          duration_hours: p.duration_hours ?? "",
          duration_days: p.duration_days ?? "",
          badge: p.badge || "",
          is_active: p.is_active !== false,
          sort_order: p.sort_order ?? 0,
        }))
      );
    } catch (e) {
      toast.error(e.message || "Failed to load pricing", { duration: 8000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  useEffect(() => {
    fetch("/api/admin/roadmaps", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRoadmaps(data.roadmaps || []);
      })
      .catch(() => {});
  }, []);

  const updatePlan = (id, field, value) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await toastPromise(
        async () => {
          const payload = {
            creditSettings: {
              signup_bonus_credits: Number(creditSettings.signup_bonus_credits),
              practice_question_cost: Number(creditSettings.practice_question_cost),
              mock_test_cost: Number(creditSettings.mock_test_cost),
            },
            plans: plans.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price_inr: Number(p.price_inr),
              duration_hours:
                p.duration_hours === "" || p.duration_hours == null
                  ? null
                  : Number(p.duration_hours),
              duration_days:
                p.duration_days === "" || p.duration_days == null
                  ? null
                  : Number(p.duration_days),
              badge: p.badge || null,
              is_active: Boolean(p.is_active),
              sort_order: Number(p.sort_order) || 0,
            })),
          };

          const res = await fetch("/api/admin/pricing", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(
              data.setupHint ? `${data.error}\n${data.setupHint}` : data.error
            );
          }
          setUsingFallback(false);
          setSetupHint(null);
          await fetchPricing();
        },
        {
          loading: "Saving pricing…",
          success: "Pricing updated",
          error: (e) => e.message || "Save failed",
        }
      );
    } catch {
      /* toast.promise surfaces the error */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading pricing…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Pricing & credits</h1>
        <p className="mt-1 text-sm text-neutral-600 max-w-2xl">
          Manage credit costs and subscription plans. Changes apply to new purchases and new
          credit charges immediately. Existing subscriptions keep their paid amount and expiry.
        </p>
        {(setupHint || usingFallback) && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {usingFallback
              ? "Showing fallback values from code — run the SQL setup to persist edits in the database."
              : null}
            {setupHint ? (
              <span className="block mt-1 font-mono text-xs">{setupHint}</span>
            ) : null}
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Credit costs</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Signup bonus</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={creditSettings.signup_bonus_credits}
              onChange={(e) =>
                setCreditSettings((s) => ({
                  ...s,
                  signup_bonus_credits: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
            <span className="text-xs text-neutral-500">One-time per account (first wallet load)</span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Practice question</span>
            <input
              type="number"
              min={0}
              max={100}
              value={creditSettings.practice_question_cost}
              onChange={(e) =>
                setCreditSettings((s) => ({
                  ...s,
                  practice_question_cost: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Mock test attempt</span>
            <input
              type="number"
              min={0}
              max={500}
              value={creditSettings.mock_test_cost}
              onChange={(e) =>
                setCreditSettings((s) => ({ ...s, mock_test_cost: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Subscription plans</h2>
        </div>
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-neutral-200 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-neutral-500">{plan.id}</p>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={plan.is_active}
                    onChange={(e) => updatePlan(plan.id, "is_active", e.target.checked)}
                  />
                  Active on pricing page
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-neutral-700">Name</span>
                  <input
                    value={plan.name}
                    onChange={(e) => updatePlan(plan.id, "name", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-neutral-700">Description</span>
                  <textarea
                    value={plan.description}
                    onChange={(e) => updatePlan(plan.id, "description", e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700">Price (INR)</span>
                  <input
                    type="number"
                    min={1}
                    value={plan.price_inr}
                    onChange={(e) => updatePlan(plan.id, "price_inr", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700">Badge</span>
                  <input
                    value={plan.badge}
                    onChange={(e) => updatePlan(plan.id, "badge", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="Popular"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700">Duration (hours)</span>
                  <input
                    type="number"
                    min={1}
                    value={plan.duration_hours}
                    onChange={(e) => {
                      updatePlan(plan.id, "duration_hours", e.target.value);
                      if (e.target.value) updatePlan(plan.id, "duration_days", "");
                    }}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="24 for day pass"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700">Duration (days)</span>
                  <input
                    type="number"
                    min={1}
                    value={plan.duration_days}
                    onChange={(e) => {
                      updatePlan(plan.id, "duration_days", e.target.value);
                      if (e.target.value) updatePlan(plan.id, "duration_hours", "");
                    }}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                    placeholder="90 for 3 months"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700">Sort order</span>
                  <input
                    type="number"
                    value={plan.sort_order}
                    onChange={(e) => updatePlan(plan.id, "sort_order", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Map className="w-5 h-5" />
              Roadmap products
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              One-time Razorpay purchases — edit price and content in Roadmaps admin.
            </p>
          </div>
          <Link
            href="/admin/roadmaps"
            className="text-sm font-medium text-neutral-900 underline shrink-0"
          >
            Manage roadmaps →
          </Link>
        </div>
        {roadmaps.length === 0 ? (
          <p className="text-sm text-neutral-500">No roadmaps configured yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 text-sm">
            {roadmaps.map((r) => (
              <li key={r.id} className="py-2 flex justify-between gap-4">
                <span className="font-medium text-neutral-900">{r.title}</span>
                <span className="text-neutral-600 tabular-nums shrink-0">
                  ₹{r.price_inr} · {r.free_preview_days} preview days
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save pricing
        </button>
      </div>
    </div>
  );
}
