'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authorizeExtension } from '@/features/extension-auth/lib/authorizeExtension';
import { ExtensionStatusChip } from '@/features/extension-auth/components/ExtensionStatus';
import { useExtensionPresence } from '@/features/extension-auth/hooks/useExtensionPresence';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';

export default function ExtensionConnectPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { connected, ready } = useExtensionPresence({ enabled: Boolean(user) });

  const authorize = async () => {
    setBusy(true);
    setError(null);
    try {
      const { path } = await authorizeExtension();
      window.location.assign(path);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/10tracker.png"
            alt="10tracker.com"
            className="h-10 w-auto max-w-[220px] object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Connect extension
        </h1>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          Authorize YouTube Progress to sync watch % for videos in your OG Tracker paths —
          catalog only.
        </p>

        {user ? (
          <div className="mt-4">
            <ExtensionStatusChip ready={ready} connected={connected} onClick={authorize} />
          </div>
        ) : null}

        <ul className="mt-5 space-y-2 text-sm text-neutral-600">
          <li className="flex gap-2">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-neutral-400" />
            Only catalogued path videos are tracked — not your full YouTube history.
          </li>
          <li className="flex gap-2">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-neutral-400" />
            You can revoke access anytime from{' '}
            <Link href="/extension/devices" className="underline underline-offset-2">
              connected devices
            </Link>
            .
          </li>
        </ul>

        {error ? (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking session…
            </div>
          ) : !user ? (
            <button
              type="button"
              onClick={() => signInWithGoogle({ redirectUrl: '/extension/connect' })}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: GUEST_BRAND.blue }}
            >
              Sign in with Google
            </button>
          ) : ready && connected ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-center">
                This browser is connected.
              </p>
              <Link
                href="/extension/devices"
                className="block w-full text-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Manage devices
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-500">
                Signed in as <span className="font-medium text-neutral-800">{user.email}</span>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={authorize}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: GUEST_BRAND.blue }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {busy ? 'Authorizing…' : 'Authorize extension'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
