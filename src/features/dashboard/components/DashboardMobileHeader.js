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
      <div className="lg:hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-neutral-200 rounded" />
            <div className="h-3 w-24 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/profile?redirect=/"
      className="lg:hidden group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={48}
            height={48}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-sm font-semibold text-neutral-600">
            {initials(displayName, user?.email)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            {streak?.currentStreak
              ? `${streak.currentStreak} day streak`
              : 'Start your streak'}
          </span>
          <span className="inline-flex items-center gap-1">
            {unlimited ? (
              <Infinity className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Coins className="w-3.5 h-3.5 text-amber-600" />
            )}
            {unlimited ? 'Unlimited' : credits != null ? `${credits} credits` : '—'}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
    </Link>
  );
}
