'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { useCredits } from '@/context/CreditsContext';

export default function PaywallModal() {
  const {
    showPaywall,
    setShowPaywall,
    freeCreditsEnabled,
    refreshWallet,
  } = useCredits();

  useEffect(() => {
    if (!showPaywall) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowPaywall(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPaywall, setShowPaywall]);

  useEffect(() => {
    if (!showPaywall) return;
    refreshWallet();
  }, [showPaywall, refreshWallet]);

  if (!showPaywall) return null;

  const payToPlay = freeCreditsEnabled === false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl p-6 sm:p-8">
        <button
          type="button"
          onClick={() => setShowPaywall(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h2 id="paywall-title" className="text-xl font-semibold text-neutral-900">
              {payToPlay ? 'Subscription required' : 'Credits exhausted'}
            </h2>
            <p className="text-sm text-neutral-600">
              {payToPlay
                ? 'Practice and mock tests need an active plan'
                : 'Choose a plan for unlimited access'}
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
          {payToPlay
            ? 'OG Trackers stay free. Practice, mocks, and the AI playlist builder unlock with a plan. The 24-hour pass covers practice and mocks; 3-month and 6-month plans also include AI builds.'
            : 'Get unlimited practice and mock tests with a subscription — secure payment via Razorpay.'}
        </p>

        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 mb-6 text-xs text-neutral-600 space-y-1">
          <p>Payments are processed securely. GST invoice available on request.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            onClick={() => setShowPaywall(false)}
            className="w-full inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white text-sm font-semibold py-3 hover:bg-neutral-800"
          >
            View plans
          </Link>
          <button
            type="button"
            onClick={() => setShowPaywall(false)}
            className="w-full text-sm text-neutral-500 hover:text-neutral-800 py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
