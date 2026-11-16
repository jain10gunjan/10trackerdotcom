'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Link2,
  X,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authorizeExtension } from '@/features/extension-auth/lib/authorizeExtension';
import { GUEST_BRAND, easeOut, useGuestMotion } from '@/features/guest/components/guestMotion';

const STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL ||
  process.env.NEXT_PUBLIC_EXTENSION_STORE_URL ||
  '';

/**
 * Clean mode-aware setup:
 * - connect: installed → one-click authorize only (never show install again)
 * - install: missing → install first, then connect
 */
export default function ExtensionSetupModal({
  open,
  onClose,
  installed = false,
  connected = false,
  mode = 'install',
  pathTitle = null,
  onConnected,
}) {
  const { animate } = useGuestMotion();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('idle');

  // Trust live install signal over stale mode prop
  const isInstalled = Boolean(installed || mode === 'connect' || mode === 'ready');
  const connectOnly = isInstalled && !connected;

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError(null);
      setPhase('idle');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !connected) return undefined;
    setPhase('idle');
    const t = setTimeout(() => {
      onConnected?.();
      onClose?.();
    }, 1100);
    return () => clearTimeout(t);
  }, [open, connected, onClose, onConnected]);

  if (typeof document === 'undefined') return null;

  const startConnect = async () => {
    setError(null);
    if (!user) {
      signInWithGoogle({
        redirectUrl:
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/og-trackers',
      });
      return;
    }

    setBusy(true);
    setPhase('authorizing');
    try {
      const { path } = await authorizeExtension();
      setPhase('waiting');
      window.location.assign(path);
    } catch (err) {
      setError(err.message || 'Could not start connect');
      setPhase('idle');
      setBusy(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[3px]"
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={animate ? { opacity: 0 } : undefined}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tt-ext-setup-title"
            className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-neutral-200/90 bg-white shadow-[0_28px_90px_-28px_rgba(15,23,42,0.5)] overflow-hidden"
            initial={animate ? { opacity: 0, y: 36, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={animate ? { opacity: 0, y: 20, scale: 0.98 } : undefined}
            transition={{ duration: 0.36, ease: easeOut }}
          >
            <div
              className="relative px-6 pt-6 pb-5"
              style={{
                background: `linear-gradient(160deg, ${GUEST_BRAND.soft} 0%, #ffffff 72%)`,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-white/90 text-neutral-500 hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>

              <motion.div
                initial={animate ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.35, ease: easeOut }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/10tracker.png"
                  alt="10tracker.com"
                  className="h-8 w-auto max-w-[180px] object-contain"
                />
                <p
                  className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: GUEST_BRAND.blue }}
                >
                  {connected
                    ? 'Ready'
                    : connectOnly
                      ? 'Extension installed'
                      : 'YouTube Progress'}
                </p>
                <h2
                  id="tt-ext-setup-title"
                  className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950"
                >
                  {connected
                    ? 'You’re connected'
                    : connectOnly
                      ? 'Connect this browser'
                      : 'Install the extension'}
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-sm">
                  {connected
                    ? 'OG Tracker path videos will sync watch % automatically.'
                    : connectOnly
                      ? pathTitle
                        ? `One click links the extension for “${pathTitle}”. Only catalog videos sync.`
                        : 'One click links the extension. Only OG Tracker path videos sync.'
                      : pathTitle
                        ? `Add YouTube Progress, then connect to sync “${pathTitle}”.`
                        : 'Add YouTube Progress, then connect once. Tracker videos only.'}
                </p>
              </motion.div>
            </div>

            <div className="px-6 pb-2">
              {connected ? (
                <motion.div
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-5 text-center"
                  initial={animate ? { scale: 0.96, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                >
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-sm font-semibold text-emerald-950">
                    Extension linked
                  </p>
                </motion.div>
              ) : connectOnly ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#3F5EB9]/22 bg-[#E8EDF8]/55 px-4 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Detected on this browser
                    </div>
                    <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                      Account link needed — install step is done. Nothing else on YouTube is
                      tracked.
                    </p>

                    {error ? (
                      <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        {error}
                      </p>
                    ) : null}

                    <div className="mt-4">
                      {authLoading ? (
                        <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking session…
                        </div>
                      ) : (
                        <motion.button
                          type="button"
                          disabled={busy}
                          onClick={startConnect}
                          whileTap={animate ? { scale: 0.98 } : undefined}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                          style={{
                            backgroundColor: GUEST_BRAND.blue,
                            boxShadow: `0 14px 28px -14px ${GUEST_BRAND.blue}aa`,
                          }}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          {!user
                            ? 'Sign in to connect'
                            : phase === 'waiting'
                              ? 'Finishing…'
                              : busy
                                ? 'Authorizing…'
                                : 'Connect now'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-neutral-950">
                      1. Install YouTube Progress
                    </p>
                    <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                      Add the Chrome / Edge extension, then reload this page.
                    </p>
                    <div className="mt-3">
                      {STORE_URL ? (
                        <a
                          href={STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: GUEST_BRAND.blue }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Get extension
                          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                        </a>
                      ) : (
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          Load unpacked from{' '}
                          <code className="rounded bg-neutral-100 px-1">
                            extensions/youtube-progress/dist/chrome
                          </code>
                          , then reload.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-3.5 opacity-70">
                    <p className="text-sm font-semibold text-neutral-700">
                      2. Connect account
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Available after install is detected.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-100 bg-neutral-50/90">
              <Link
                href="/extension/devices"
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 text-center sm:text-left"
              >
                Manage devices
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {connected ? 'Done' : 'Not now'}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
