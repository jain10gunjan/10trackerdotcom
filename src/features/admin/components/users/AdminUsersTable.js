"use client";

import { Coins, ChevronRight } from "lucide-react";
import { PURCHASE_META, formatMoneyPaise } from "./AdminUserDetailDrawer";
import { formatCategoryLabel, getUserCategories } from "./userCategories";

function AuthBadges({ sources = [] }) {
  const hasClerk = sources.includes("clerk");
  const hasOauth = sources.includes("oauth");

  return (
    <div className="flex flex-wrap gap-1">
      {hasClerk ? (
        <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
          Clerk
        </span>
      ) : null}
      {hasOauth ? (
        <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
          Google
        </span>
      ) : null}
    </div>
  );
}

function TierBadge({ tier, tierMeta }) {
  const meta = tierMeta?.[tier] || tierMeta?.never;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function PurchaseBadge({ status }) {
  const meta = PURCHASE_META[status] || PURCHASE_META.none;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersTable({
  users,
  onAdjustCredits,
  onSelectUser,
  emptyMessage,
  formatRelativeTime,
  tierMeta,
}) {
  if (!users.length) {
    return (
      <div className="py-12 text-center text-sm text-neutral-600">
        {emptyMessage || "No users found."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-100">
          <tr>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
              User
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden md:table-cell">
              Signed up
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden lg:table-cell">
              Contact
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
              Category
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
              Purchase
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden md:table-cell">
              Subscription
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden xl:table-cell">
              Engagement
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden xl:table-cell">
              Practice
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
              Credits
            </th>
            <th className="px-3 py-2.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const eng = u.engagement || {};
            const billing = u.billing || {};
            const activeSub = billing.activeSubscription;
            const phone = u.profile?.phoneNumber;
            const location = [u.profile?.city, u.profile?.state]
              .filter(Boolean)
              .join(", ");
            const categories = getUserCategories(u);
            const extraCategories = categories.all.filter(
              (c) => c !== categories.primary
            );

            return (
              <tr
                key={`${u.id}:${u.legacyId || ""}`}
                className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60 cursor-pointer"
                onClick={() => onSelectUser?.(u)}
              >
                <td className="px-4 sm:px-6 py-3 align-top min-w-[200px]">
                  <div className="flex items-start gap-3">
                    {u.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600 shrink-0">
                        {(u.name || u.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {u.name || u.email || u.id}
                      </p>
                      <p className="text-xs text-neutral-600 truncate">
                        {u.email ? (
                          <a
                            href={`mailto:${u.email}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {u.email}
                          </a>
                        ) : (
                          <span className="text-neutral-400">No email</span>
                        )}
                      </p>
                      <div className="mt-1">
                        <AuthBadges sources={u.authSources} />
                      </div>
                      {!u.profile && u.hasProfile === false ? (
                        <p className="text-[11px] text-amber-700 mt-1">No profile yet</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell whitespace-nowrap">
                  <p className="text-sm text-neutral-800">
                    {formatRelativeTime
                      ? formatRelativeTime(u.signedUpAt)
                      : formatShortDate(u.signedUpAt)}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {formatShortDate(u.signedUpAt)}
                  </p>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden lg:table-cell min-w-[120px]">
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      className="text-sm text-neutral-800 hover:underline tabular-nums"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {phone}
                    </a>
                  ) : (
                    <p className="text-sm text-neutral-400">—</p>
                  )}
                  {location ? (
                    <p className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                      {location}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-3 align-top min-w-[120px]">
                  {categories.primary ? (
                    <>
                      <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
                        {formatCategoryLabel(categories.primary)}
                      </span>
                      {extraCategories.length ? (
                        <p className="text-[11px] text-neutral-500 mt-1 truncate max-w-[160px]">
                          +{extraCategories.length}{" "}
                          {extraCategories
                            .slice(0, 2)
                            .map(formatCategoryLabel)
                            .join(", ")}
                          {extraCategories.length > 2 ? "…" : ""}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {categories.targets.includes(categories.primary)
                          ? "Profile"
                          : "From practice"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-400">—</p>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-3 align-top">
                  <PurchaseBadge status={billing.purchaseStatus || "none"} />
                  {(billing.totals?.orderCount || 0) > 0 ? (
                    <p className="text-[11px] text-neutral-500 mt-1 tabular-nums">
                      {billing.totals.completedCount} paid · {billing.totals.pendingCount} tried
                    </p>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell min-w-[140px]">
                  {activeSub ? (
                    <>
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {activeSub.planId}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Until {formatShortDate(activeSub.expiresAt)}
                      </p>
                      <p className="text-[11px] text-neutral-500 tabular-nums">
                        {formatMoneyPaise(activeSub.amountPaise)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-400">None</p>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden xl:table-cell">
                  <TierBadge tier={eng.tier} tierMeta={tierMeta} />
                  <p className="text-[11px] text-neutral-500 mt-1 tabular-nums">
                    Last {formatRelativeTime?.(eng.lastActiveAt) || "—"}
                  </p>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden xl:table-cell">
                  <p className="text-sm text-neutral-800 tabular-nums">
                    {u.usage?.totalCompleted ?? 0}
                    <span className="text-neutral-400 text-xs"> qs</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 tabular-nums">
                    Mocks {u.activity?.mockCompleted ?? 0}/{u.activity?.mockAttempts ?? 0}
                  </p>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top">
                  <p className="text-sm font-medium text-neutral-900 tabular-nums">
                    {u.wallet != null ? u.wallet.credits : "—"}
                  </p>
                  {u.email ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjustCredits?.(u);
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Adjust
                    </button>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-middle text-neutral-400">
                  <ChevronRight className="w-4 h-4" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
