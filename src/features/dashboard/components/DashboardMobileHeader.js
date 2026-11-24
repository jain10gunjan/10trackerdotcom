'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Flame, Coins, Infinity, ChevronRight } from 'lucide-react';

function initials(name, email) {
  const n = String(name || '').trim();
  if (n) {
    const parts = n.split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : n.slice(0, 2).toUpperCase();
  }
  return String(email || '?').slice(0, 2).toUpperCase();
}

export default function DashboardMobileHeader({
  user,
  profile,
  streak,
  credits,
  unlimited,
  loading = false,
}) {
  const displayName =
    profile?.displayName ||
    user?.name ||
    user?.fullName ||
    user?.email?.split('@')[0] ||
    'Student';
  const avatarUrl = profile?.avatarUrl || user?.image || null;

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm lg:hidden"
        aria-hidden
      >
        <div className="flex min-h-11 items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-[#E8EDF8]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 max-w-full rounded bg-neutral-200" />
            <div className="h-3 w-24 max-w-full rounded bg-[#E8EDF8]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/profile?redirect=/"
      className="group flex min-h-11 items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-[#3F5EB9]/30 hover:bg-[#E8EDF8]/40 lg:hidden"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-[#E8EDF8]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-sm font-semibold text-[#3F5EB9]">
            {initials(displayName, user?.email)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Flame className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">
              {streak?.currentStreak
                ? `${streak.currentStreak} day streak`
                : 'Start your streak'}
            </span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            {unlimited ? (
              <Infinity className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <Coins className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            )}
            <span className="truncate">
              {unlimited ? 'Unlimited' : credits != null ? `${credits} credits` : '—'}
            </span>
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-[#3F5EB9]" />
    </Link>
  );
}
