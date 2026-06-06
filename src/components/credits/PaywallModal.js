'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, Coins, Sparkles } from 'lucide-react';
import { useCredits } from '@/context/CreditsContext';
import { CREDIT_COST, SIGNUP_BONUS_CREDITS } from '@/lib/credits/constants';

export default function PaywallModal() {
  const {
    showPaywall,
    setShowPaywall,
    credits,
    costs,
    signupBonus,
    signupBonusGranted,
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

  // Refresh wallet when paywall opens so bonus/costs match admin DB settings
  useEffect(() => {
    if (!showPaywall) return;
    refreshWallet();
  }, [showPaywall, refreshWallet]);

  if (!showPaywall) return null;

  const practiceCost = costs?.practice_question ?? CREDIT_COST.practice_question;
  const mockCost = costs?.mock_test ?? CREDIT_COST.mock_test;
  const bonusCredits =
    typeof signupBonus === 'number' && !Number.isNaN(signupBonus)
      ? signupBonus
      : SIGNUP_BONUS_CREDITS;

  const showSignupPromo = !signupBonusGranted && bonusCredits > 0;

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
            <Coins className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h2 id="paywall-title" className="text-xl font-semibold text-neutral-900">
              Credits exhausted
            </h2>
            <p className="text-sm text-neutral-600">
              You have <span className="font-semibold tabular-nums">{credits}</span> credits left
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
          Practice uses {practiceCost} credit per new question. Mock tests use {mockCost} credits
          once per test (retakes are free). Get unlimited access with a subscription — secure
          payment via Razorpay.
        </p>

        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 mb-6 text-xs text-neutral-600 space-y-1">
          {showSignupPromo ? (
            <p className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              One-time {bonusCredits} free credits for every account (claim on sign-in)
            </p>
          ) : (
            <p className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              Subscribe for unlimited practice and mock tests
            </p>
          )}
          <p>Payments are processed securely. GST invoice available on request.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            onClick={() => setShowPaywall(false)}
            className="w-full text-center px-6 py-3 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors"
          >
            View plans & subscribe
          </Link>
          <button
            type="button"
            onClick={() => setShowPaywall(false)}
            className="w-full px-6 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
