"use client";

import { X, Mail, Phone, MapPin, CreditCard, Coins, Calendar, BookOpen } from "lucide-react";
import { formatCategoryLabel, getUserCategories } from "./userCategories";

const PURCHASE_META = {
  purchased: {
    label: "Purchased",
    className: "bg-emerald-50 text-emerald-800 border-emerald-100",
  },
  tried: {
    label: "Tried checkout",
    className: "bg-amber-50 text-amber-900 border-amber-100",
  },
  none: {
    label: "No purchase",
    className: "bg-neutral-50 text-neutral-600 border-neutral-200",
  },
};

const ORDER_STATUS_META = {
  completed: "bg-emerald-50 text-emerald-800 border-emerald-100",
  active: "bg-emerald-50 text-emerald-800 border-emerald-100",
  pending: "bg-amber-50 text-amber-900 border-amber-100",
  failed: "bg-red-50 text-red-800 border-red-100",
};

function formatMoneyPaise(paise) {
  const n = Number(paise);
  if (!Number.isFinite(n)) return "—";
  return `₹${(n / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceLabel(source) {
  if (source === "subscription") return "Subscription";
  if (source === "roadmap") return "Roadmap";
  if (source === "legacy") return "Legacy plan";
  return source || "Order";
}

export default function AdminUserDetailDrawer({
  user,
  open,
  onClose,
  onAdjustCredits,
  formatRelativeTime,
}) {
  if (!open || !user) return null;

  const profile = user.profile || {};
  const billing = user.billing || {};
  const purchaseMeta =
    PURCHASE_META[billing.purchaseStatus] || PURCHASE_META.none;
  const activeSub = billing.activeSubscription;
  const orders = billing.orders || [];
  const phone = profile.phoneNumber;
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");
  const categories = getUserCategories(user);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl border-l border-neutral-200">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0 flex items-start gap-3">
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="h-11 w-11 rounded-full object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-600 shrink-0">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-neutral-900 truncate">
                {user.name || user.email || user.id}
              </h2>
              <p className="text-sm text-neutral-600 truncate">{user.email || "No email"}</p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${purchaseMeta.className}`}
              >
                {purchaseMeta.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <section className="rounded-2xl border border-neutral-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Contact & signup
            </h3>
            <div className="space-y-2 text-sm">
              {user.email ? (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-2 text-neutral-800 hover:underline"
                >
                  <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                  {user.email}
                </a>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-neutral-800 hover:underline"
                >
                  <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                  {phone}
                </a>
              ) : (
                <p className="flex items-center gap-2 text-neutral-500">
                  <Phone className="h-4 w-4 text-neutral-300 shrink-0" />
                  No phone on file
                </p>
              )}
              {location ? (
                <p className="flex items-center gap-2 text-neutral-800">
                  <MapPin className="h-4 w-4 text-neutral-400 shrink-0" />
                  {location}
                </p>
              ) : null}
              <p className="flex items-center gap-2 text-neutral-800">
                <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
                Signed up{" "}
                {formatRelativeTime
                  ? formatRelativeTime(user.signedUpAt)
                  : formatDateTime(user.signedUpAt)}
                <span className="text-neutral-400 text-xs">
                  ({formatDateTime(user.signedUpAt)})
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Categories
            </h3>
            {categories.primary ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[11px] text-neutral-400 mb-1">Primary</p>
                  <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-800">
                    {formatCategoryLabel(categories.primary)}
                  </span>
                </div>
                {categories.targets.length ? (
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-1">Profile targets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.targets.map((c) => (
                        <span
                          key={`t-${c}`}
                          className="rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800"
                        >
                          {formatCategoryLabel(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {categories.practiced.length ? (
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-1">Practiced</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.practiced.map((c) => (
                        <span
                          key={`p-${c}`}
                          className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                        >
                          {formatCategoryLabel(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No category on profile or practice yet</p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Wallet
              </h3>
              {user.email ? (
                <button
                  type="button"
                  onClick={() => onAdjustCredits?.(user)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:underline"
                >
                  <Coins className="h-3.5 w-3.5" />
                  Adjust credits
                </button>
              ) : null}
            </div>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">
              {user.wallet != null ? user.wallet.credits : "—"}
              <span className="ml-1 text-sm font-normal text-neutral-500">credits</span>
            </p>
            {user.wallet?.signupBonusGranted ? (
              <p className="text-xs text-emerald-700">Signup bonus granted</p>
            ) : (
              <p className="text-xs text-neutral-500">No signup bonus flagged</p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Active subscription
            </h3>
            {activeSub ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-neutral-900">{activeSub.planId}</p>
                <p className="text-neutral-600">
                  Expires {formatDateTime(activeSub.expiresAt)}
                </p>
                <p className="text-neutral-600 tabular-nums">
                  {formatMoneyPaise(activeSub.amountPaise)}
                </p>
                {activeSub.razorpayPaymentId ? (
                  <p className="text-[11px] text-neutral-400 break-all">
                    Payment: {activeSub.razorpayPaymentId}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No active subscription</p>
            )}

            {(billing.subscriptions || []).length > 1 ? (
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                  All subscriptions
                </p>
                {(billing.subscriptions || []).map((sub) => (
                  <div
                    key={sub.id || `${sub.planId}-${sub.createdAt}`}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-neutral-800 truncate">{sub.planId}</span>
                    <span className="text-neutral-500 shrink-0">
                      {sub.status} · {formatRelativeTime?.(sub.expiresAt) || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Orders & attempts
              </h3>
              <span className="text-xs text-neutral-500 tabular-nums">
                {billing.totals?.completedCount ?? 0} paid ·{" "}
                {billing.totals?.pendingCount ?? 0} tried
              </span>
            </div>

            {!orders.length ? (
              <p className="text-sm text-neutral-500">No checkout attempts yet</p>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => {
                  const statusKey = String(order.status || "").toLowerCase();
                  const statusClass =
                    ORDER_STATUS_META[statusKey] ||
                    "bg-neutral-50 text-neutral-600 border-neutral-200";
                  return (
                    <li
                      key={`${order.source}-${order.id || order.razorpayOrderId || order.at}`}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {sourceLabel(order.source)} · {order.planId || "—"}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {formatDateTime(order.at || order.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}
                        >
                          {order.status || "unknown"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm tabular-nums text-neutral-800">
                        {formatMoneyPaise(order.amountPaise)}
                      </p>
                      {order.razorpayOrderId ? (
                        <p className="mt-1 text-[11px] text-neutral-400 break-all">
                          Order: {order.razorpayOrderId}
                        </p>
                      ) : null}
                      {order.razorpayPaymentId ? (
                        <p className="text-[11px] text-neutral-400 break-all">
                          Payment: {order.razorpayPaymentId}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {(billing.totals?.revenuePaise || 0) > 0 ? (
              <p className="text-xs text-neutral-600 border-t border-neutral-100 pt-3">
                Lifetime paid:{" "}
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatMoneyPaise(billing.totals.revenuePaise)}
                </span>
              </p>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}

export { PURCHASE_META, formatMoneyPaise };
