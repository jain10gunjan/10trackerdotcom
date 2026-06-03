'use client';

import Link from 'next/link';
import { Coins, Infinity } from 'lucide-react';
import { useCredits } from '@/context/CreditsContext';

export default function WalletBar({ compact = false }) {
  const { loading, credits, unlimited, subscription, walletReady } = useCredits();

  if (loading && !walletReady) {
    return (
      <span
        className={`inline-block rounded-xl bg-neutral-100 animate-pulse ${
          compact ? 'h-8 w-20' : 'h-10 w-24'
        }`}
        aria-hidden
      />
    );
  }

  if (unlimited) {
    const expires = subscription?.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    return (
      <Link
        href="/pricing"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <Infinity className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="font-semibold">Unlimited</span>
        {expires && !compact && (
          <span className="text-emerald-700/80 text-xs">until {expires}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/pricing"
      className={`inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors ${
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
      }`}
      title="View credits & plans"
    >
      <Coins className={compact ? 'w-3.5 h-3.5 text-amber-600' : 'w-4 h-4 text-amber-600'} />
      <span className="font-semibold tabular-nums">{credits}</span>
      <span className="text-neutral-500">credits</span>
    </Link>
  );
}
