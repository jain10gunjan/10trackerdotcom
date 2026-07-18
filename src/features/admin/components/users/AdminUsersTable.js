"use client";

import { Coins } from "lucide-react";

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

export default function AdminUsersTable({
  users,
  onAdjustCredits,
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
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
              Engagement
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden md:table-cell">
              Last active
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden lg:table-cell">
              Active days
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden md:table-cell">
              Practice
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap hidden lg:table-cell">
              Mock tests
            </th>
            <th className="px-4 sm:px-6 py-2.5 font-semibold text-neutral-700 whitespace-nowrap">
              Credits
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const eng = u.engagement || {};
            const lastActive = eng.lastActiveAt;
            const lastSignIn = u.activity?.lastSignInAt || u.lastSignInAt;
            return (
              <tr
                key={`${u.id}:${u.legacyId || ""}`}
                className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60"
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
                          <a href={`mailto:${u.email}`} className="hover:underline">
                            {u.email}
                          </a>
                        ) : (
                          <span className="text-neutral-400">No email</span>
                        )}
                      </p>
                      <div className="mt-1">
                        <AuthBadges sources={u.authSources} />
                      </div>
                      {u.hasProfile === false ? (
                        <p className="text-[11px] text-amber-700 mt-1">No profile yet</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top">
                  <TierBadge tier={eng.tier} tierMeta={tierMeta} />
                  <p className="text-[11px] text-neutral-500 mt-1 tabular-nums">
                    7d: {eng.activeDays7 ?? 0} · 30d: {eng.activeDays30 ?? 0}
                  </p>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell whitespace-nowrap">
                  <p className="text-sm text-neutral-800">
                    {formatRelativeTime ? formatRelativeTime(lastActive) : "—"}
                  </p>
                  {!lastActive && lastSignIn ? (
                    <p className="text-[11px] text-neutral-400">
                      Signed in {formatRelativeTime?.(lastSignIn)}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden lg:table-cell tabular-nums text-neutral-800">
                  {eng.activeDays30 ?? 0}
                  <span className="text-neutral-400 text-xs"> / 30d</span>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden md:table-cell">
                  <p className="text-sm text-neutral-800 tabular-nums">
                    {u.usage?.totalCompleted ?? 0}
                    <span className="text-neutral-400 text-xs"> qs</span>
                  </p>
                  {u.usage?.areas?.length ? (
                    <p className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                      {u.usage.areas.map((a) => a.area).slice(0, 2).join(", ")}
                      {u.usage.areas.length > 2 ? "…" : ""}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-3 align-top hidden lg:table-cell tabular-nums text-neutral-800">
                  {u.activity?.mockCompleted ?? 0}
                  <span className="text-neutral-400 text-xs">
                    {" "}
                    / {u.activity?.mockAttempts ?? 0}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 align-top">
                  <p className="text-sm font-medium text-neutral-900 tabular-nums">
                    {u.wallet != null ? u.wallet.credits : "—"}
                  </p>
                  {u.email ? (
                    <button
                      type="button"
                      onClick={() => onAdjustCredits(u)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Adjust
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
