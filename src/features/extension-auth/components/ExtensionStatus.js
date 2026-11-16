'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ExtensionSetupModal from '@/features/extension-auth/components/ExtensionSetupModal';
import { useExtensionPresence } from '@/features/extension-auth/hooks/useExtensionPresence';
import { GUEST_BRAND, easeOut, useGuestMotion } from '@/features/guest/components/guestMotion';

/**
 * Compact connected / not-connected chip.
 */
export function ExtensionStatusChip({
  ready = false,
  connected = false,
  onClick,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={connected ? undefined : onClick}
      disabled={!ready}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        !ready
          ? 'border-neutral-200 bg-neutral-50 text-neutral-400'
          : connected
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100/80'
      } ${className}`}
      title={
        connected
          ? '10tracker YouTube Progress is connected'
          : 'Connect 10tracker YouTube Progress'
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/10tracker.png"
        alt=""
        className="h-3.5 w-auto max-w-[72px] object-contain"
        aria-hidden
      />
      {!ready ? '…' : connected ? 'connected' : 'not connected'}
    </button>
  );
}

/**
 * Status banner — only shown when not connected (connected = chip elsewhere).
 */
export function ExtensionStatusBanner({
  ready = false,
  connected = false,
  needsConnect = false,
  onConnect,
  className = '',
}) {
  const { animate } = useGuestMotion();
  if (!ready) return null;

  if (connected) {
    return (
      <motion.div
        className={`flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-2.5 ${className}`}
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/10tracker.png"
          alt="10tracker.com"
          className="h-5 w-auto max-w-[110px] object-contain"
        />
        <p className="min-w-0 flex-1 text-xs font-medium text-emerald-900">
          Extension connected · tracker videos only
        </p>
        <Link
          href="/extension/devices"
          className="text-xs font-semibold text-emerald-800 underline underline-offset-2 shrink-0"
        >
          Devices
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border px-4 py-3.5 ${className}`}
      style={{
        borderColor: 'rgba(63,94,185,0.28)',
        backgroundColor: GUEST_BRAND.soft,
      }}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/10tracker.png"
        alt="10tracker.com"
        className="h-7 w-auto max-w-[140px] object-contain shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-950">
          {needsConnect ? 'Connect extension' : 'Install extension'}
        </p>
        <p className="mt-0.5 text-xs text-neutral-600">
          {needsConnect
            ? 'Installed here — one click to sync OG Tracker videos.'
            : 'Install once, then connect. Catalog videos only.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0"
        style={{
          backgroundColor: GUEST_BRAND.blue,
          boxShadow: `0 12px 24px -12px ${GUEST_BRAND.blue}99`,
        }}
      >
        {needsConnect ? 'Connect now' : 'Set up'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/**
 * Drop-in status. autoPrompt only fires for needsConnect (never install spam).
 */
export default function ExtensionStatus({
  enabled = true,
  variant = 'banner',
  autoPrompt = false,
  pathTitle = null,
  className = '',
  chipClassName = '',
}) {
  const [showSetup, setShowSetup] = useState(false);
  const promptedRef = useRef(false);
  const {
    installed,
    connected,
    needsConnect,
    needsInstall,
    mode,
    ready,
    refresh,
    dismissSession,
    wasDismissed,
    clearDismiss,
  } = useExtensionPresence({ enabled });

  useEffect(() => {
    // Only auto-prompt when installed but not linked — never re-show install popup
    if (!enabled || !autoPrompt || !ready || !needsConnect) return;
    if (promptedRef.current || wasDismissed()) return;
    promptedRef.current = true;
    setShowSetup(true);
  }, [enabled, autoPrompt, ready, needsConnect, wasDismissed]);

  const openSetup = useCallback(() => {
    clearDismiss();
    setShowSetup(true);
  }, [clearDismiss]);

  const closeSetup = useCallback(() => {
    dismissSession();
    setShowSetup(false);
    void refresh();
  }, [dismissSession, refresh]);

  if (!enabled) return null;

  const showChip = variant === 'chip' || variant === 'both';
  // Banner: always when not connected; slim when connected only if variant includes banner
  const showBanner =
    (variant === 'banner' || variant === 'both') &&
    (needsConnect || needsInstall || (connected && variant === 'banner'));

  return (
    <>
      <div className={className}>
        {showChip ? (
          <ExtensionStatusChip
            ready={ready}
            connected={connected}
            onClick={openSetup}
            className={chipClassName}
          />
        ) : null}
        {showBanner ? (
          <ExtensionStatusBanner
            ready={ready}
            connected={connected}
            needsConnect={needsConnect}
            onConnect={openSetup}
            className={showChip ? 'mt-3' : ''}
          />
        ) : null}
      </div>

      <ExtensionSetupModal
        open={showSetup}
        onClose={closeSetup}
        installed={installed}
        connected={connected}
        mode={mode}
        pathTitle={pathTitle}
        onConnected={() => {
          clearDismiss();
          void refresh();
        }}
      />
    </>
  );
}
