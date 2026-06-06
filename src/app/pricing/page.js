'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Check, Coins, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import SubscriptionCheckout from '@/components/credits/SubscriptionCheckout';
import PricingTermsCheckbox from '@/components/credits/PricingTermsCheckbox';
import SellerDetailsFooter from '@/components/credits/SellerDetailsFooter';
import { SUBSCRIPTION_PLANS } from '@/lib/credits/constants';

function PricingContent() {
  const { isAuthenticated } = useAuth();
  const { credits, unlimited, subscription, planList, plans } = useCredits();
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed') === '1';
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVersion, setTermsVersion] = useState('');

  useEffect(() => {
    fetch('/api/billing/legal')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.termsVersion) {
          setTermsVersion(data.termsVersion);
        }
      })
      .catch(() => {});
  }, []);

  const displayPlans = (planList || Object.values(plans || SUBSCRIPTION_PLANS)).filter(
    (p) => p.isActive !== false
  );

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            Plans & pricing
          </h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-xl">
            One-time purchase — unlimited practice and mock tests for the plan duration. No
            auto-renewal.
          </p>
          <p className="text-xs text-neutral-500 mt-2 max-w-xl">
            Unlimited plans cover practice & mock tests; roadmaps are separate one-time products. All
            sales are final — no refunds on digital products.
          </p>

          {isAuthenticated && (
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              {unlimited ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <Sparkles className="w-4 h-4" />
                  {subscription?.planName || 'Unlimited'} active
                  {subscription?.expiresAt
                    ? ` · until ${new Date(subscription.expiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}`
                    : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white text-neutral-800 border border-neutral-200">
                  <Coins className="w-4 h-4 text-amber-600" />
                  {credits} credits left
                </span>
              )}
            </div>
          )}

          {subscribed && (
            <p className="mt-4 text-sm text-emerald-700 font-medium text-center sm:text-left">
              Payment successful — unlimited access is now active.
            </p>
          )}
        </header>

        <div className="mb-6">
          <PricingTermsCheckbox
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            termsVersion={termsVersion}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {displayPlans.map((plan) => (
            <article
              key={plan.id}
              className="relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              {plan.badge ? (
                <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">
                  {plan.badge}
                </span>
              ) : null}
              <h2 className="text-lg font-semibold text-neutral-900">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold text-neutral-900 tabular-nums">
                ₹{plan.priceInr}
                <span className="text-sm font-normal text-neutral-400 ml-1">
                  {plan.durationHours ? '/ 24h' : `/ ${plan.durationDays}d`}
                </span>
              </p>
              <p className="mt-3 text-sm text-neutral-600 flex-1 leading-relaxed">
                {plan.description}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Unlimited practice
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Unlimited mock tests
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Progress & analytics
                </li>
              </ul>
              <div className="mt-6 pt-2">
                <SubscriptionCheckout planId={plan.id} termsAccepted={termsAccepted} />
              </div>
            </article>
          ))}
        </div>

        {!termsAccepted && displayPlans.length > 0 ? (
          <p className="mt-4 text-center text-xs text-neutral-400">
            Accept the terms above to enable checkout.
          </p>
        ) : null}

        <SellerDetailsFooter />

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Back to home
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
