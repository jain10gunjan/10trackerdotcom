'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

/**
 * Landing page after authorize. Extension content script / SW reads ?code= and exchanges it.
 * After exchange the extension strips the code and lands on ?status=connected|expired.
 */
export default function ExtensionConnectedPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const statusParam = searchParams.get('status') || '';

  const initial =
    code
      ? 'waiting'
      : statusParam === 'connected'
        ? 'done'
        : statusParam === 'expired'
          ? 'expired'
          : 'missing';

  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (code) {
      setStatus('waiting');
      return;
    }
    if (statusParam === 'connected') setStatus('done');
    else if (statusParam === 'expired') setStatus('expired');
    else setStatus('missing');
  }, [code, statusParam]);

  const payload = useMemo(
    () => ({
      source: '10tracker-extension',
      type: 'EXTENSION_AUTH_CODE',
      code,
      apiOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    }),
    [code]
  );

  useEffect(() => {
    if (!code) return;

    try {
      window.postMessage(payload, window.location.origin);
    } catch {
      /* ignore */
    }

    try {
      window.dispatchEvent(new CustomEvent('10tracker-extension-auth', { detail: payload }));
    } catch {
      /* ignore */
    }

    setStatus('ready');

    // Soft-replace if the extension already connected without a hard navigation
    const onExtOk = (event) => {
      if (event?.detail?.ok || event?.type === 'tt-ext-connected') {
        setStatus('done');
        try {
          const u = new URL(window.location.href);
          u.searchParams.delete('code');
          u.searchParams.set('status', 'connected');
          window.history.replaceState({}, '', u.toString());
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('tt-ext-connected', onExtOk);
    return () => window.removeEventListener('tt-ext-connected', onExtOk);
  }, [code, payload]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
        {status === 'missing' ? (
          <>
            <h1 className="text-xl font-semibold text-neutral-900">Missing connect code</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Start again from the connect page.
            </p>
            <Link
              href="/extension/connect"
              className="mt-6 inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Connect extension
            </Link>
          </>
        ) : status === 'expired' ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Connect code expired</h1>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Authorize again — codes are one-time and expire after a few minutes.
            </p>
            <Link
              href="/extension/connect"
              className="mt-6 inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Connect again
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-auto items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/10tracker.png"
                alt="10tracker.com"
                className="h-10 w-auto max-w-[220px] object-contain"
              />
            </div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-3">
              {status === 'waiting' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">
              {status === 'done' ? 'Extension connected' : 'Extension authorized'}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              {status === 'done'
                ? 'You’re set. Open a path video on YouTube — progress syncs for catalogued videos only.'
                : 'Keep this tab open — the extension finishes signing in automatically. If the popup still asks you to connect, open it and click Finish connect from open tab.'}
            </p>
            {code ? (
              <div
                id="tentracker-extension-auth"
                data-code={code}
                data-api-origin={
                  typeof window !== 'undefined' ? window.location.origin : ''
                }
                className="hidden"
                aria-hidden
              />
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/og-trackers"
                className="inline-flex justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                Back to OG Trackers
              </Link>
              <Link
                href="/extension/devices"
                className="inline-flex justify-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800"
              >
                Manage devices
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
