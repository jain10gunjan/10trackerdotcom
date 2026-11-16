'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import {
  VENDOR_PLANS,
  formatVendorPlanPrice,
} from '@/features/vendor-tests/lib/vendorPlans';
import { parseJsonResponse } from '@/lib/toastAsync';

function slugify(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export default function VendorSelfServePage() {
  const { user, setShowAuthModal } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const paidPlans = useMemo(
    () => VENDOR_PLANS.filter((p) => p.amountPaise > 0),
    []
  );

  const onNameChange = (value) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal?.(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendors/self-serve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, domain: domain || undefined }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not create institute');
      }
      if (data.billingMigrationRequired) {
        toast(
          'Portal created. Run setup_vendor_saas_billing.sql to enable plan fields.',
          { duration: 5000 }
        );
      } else {
        toast.success('Institute portal created — 14-day trial started');
      }
      router.push(data.href || `/practice-tests/${data.vendor.slug}/admin`);
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">
          Institutes
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">
          Claim your college portal
        </h1>
        <p className="mt-2 text-neutral-600 text-sm leading-relaxed">
          Create a multi-tenant practice-tests space for your institute. Start with a free
          14-day trial, then upgrade to monthly or add coding contests.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Institute name</span>
            <input
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              placeholder="IPS Academy Indore"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Portal slug</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-mono"
              placeholder="ips-academy-indore"
            />
            <span className="mt-1 block text-xs text-neutral-500">
              Live at /practice-tests/{slug || 'your-slug'}
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">
              Student email domain (optional)
            </span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value.trim().toLowerCase())}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              placeholder="ipsacademy.org"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-neutral-900 text-white font-semibold py-3 text-sm hover:bg-neutral-800 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Start free trial'}
          </button>
          {!user ? (
            <p className="text-xs text-neutral-500 text-center">
              You will be asked to sign in with Google.
            </p>
          ) : null}
        </form>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900">Plans after trial</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {paidPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <p className="font-semibold text-neutral-900 text-sm">{plan.name}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900">
                  {formatVendorPlanPrice(plan)}
                  {plan.intervalDays ? (
                    <span className="text-xs font-normal text-neutral-500"> / mo</span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  {plan.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            Paid checkout lives in vendor admin after trial. Platform admins can still create
            vendors at <Link href="/admin/vendors" className="underline">/admin/vendors</Link>.
            Run <code className="font-mono">setup_vendor_saas_billing.sql</code> once in
            Supabase.
          </p>
        </section>
      </main>
    </div>
  );
}
