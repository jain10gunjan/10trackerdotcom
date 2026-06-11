'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Coins,
  Gift,
  Map,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import SubscriptionCheckout from '@/components/credits/SubscriptionCheckout';
import PricingTermsCheckbox from '@/components/credits/PricingTermsCheckbox';
import SellerDetailsFooter from '@/components/credits/SellerDetailsFooter';
import RoadmapsDisclaimerBanner from '@/components/roadmaps/RoadmapsDisclaimerBanner';
import { SUBSCRIPTION_PLANS } from '@/lib/credits/constants';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

function PricingContent({ initialRoadmaps = [] }) {
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

  const featuredRoadmaps = initialRoadmaps.slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="pt-24 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/80 pointer-events-none" />

            <div className="relative p-6 sm:p-10">
              <Pill>10Tracker pricing</Pill>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                Practice plans & study roadmaps
              </h1>
              <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                Unlimited practice and mock tests are sold as time-based plans. Study roadmaps are
                separate one-time products with day-by-day structure and progress tracking.
              </p>

              {isAuthenticated && (
                <div className="mt-5 flex flex-wrap gap-2">
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

              {subscribed ? (
                <p className="mt-4 text-sm text-emerald-700 font-medium">
                  Payment successful — unlimited access is now active.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <RoadmapsDisclaimerBanner />
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Unlimited practice plans
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                One-time purchase · no auto-renewal · practice & mock tests for the plan duration
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
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
                className="relative flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
              >
                {plan.badge ? (
                  <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">
                    {plan.badge}
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>
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
        </div>
      </section>

      <section className="pb-16 md:pb-20 border-t border-neutral-200/80 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-700 mb-2">
                <Map className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Roadmaps</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Structured study roadmaps
              </h2>
              <p className="text-sm text-neutral-500 mt-1 max-w-xl">
                Separate one-time products — not included in unlimited practice plans. Preview free
                days before you buy.
              </p>
            </div>
            <Link
              href="/roadmaps"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 shrink-0"
            >
              Browse all roadmaps
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredRoadmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {featuredRoadmaps.map((roadmap) => (
                <Link
                  key={roadmap.id}
                  href={`/roadmaps/${roadmap.slug}`}
                  className="group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <h3 className="text-base font-semibold text-neutral-900 group-hover:text-emerald-900">
                    {roadmap.title}
                  </h3>
                  {roadmap.description ? (
                    <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {roadmap.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                      ₹{roadmap.priceInr} · one-time
                    </span>
                    {roadmap.freePreviewDays > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
                        <Gift className="w-3 h-3" />
                        {roadmap.freePreviewDays} free
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-neutral-200 bg-white py-12 text-center px-6">
              <Map className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-600">Roadmaps coming soon.</p>
              <Link
                href="/exams"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:underline"
              >
                Explore exams instead <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SellerDetailsFooter />
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <Link href="/" className="font-medium text-neutral-500 hover:text-neutral-900">
              ← Back to home
            </Link>
            <span className="hidden sm:inline text-neutral-300">|</span>
            <Link href="/terms-and-services" className="font-medium text-neutral-500 hover:text-neutral-900">
              Terms of service
            </Link>
            <Link href="/privacy-policy" className="font-medium text-neutral-500 hover:text-neutral-900">
              Privacy policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingFallback() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="h-48 rounded-3xl bg-neutral-200/90 animate-pulse" />
        <div className="h-24 rounded-2xl bg-neutral-200/90 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-neutral-200/90 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage({ initialRoadmaps = [] }) {
  return (
    <Suspense fallback={<PricingFallback />}>
      <PricingContent initialRoadmaps={initialRoadmaps} />
    </Suspense>
  );
}
