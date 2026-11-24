'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

function AlertBanner({ children, tone = 'amber', action }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    red: 'border-red-200 bg-red-50 text-red-900',
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${tones[tone] || tones.amber}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export default function DashboardAlerts({
  subscribed,
  walletError,
  partialError,
  partialErrors = [],
  needsExamUpdate,
  onRetry,
}) {
  const items = [];

  if (partialErrors.length > 0) {
    items.push(
      <AlertBanner key="partial-errors" tone="amber">
        Couldn’t load {partialErrors.join(', ')}. The rest of this page is still here.
      </AlertBanner>
    );
  }

  if (partialError) {
    items.push(
      <AlertBanner
        key="partial-error"
        tone="amber"
        action={
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        }
      >
        Some of this page could not be refreshed.
      </AlertBanner>
    );
  }

  if (subscribed) {
    items.push(
      <AlertBanner key="subscribed" tone="emerald">
        Unlimited practice is on.
      </AlertBanner>
    );
  }

  if (walletError) {
    items.push(
      <AlertBanner key="wallet" tone="red">
        {walletError}
      </AlertBanner>
    );
  }

  if (needsExamUpdate) {
    items.push(
      <AlertBanner
        key="exam-update"
        tone="amber"
        action={
          <Link
            href="/profile?redirect=/"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold"
          >
            Edit profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <span className="inline-flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Update your exams</span>
            <span className="mt-0.5 block text-amber-950/80">
              Pick from the active list so this page stays accurate.
            </span>
          </span>
        </span>
      </AlertBanner>
    );
  }

  if (!items.length) return null;

  return <div className="space-y-3">{items}</div>;
}
