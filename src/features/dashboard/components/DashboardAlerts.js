'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

function AlertBanner({ children, tone = 'amber', action }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    red: 'border-red-100 bg-red-50 text-red-700',
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${tones[tone] || tones.amber}`}
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
        Some sections could not load: {partialErrors.join(', ')}. Other data is still shown
        below.
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
            className="inline-flex items-center gap-1.5 font-semibold underline shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        }
      >
        Some dashboard data could not be refreshed.
      </AlertBanner>
    );
  }

  if (subscribed) {
    items.push(
      <AlertBanner key="subscribed" tone="emerald">
        Subscription active — enjoy unlimited practice and mock tests.
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
            className="inline-flex items-center gap-1 font-semibold underline shrink-0"
          >
            Edit profile <ArrowRight className="w-4 h-4" />
          </Link>
        }
      >
        <span className="inline-flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <span className="font-medium">Update your exam selection</span>
            <span className="block text-amber-800/90 mt-0.5">
              Choose your exam(s) from the active list so your dashboard stays accurate.
            </span>
          </span>
        </span>
      </AlertBanner>
    );
  }

  if (!items.length) return null;

  return <div className="space-y-3">{items}</div>;
}
