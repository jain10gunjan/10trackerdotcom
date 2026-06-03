'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Check, Coins, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import SubscriptionCheckout from '@/components/credits/SubscriptionCheckout';
import BillingLegalPanel from '@/components/credits/BillingLegalPanel';
import { SUBSCRIPTION_PLANS, CREDIT_COST, SIGNUP_BONUS_CREDITS } from '@/lib/credits/constants';

function PricingContent() {
  const { isAuthenticated } = useAuth();
  const { credits, unlimited, subscription } = useCredits();
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed') === '1';
  const [termsAccepted, setTermsAccepted] = useState(false);

  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur p-6 sm:p-8 shadow-sm mb-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Plans & credits</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-2 tracking-tight">
            Unlimited prep, your way
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-2 max-w-2xl leading-relaxed">
            Every account gets a one-time {SIGNUP_BONUS_CREDITS} free credits (including existing
            users on first sign-in after this update). Practice costs {CREDIT_COST.practice_question}{' '}
            credit per new question; mock tests cost {CREDIT_COST.mock_test} credits per new test
            attempt. Subscriptions remove credit limits.
          </p>

          {isAuthenticated && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {unlimited ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <Sparkles className="w-4 h-4" />
                  Active: {subscription?.planName || 'Unlimited'} — renew before{' '}
                  {subscription?.expiresAt
                    ? new Date(subscription.expiresAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'expiry'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-100">
                  <Coins className="w-4 h-4" />
                  {credits} credits remaining
                </span>
              )}
            </div>
          )}

          {subscribed && (
            <p className="mt-4 text-sm text-emerald-700 font-medium">
              Payment successful — unlimited access is now active.
            </p>
          )}
        </div>

        <div className="mb-8">
          <BillingLegalPanel
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col"
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                  {plan.badge}
                </span>
              )}
              <h2 className="text-lg font-semibold text-neutral-900">{plan.name}</h2>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                ₹{plan.priceInr}
                <span className="text-sm font-normal text-neutral-500 ml-1">
                  {plan.durationHours
                    ? '/ 24 hours'
                    : `/ ${plan.durationDays} days`}
                </span>
              </p>
              <p className="text-sm text-neutral-600 mt-3 flex-1">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  Unlimited practice questions
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  Unlimited mock tests (5 credits/test without plan)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  Progress & analytics
                </li>
              </ul>
              <div className="mt-6">
                <SubscriptionCheckout planId={plan.id} termsAccepted={termsAccepted} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← Back to your progress
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 pt-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
