'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Flame, Coins, Infinity } from 'lucide-react';

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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

function StatusPill({ icon: Icon, label, accent = 'neutral' }) {
  const styles = {
    streak: 'bg-orange-50 border-orange-100 text-orange-800',
    credits: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tabular-nums ${styles[accent] || styles.neutral}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </span>
  );
}

export default function DashboardPageHeader({
  displayName,
  user,
  profile,
  streak,
  credits,
  unlimited,
  loading = false,
}) {
  const firstName = String(displayName || 'there').split(/\s+/)[0];
  const avatarUrl = profile?.avatarUrl || user?.image || null;
  const currentStreak = streak?.currentStreak ?? 0;

  if (loading) {
    return (
      <header className="animate-pulse">
        <div className="flex items-center gap-3">
          <div className="lg:hidden w-11 h-11 rounded-xl bg-neutral-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-neutral-200 rounded" />
            <div className="h-7 w-48 max-w-full bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-7 w-24 bg-neutral-200 rounded-full" />
          <div className="h-7 w-28 bg-neutral-200 rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header>
      <div className="flex items-start gap-3 sm:gap-4">
        <Link
          href="/profile?redirect=/"
          className="lg:hidden shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center hover:border-neutral-300 transition-colors"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={44}
              height={44}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-sm font-semibold text-neutral-600">
              {initials(displayName, user?.email)}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {greetingForHour()}
          </p>
          <h1 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 truncate">
            Welcome back, {firstName}
          </h1>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill
          icon={Flame}
          accent="streak"
          label={
            currentStreak > 0
              ? `${currentStreak} day streak`
              : 'Start your streak today'
          }
        />
        <StatusPill
          icon={unlimited ? Infinity : Coins}
          accent="credits"
          label={
            unlimited
              ? 'Unlimited plan'
              : credits != null
                ? `${credits.toLocaleString()} credits`
                : 'Credits'
          }
        />
      </div>
    </header>
  );
}
