'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import VendorPortalShell from './VendorPortalShell';

/**
 * Shown when a signed-in user is not allowed into a vendor portal.
 * Must not receive or render any test/question data.
 */
export default function VendorRestrictedPanel({
  vendorName,
  slug,
  message,
  domainHint = 'your institute',
}) {
  const { signOut, user } = useAuth();
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/access-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: requestMessage }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit request');
      }
      setSubmitted(true);
      toast.success(data.message || 'Request submitted');
    } catch (err) {
      toast.error(err.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VendorPortalShell>
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.06),transparent_45%)]" />
        <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-700">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="relative text-center text-xl font-bold tracking-tight text-neutral-900">
          Access restricted
        </h1>
        <p className="relative mt-3 text-center text-sm text-neutral-600">
          {message ||
            `Access restricted to ${domainHint} accounts. Contact your institute admin, or request access below.`}
        </p>
        {vendorName ? (
          <p className="relative mt-2 text-center text-xs text-neutral-500">{vendorName}</p>
        ) : null}
        {user?.email ? (
          <p className="relative mt-4 text-center text-xs text-neutral-500">
            Signed in as <span className="font-medium text-neutral-700">{user.email}</span>
          </p>
        ) : null}

        <div className="relative mt-8 space-y-3">
          {!submitted ? (
            <form onSubmit={handleRequest} className="space-y-3">
              <label className="block text-sm font-medium text-neutral-800" htmlFor="access-msg">
                Request access
              </label>
              <textarea
                id="access-msg"
                rows={3}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Optional: roll number, batch, or reason"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {submitting ? 'Submitting…' : 'Ask admin for access'}
              </button>
            </form>
          ) : (
            <p className="rounded-xl bg-teal-50 px-3 py-2 text-center text-sm text-teal-800">
              Request received. An institute admin will review it.
            </p>
          )}

          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>

          <Link
            href="/"
            className="block text-center text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            Back to 10Tracker
          </Link>
        </div>
      </div>
    </div>
    </VendorPortalShell>
  );
}
