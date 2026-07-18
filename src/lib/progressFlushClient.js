'use client';

import {
  readProgressBuffer,
  clearProgressBuffer,
  getUnsavedCount,
} from '@/lib/progressBuffer';
import { getProgressUserId } from '@/lib/progressIdentity';
import { trackPracticeClient } from '@/lib/practiceMetrics';

let flushInFlight = null;
let lifecycleRegistered = false;
let activeUserRef = { current: null };
let onFlushedCallbacks = new Set();

export function onProgressFlushed(cb) {
  onFlushedCallbacks.add(cb);
  return () => onFlushedCallbacks.delete(cb);
}

function notifyFlushed(result) {
  onFlushedCallbacks.forEach((cb) => {
    try {
      cb(result);
    } catch {
      /* ignore */
    }
  });
}

/**
 * Flush local progress buffer via auth'd API.
 * Manual Save should call this with { force: true, silent: false }.
 * Safety net (tab hide) uses { force: true, silent: true }.
 */
export async function flushProgressBufferToApi(user, { silent = true } = {}) {
  const userId = getProgressUserId(user) || user?.id;
  if (!userId || typeof window === 'undefined') {
    return { ok: true, skipped: true };
  }

  const buffer = readProgressBuffer(userId);
  const entries = buffer.entries ?? {};
  const count = Object.keys(entries).length;
  if (!count) return { ok: true, saved: 0 };

  if (flushInFlight) return flushInFlight;

  flushInFlight = (async () => {
    try {
      const res = await fetch('/api/practice/progress', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
        keepalive: true,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        trackPracticeClient('progress_save_failed', {
          status: res.status,
          error: data.error || 'unknown',
          unsaved: count,
        });
        return { ok: false, error: data.error || `HTTP ${res.status}`, unsaved: count };
      }
      clearProgressBuffer(userId);
      trackPracticeClient('progress_save_ok', { saved: data.saved ?? count });
      const result = { ok: true, saved: data.saved ?? count, cleared: true };
      notifyFlushed(result);
      return result;
    } catch (e) {
      trackPracticeClient('progress_save_failed', {
        error: e?.message || 'network',
        unsaved: count,
      });
      return { ok: false, error: e?.message || 'network', unsaved: count };
    } finally {
      flushInFlight = null;
    }
  })();

  return flushInFlight;
}

/** Safety flush on tab hide / pagehide — does not toast. */
export function registerProgressFlushLifecycle(user) {
  if (typeof window === 'undefined') return () => {};
  activeUserRef.current = user;

  if (lifecycleRegistered) {
    return () => {
      activeUserRef.current = null;
    };
  }
  lifecycleRegistered = true;

  const onHide = () => {
    const u = activeUserRef.current;
    if (!u?.id && !u?.email) return;
    const uid = getProgressUserId(u) || u.id;
    if (!getUnsavedCount(uid)) return;
    flushProgressBufferToApi(u, { silent: true });
  };

  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });

  return () => {
    activeUserRef.current = null;
  };
}
