'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PING = 'tt-ext-ping';
const PONG = 'tt-ext-pong';
const DISMISS_INSTALL = 'tt_ext_dismiss_install';
const DISMISS_CONNECT = 'tt_ext_dismiss_connect';

function readDomPresence() {
  if (typeof document === 'undefined') {
    return { installed: false, signedIn: false };
  }
  const root = document.documentElement;
  return {
    installed: root.getAttribute('data-tt-ext') === '1',
    signedIn: root.getAttribute('data-tt-ext-signed-in') === '1',
  };
}

function pingExtension() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PING));
  window.postMessage({ source: 'tt-web', type: PING }, '*');
}

/**
 * Scalable presence probe:
 * - Instant DOM read for install
 * - Event ping for signed-in status (this browser)
 * - Live subscription so connect flow updates without full remount
 *
 * Modes:
 * - needsInstall: extension missing
 * - needsConnect: installed here but not authorized
 * - ready: installed + signed in on this browser
 */
export function useExtensionPresence({ enabled = true } = {}) {
  const [installed, setInstalled] = useState(false);
  const [extSignedIn, setExtSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(Boolean(enabled));
  const liveRef = useRef(false);

  const apply = useCallback((detail) => {
    if (!detail?.installed) return;
    setInstalled(true);
    // Ignore provisional signedIn:false while auth is still resolving
    if (detail.signedIn === true) {
      setExtSignedIn(true);
      return;
    }
    if (typeof detail.signedIn === 'boolean' && !detail.pendingAuth) {
      setExtSignedIn(detail.signedIn);
    }
  }, []);

  const probe = useCallback(
    async ({ waitMs } = {}) => {
      if (!enabled || typeof window === 'undefined') {
        setChecking(false);
        setReady(true);
        return { installed: false, signedIn: false };
      }

      setChecking(true);

      const initial = readDomPresence();
      if (initial.installed) {
        apply({ installed: true, signedIn: initial.signedIn });
      }

      let resolved = initial.installed;
      const onPong = (event) => {
        apply(event.detail);
        if (event.detail?.installed) resolved = true;
      };
      const onMessage = (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (data?.source === 'tt-ext' && data?.type === PONG) {
          apply(data);
          if (data.installed) resolved = true;
        }
      };

      window.addEventListener(PONG, onPong);
      window.addEventListener('message', onMessage);
      pingExtension();

      // Fast path when already marked installed; longer wait only if unknown.
      const budget =
        typeof waitMs === 'number'
          ? waitMs
          : initial.installed
            ? 220
            : 550;

      await Promise.race([
        new Promise((r) => setTimeout(r, budget)),
        new Promise((r) => {
          if (resolved && initial.signedIn) {
            r();
            return;
          }
          const once = (event) => {
            if (event.detail?.installed) {
              window.removeEventListener(PONG, once);
              // Give signedIn a beat if it arrives with the same pong
              setTimeout(r, 40);
            }
          };
          window.addEventListener(PONG, once);
        }),
      ]);

      const dom = readDomPresence();
      if (dom.installed) apply({ installed: true, signedIn: dom.signedIn });

      window.removeEventListener(PONG, onPong);
      window.removeEventListener('message', onMessage);
      setChecking(false);
      setReady(true);
      return dom;
    },
    [enabled, apply]
  );

  // Seed install from DOM immediately so we never flash "install" when already present
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const dom = readDomPresence();
    if (dom.installed) {
      apply({
        installed: true,
        signedIn: dom.signedIn,
        pendingAuth: !dom.signedIn,
      });
    }
  }, [enabled, apply]);

  // Initial probe + live listener (cheap; no devices API round-trip).
  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setChecking(false);
      return undefined;
    }

    void probe();

    const onPong = (event) => apply(event.detail);
    const onMessage = (event) => {
      if (event.source !== window) return;
      const data = event.data;
      if (data?.source === 'tt-ext' && data?.type === PONG) apply(data);
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        pingExtension();
        void probe({ waitMs: 180 });
      }
    };

    window.addEventListener(PONG, onPong);
    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVis);
    liveRef.current = true;

    return () => {
      liveRef.current = false;
      window.removeEventListener(PONG, onPong);
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled, probe, apply]);

  const connected = Boolean(installed && extSignedIn);
  const needsInstall = Boolean(enabled && ready && !installed);
  const needsConnect = Boolean(enabled && ready && installed && !extSignedIn);
  const needsSetup = needsInstall || needsConnect;
  const mode = needsInstall ? 'install' : needsConnect ? 'connect' : 'ready';

  const dismissKey = mode === 'connect' ? DISMISS_CONNECT : DISMISS_INSTALL;

  const dismissSession = useCallback(() => {
    try {
      sessionStorage.setItem(dismissKey, '1');
    } catch {
      /* ignore */
    }
  }, [dismissKey]);

  const wasDismissed = useCallback(() => {
    try {
      return sessionStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  }, [dismissKey]);

  const clearDismiss = useCallback(() => {
    try {
      sessionStorage.removeItem(DISMISS_INSTALL);
      sessionStorage.removeItem(DISMISS_CONNECT);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    installed,
    connected,
    extSignedIn,
    needsInstall,
    needsConnect,
    needsSetup,
    mode,
    checking,
    ready,
    refresh: probe,
    dismissSession,
    wasDismissed,
    clearDismiss,
  };
}
