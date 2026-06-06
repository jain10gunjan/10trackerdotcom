"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Users,
  AlertCircle,
  Loader2,
  TrendingUp,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
import AdminUsersTable from "./AdminUsersTable";

const TIER_META = {
  regular: { label: "Regular", className: "bg-emerald-50 text-emerald-800 border-emerald-100" },
  returning: { label: "Returning", className: "bg-sky-50 text-sky-800 border-sky-100" },
  new: { label: "New", className: "bg-violet-50 text-violet-800 border-violet-100" },
  at_risk: { label: "At risk", className: "bg-amber-50 text-amber-900 border-amber-100" },
  dormant: { label: "Dormant", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  never: { label: "No activity", className: "bg-neutral-50 text-neutral-500 border-neutral-200" },
};

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function filterAndSortUsers(users, { search, areaFilter, authFilter, tierFilter, sortBy }) {
  const q = search.trim().toLowerCase();
  let list = users;

  if (tierFilter !== "all") {
    list = list.filter((u) => u.engagement?.tier === tierFilter);
  }

  if (authFilter === "clerk") {
    list = list.filter((u) => (u.authSources || []).includes("clerk"));
  } else if (authFilter === "oauth") {
    list = list.filter((u) => (u.authSources || []).includes("oauth") && !(u.authSources || []).includes("clerk"));
  } else if (authFilter === "both") {
    list = list.filter((u) => (u.authSources || []).length > 1);
  }

  if (areaFilter !== "all") {
    list = list.filter((u) => u.usage?.areas?.some((a) => a.area === areaFilter));
  }

  if (q) {
    list = list.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      const id = (u.id || "").toLowerCase();
      const legacy = (u.legacyId || "").toLowerCase();
      return email.includes(q) || name.includes(q) || id.includes(q) || legacy.includes(q);
    });
  }

  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sortBy === "practice") {
      return (b.usage?.totalCompleted || 0) - (a.usage?.totalCompleted || 0);
    }
    if (sortBy === "active_days") {
      return (b.engagement?.activeDays30 || 0) - (a.engagement?.activeDays30 || 0);
    }
    if (sortBy === "credits") {
      return (b.wallet?.credits || 0) - (a.wallet?.credits || 0);
    }
    const aTime = a.engagement?.lastActiveAt || a.lastSignInAt || "";
    const bTime = b.engagement?.lastActiveAt || b.lastSignInAt || "";
    return String(bTime).localeCompare(String(aTime));
  });

  return sorted;
}

function StatCard({ icon: Icon, label, value, hint, tone = "neutral" }) {
  const tones = {
    neutral: "border-neutral-200 bg-white",
    emerald: "border-emerald-100 bg-emerald-50/50",
    sky: "border-sky-100 bg-sky-50/50",
    amber: "border-amber-100 bg-amber-50/50",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.neutral}`}>
      <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wide">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-neutral-900 tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

export default function AdminUsersDashboard({
  users,
  summary,
  counts,
  fetching,
  error,
  clerkWarning,
  onAdjustCredits,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("last_active");

  const allAreas = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      u.usage?.areas?.forEach((a) => {
        if (a.area) set.add(a.area);
      });
    });
    return Array.from(set).sort();
  }, [users]);

  const filtered = useMemo(
    () =>
      filterAndSortUsers(users, {
        search,
        areaFilter,
        authFilter,
        tierFilter,
        sortBy,
      }),
    [users, search, areaFilter, authFilter, tierFilter, sortBy]
  );

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-700" />
            User progress dashboard
          </h1>
          <p className="text-sm text-neutral-600 max-w-2xl mt-1">
            Merged Clerk + Google users (one row per email). Track who is practicing regularly,
            returning, or going dormant.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={fetching}
          className="self-start rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
        >
          {fetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {clerkWarning && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Clerk legacy fetch: {clerkWarning}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Total users" value={summary?.total ?? users.length} />
        <StatCard
          icon={TrendingUp}
          label="Active (7d)"
          value={summary?.activeLast7 ?? 0}
          hint="At least 1 practice/mock day"
          tone="emerald"
        />
        <StatCard
          icon={UserCheck}
          label="Regular"
          value={summary?.regular ?? 0}
          hint="3+ active days in 14d"
          tone="sky"
        />
        <StatCard
          icon={UserX}
          label="At risk + dormant"
          value={(summary?.at_risk ?? 0) + (summary?.dormant ?? 0)}
          hint={`${summary?.never ?? 0} never practiced`}
          tone="amber"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-violet-50 text-violet-800 px-2.5 py-1 border border-violet-100">
          Clerk: {counts?.clerkOnly ?? 0}
        </span>
        <span className="rounded-full bg-sky-50 text-sky-800 px-2.5 py-1 border border-sky-100">
          Google only: {counts?.oauthOnly ?? 0}
        </span>
        <span className="rounded-full bg-neutral-100 text-neutral-700 px-2.5 py-1 border border-neutral-200">
          Both: {counts?.both ?? 0}
        </span>
      </div>

      <div className="flex flex-col xl:flex-row gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, id…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-xl bg-white"
        >
          <option value="all">All engagement</option>
          <option value="regular">Regular</option>
          <option value="returning">Returning</option>
          <option value="new">New</option>
          <option value="at_risk">At risk</option>
          <option value="dormant">Dormant</option>
          <option value="never">No activity</option>
        </select>
        <select
          value={authFilter}
          onChange={(e) => setAuthFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-xl bg-white"
        >
          <option value="all">All auth</option>
          <option value="clerk">Clerk (incl. merged)</option>
          <option value="oauth">Google only</option>
          <option value="both">Clerk + Google</option>
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-xl bg-white"
        >
          <option value="all">All categories</option>
          {allAreas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-xl bg-white"
        >
          <option value="last_active">Sort: last active</option>
          <option value="active_days">Sort: active days (30d)</option>
          <option value="practice">Sort: questions done</option>
          <option value="credits">Sort: credits</option>
        </select>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {Object.entries(TIER_META).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTierFilter(tierFilter === key ? "all" : key)}
            className={`text-xs rounded-full border px-2.5 py-1 font-medium transition ${
              tierFilter === key ? meta.className : "bg-white text-neutral-600 border-neutral-200"
            }`}
          >
            {meta.label}
            <span className="ml-1 tabular-nums opacity-70">{summary?.[key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-100 px-4 sm:px-6 py-3 text-xs sm:text-sm text-neutral-600 flex items-center justify-between">
          <span>
            {fetching
              ? "Loading…"
              : `${filtered.length} of ${users.length} user${users.length === 1 ? "" : "s"}`}
          </span>
          <span className="hidden sm:inline text-neutral-400">
            <Sparkles className="inline w-3.5 h-3.5 mr-1" />
            Engagement from practice + mock tests
          </span>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-neutral-700 animate-spin mr-2" />
            <span className="text-sm text-neutral-700">Building dashboard…</span>
          </div>
        ) : (
          <AdminUsersTable
            users={filtered}
            onAdjustCredits={onAdjustCredits}
            emptyMessage="No users match the current filters."
            formatRelativeTime={formatRelativeTime}
            tierMeta={TIER_META}
          />
        )}
      </div>
    </div>
  );
}
