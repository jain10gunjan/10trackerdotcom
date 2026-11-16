import browser from '../lib/browser.js';
import { MSG } from '../lib/messages.js';
import {
  clearAuth,
  clearMiss,
  dismissResumeNudge,
  enqueueProgress,
  getAuth,
  getQueue,
  getSettings,
  getSyncStatus,
  isKnownMiss,
  isResumeDismissedToday,
  patchSyncStatus,
  rememberMiss,
  setAuth,
  setLastLookup,
  setQueue,
  setSettings,
  getLastLookup,
  DEFAULT_API_ORIGIN,
} from '../lib/storage.js';
import { exchangeCode, lookupByYoutube, postProgress, revokeCurrentToken } from '../lib/api.js';
import { clampPercent } from '../lib/milestones.js';

const LOOKUP_TTL_MS = 90_000;
const MISS_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const lookupCache = new Map();
/** @type {Map<string, number>} */
const lastPostedPercent = new Map();
let flushTimer = null;

const consumedCodes = new Set();
const deadCodes = new Set();

async function setBadge(text, color = '#3F5EB9') {
  try {
    await browser.action.setBadgeText({ text: text || '' });
    await browser.action.setBadgeBackgroundColor({ color });
  } catch {
    /* ignore */
  }
}

function pathUrl(apiOrigin, slug) {
  if (!slug) return null;
  return `${String(apiOrigin || DEFAULT_API_ORIGIN).replace(/\/$/, '')}/og-trackers/${slug}`;
}

function parseConnectUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!url.pathname.includes('/extension/connected')) return null;
    const code = url.searchParams.get('code');
    if (!code) return null;
    return { code, apiOrigin: url.origin, href: urlString };
  } catch {
    return null;
  }
}

async function stripCodeFromTab(tabId, href, { status = 'connected' } = {}) {
  if (!tabId || !href) return;
  try {
    const url = new URL(href);
    if (!url.searchParams.has('code')) return;
    url.searchParams.delete('code');
    // Keep a status flag so the web page shows success/expired instead of "Missing code"
    url.searchParams.set('status', status);
    await browser.tabs.update(tabId, { url: url.toString() });
  } catch {
    /* ignore */
  }
}

async function handleAuthCode({ code, apiOrigin, tabId, href }) {
  const raw = String(code || '').trim();
  if (!raw) return { ok: false, error: 'Missing code' };

  if (deadCodes.has(raw)) {
    return { ok: false, error: 'Connect code expired. Authorize again.', dead: true };
  }

  if (consumedCodes.has(raw)) {
    const auth = await getAuth();
    if (auth.token) return { ok: true, email: auth.email, reused: true };
  }

  const origin = apiOrigin || DEFAULT_API_ORIGIN;
  try {
    const issued = await exchangeCode(origin, raw);
    consumedCodes.add(raw);
    deadCodes.delete(raw);
    await setAuth({
      token: issued.token,
      email: issued.email,
      expiresAt: issued.expiresAt,
      apiOrigin: origin,
    });
    await setBadge('OK', '#059669');
    setTimeout(() => setBadge(''), 2000);
    if (tabId) await stripCodeFromTab(tabId, href, { status: 'connected' });
    return { ok: true, email: issued.email };
  } catch (err) {
    const msg = err.message || 'Exchange failed';
    if (/expired|already used|Invalid connect code/i.test(msg)) {
      deadCodes.add(raw);
      if (tabId) await stripCodeFromTab(tabId, href, { status: 'expired' });
    }
    await setBadge('!', '#b91c1c');
    return { ok: false, error: msg, dead: deadCodes.has(raw) };
  }
}

async function tryCaptureConnectFromTab(tab) {
  if (!tab?.url) return null;
  const parsed = parseConnectUrl(tab.url);
  if (!parsed) return null;
  if (deadCodes.has(parsed.code)) return { ok: false, error: 'dead', dead: true };
  return handleAuthCode({ ...parsed, tabId: tab.id, href: tab.url });
}

async function cachedLookup(videoId, { force = false } = {}) {
  const settings = await getSettings();
  // Always skip known non-catalog videos (tracker-only, never random YouTube)
  if (!force && (await isKnownMiss(videoId))) {
    return {
      found: false,
      youtubeVideoId: videoId,
      message: 'Not in your OG Tracker paths',
      cachedMiss: true,
    };
  }

  const cached = lookupCache.get(videoId);
  if (!force && cached && Date.now() - cached.at < LOOKUP_TTL_MS) {
    return cached.data;
  }

  const data = await lookupByYoutube(videoId);
  if (!data.found) {
    await rememberMiss(videoId);
    lookupCache.set(videoId, {
      at: Date.now(),
      data,
      missTtl: MISS_MEMORY_TTL_MS,
    });
  } else {
    await clearMiss(videoId);
    lookupCache.set(videoId, { at: Date.now(), data });
  }
  await setLastLookup({
    youtubeVideoId: videoId,
    at: Date.now(),
    ...data,
  });
  return data;
}

function patchLookupProgress(videoId, progressRow) {
  const cached = lookupCache.get(videoId);
  if (!cached?.data) return;
  const percent =
    progressRow?.percent_watched ?? progressRow?.percentWatched ?? 0;
  cached.data = {
    ...cached.data,
    progress: {
      ...(cached.data.progress || {}),
      status: progressRow?.status,
      percentWatched: percent,
      percent_watched: percent,
      updated_at: progressRow?.updated_at,
      lastDeviceLabel:
        progressRow?.lastDeviceLabel || cached.data.progress?.lastDeviceLabel,
    },
  };
  lookupCache.set(videoId, { at: Date.now(), data: cached.data });
}

function buildOverlay({ auth, lookup, percent, snap, syncMeta, resumeNudge, settings }) {
  // Strict catalog: HUD only for videos in an active OG Tracker path
  if (!lookup?.found) {
    return null;
  }

  if (!auth?.token) {
    return {
      state: 'warn',
      percent: 0,
      title: 'Connect 10Tracker to track',
      meta: 'Open the extension popup to sign in',
      pathUrl: pathUrl(null, lookup.path?.slug),
    };
  }

  if (lookup.locked) {
    return {
      state: 'warn',
      percent: lookup.progress?.percentWatched || 0,
      title: lookup.resource?.title || 'Premium video',
      meta: 'Unlock OG Trackers Premium to sync',
      pathUrl: pathUrl(auth.apiOrigin, lookup.path?.slug),
      sectionLabel: lookup.resource?.sectionLabel || null,
    };
  }

  const saved =
    percent ??
    lookup.progress?.percentWatched ??
    lookup.progress?.percent_watched ??
    0;
  const done =
    saved >= 90 ||
    lookup.progress?.status === 'COMPLETED' ||
    lookup.progress?.status === 'SKIPPED';
  const t = Math.floor(Number(snap?.currentTime) || 0);
  const d = Math.floor(Number(snap?.duration) || 0);
  const pausedSync = Boolean(settings?.syncPaused);

  const metaParts = [
    lookup.path?.title || 'Path',
    lookup.resource?.sectionLabel || null,
    d > 0 ? `${t}s / ${d}s` : null,
    pausedSync ? 'Paused' : syncMeta || (done ? 'Complete' : 'Syncing'),
    lookup.progress?.lastDeviceLabel
      ? `via ${lookup.progress.lastDeviceLabel}`
      : null,
  ];

  return {
    state: done ? 'done' : pausedSync ? 'warn' : 'tracking',
    percent: saved,
    title: lookup.resource?.title || 'Tracked video',
    meta: metaParts.filter(Boolean).join(' · '),
    pathUrl: pathUrl(auth.apiOrigin, lookup.path?.slug),
    sectionLabel: lookup.resource?.sectionLabel || null,
    pathTitle: lookup.path?.title || null,
    nextVideoId: lookup.siblings?.next?.youtubeVideoId || null,
    nextTitle: lookup.siblings?.next?.title || null,
    syncPaused: pausedSync,
    resumeNudge: resumeNudge || null,
    pathProgress: lookup.pathProgress || null,
    weekGoal: lookup.weekGoal || null,
  };
}

async function syncProgress(youtubeVideoId, percentWatched, { forceStatus, allowWhenPaused } = {}) {
  const percent = clampPercent(percentWatched);
  const auth = await getAuth();
  const settings = await getSettings();

  if (!auth.token) {
    await setBadge('!', '#b45309');
    return { ok: false, reason: 'unsigned' };
  }

  if (settings.syncPaused && !allowWhenPaused && !forceStatus) {
    return { ok: true, paused: true, skippedPost: true };
  }

  const last = lastPostedPercent.get(youtubeVideoId) || 0;
  if (!forceStatus && percent > 0 && percent <= last) {
    const lookup = await cachedLookup(youtubeVideoId);
    return {
      ok: true,
      found: lookup.found,
      skippedPost: true,
      progress: lookup.progress
        ? {
            percent_watched: lookup.progress.percentWatched ?? last,
            percentWatched: lookup.progress.percentWatched ?? last,
            status: lookup.progress.status,
          }
        : { percent_watched: last, percentWatched: last },
    };
  }

  let lookup;
  try {
    lookup = await cachedLookup(youtubeVideoId);
  } catch (err) {
    if (err.code === 'UNAUTHORIZED') {
      await setBadge('!', '#b45309');
      return { ok: false, reason: 'unauthorized' };
    }
    await enqueueProgress({
      youtubeVideoId,
      percentWatched: percent,
      status: forceStatus || null,
      at: Date.now(),
    });
    scheduleFlush();
    await setBadge('Q', '#d97706');
    return { ok: false, reason: 'offline', queued: true };
  }

  if (!lookup.found) {
    await rememberMiss(youtubeVideoId);
    await setBadge('');
    return { ok: true, found: false, catalogMiss: true };
  }

  if (lookup.locked) {
    await setBadge('P', '#d97706');
    return { ok: false, found: true, locked: true };
  }

  try {
    await patchSyncStatus({ state: 'syncing', lastVideoId: youtubeVideoId });
    const result = await postProgress({
      youtubeVideoId,
      percentWatched: forceStatus === 'COMPLETED' ? 100 : percent,
      status: forceStatus || undefined,
    });
    const saved = result.progress?.percent_watched ?? percent;
    lastPostedPercent.set(youtubeVideoId, saved);
    patchLookupProgress(youtubeVideoId, result.progress);
    await setLastLookup({
      youtubeVideoId,
      at: Date.now(),
      ...lookup,
      progress: {
        percentWatched: saved,
        percent_watched: saved,
        status: result.progress?.status,
        lastDeviceLabel: result.progress?.lastDeviceLabel,
      },
      siblings: result.siblings || lookup.siblings,
      pathProgress: result.pathProgress || lookup.pathProgress,
    });
    const queue = await getQueue();
    await patchSyncStatus({
      state: queue.length ? 'queued' : 'idle',
      queueLength: queue.length,
      lastError: null,
      lastSyncedAt: Date.now(),
      lastVideoId: youtubeVideoId,
    });
    await setBadge(String(saved), '#3F5EB9');
    return { ok: true, found: true, progress: result.progress, lookup };
  } catch (err) {
    if (err.code === 'UNAUTHORIZED') {
      await setBadge('!', '#b45309');
      return { ok: false, reason: 'unauthorized' };
    }
    if (err.status === 403) {
      await setBadge('P', '#d97706');
      return { ok: false, locked: true };
    }
    await enqueueProgress({
      youtubeVideoId,
      percentWatched: percent,
      status: forceStatus || null,
      at: Date.now(),
    });
    scheduleFlush();
    await patchSyncStatus({
      state: 'error',
      lastError: err.message || 'Sync failed',
      lastVideoId: youtubeVideoId,
    });
    await setBadge('Q', '#d97706');
    return { ok: false, reason: 'error', queued: true, error: err.message };
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, 5000);
}

async function readYoutubeProgressFromTab(tabId) {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        const params = new URLSearchParams(location.search);
        const videoId = params.get('v');
        if (!videoId) return { ok: false, error: 'not-watch' };

        const videos = Array.from(document.querySelectorAll('video'));
        if (!videos.length) {
          return { ok: false, error: 'no-video', videoId };
        }

        videos.sort((a, b) => {
          const da = Number.isFinite(a.duration) ? a.duration : 0;
          const db = Number.isFinite(b.duration) ? b.duration : 0;
          return db - da;
        });
        const v = videos[0];
        const duration = Number(v.duration);
        const currentTime = Number(v.currentTime) || 0;
        if (!Number.isFinite(duration) || duration <= 0) {
          return {
            ok: false,
            error: 'no-duration',
            videoId,
            currentTime,
            duration,
            paused: Boolean(v.paused),
          };
        }

        let position = currentTime;
        try {
          if (v.played && v.played.length) {
            let played = 0;
            for (let i = 0; i < v.played.length; i += 1) {
              played += v.played.end(i) - v.played.start(i);
            }
            position = Math.max(position, played);
          }
        } catch {
          /* ignore */
        }

        const raw = (position / duration) * 100;
        let percent = Math.min(100, Math.max(0, Math.floor(raw)));
        if (position >= 5 && percent < 1) percent = 1;

        return {
          ok: true,
          videoId,
          percent,
          rawPercent: Math.round(raw * 100) / 100,
          currentTime: position,
          duration,
          paused: Boolean(v.paused),
        };
      },
    });
    return results?.[0]?.result || { ok: false, error: 'empty-result' };
  } catch (err) {
    return { ok: false, error: err.message || 'scripting-failed' };
  }
}

async function seekTabToPercent(tabId, percent) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (targetPct) => {
        const videos = Array.from(document.querySelectorAll('video'));
        if (!videos.length) return { ok: false };
        videos.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        const v = videos[0];
        if (!v.duration) return { ok: false };
        v.currentTime = (targetPct / 100) * v.duration;
        return { ok: true, currentTime: v.currentTime };
      },
      args: [pct],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function buildResumeNudge(lookup, snap, videoId) {
  const serverPct =
    lookup?.progress?.percentWatched ?? lookup?.progress?.percent_watched ?? 0;
  const localPct = Number(snap?.percent) || 0;
  if (serverPct < 5 || serverPct > 89) return null;
  if (localPct >= 5) return null;
  if (await isResumeDismissedToday(videoId)) return null;
  return { percent: serverPct };
}

async function pollYoutubeTab(tabId, { reason } = {}) {
  if (!tabId) return { ok: false, error: 'no-tab' };

  const auth = await getAuth();
  const settings = await getSettings();
  const snap = await readYoutubeProgressFromTab(tabId);

  if (!snap?.ok || !snap.videoId) {
    return { ok: false, snap, reason: auth.token ? undefined : 'unsigned' };
  }

  // Battery saver: skip background ticks while paused
  if (
    settings.batterySaver &&
    reason === 'interval' &&
    snap.paused
  ) {
    return { ok: true, skipped: true, reason: 'paused-battery' };
  }

  let lookup = null;
  if (auth.token) {
    try {
      lookup = await cachedLookup(snap.videoId);
    } catch (err) {
      if (err.code === 'UNAUTHORIZED') {
        return { ok: false, reason: 'unsigned', snap };
      }
      return { ok: false, reason: 'offline', snap };
    }
  } else {
    // Unsigned: stay silent on YouTube — connect only via popup / site
    return { ok: false, reason: 'unsigned', snap, found: false, overlay: null };
  }

  // Not in OG Tracker catalog — no HUD, no sync, clear badge noise
  if (!lookup?.found) {
    await setBadge('');
    return { ok: true, found: false, snap, overlay: null, catalogMiss: true };
  }

  const watchSeconds = Number(snap.currentTime) || 0;
  let percent = Number(snap.percent) || 0;
  if (percent < 1 && watchSeconds >= 5) percent = 1;

  const serverPct =
    lookup?.progress?.percentWatched ?? lookup?.progress?.percent_watched ?? 0;
  const displayPct = Math.max(percent, serverPct);
  const resumeNudge = await buildResumeNudge(lookup, snap, snap.videoId);

  let synced = null;
  let syncMeta = null;
  if (percent > 0 && lookup.found && !lookup.locked) {
    synced = await syncProgress(snap.videoId, percent);
    if (synced?.paused) syncMeta = 'Paused';
    if (synced?.queued) syncMeta = 'Queued';
    if (synced?.progress) {
      const saved =
        synced.progress.percent_watched ??
        synced.progress.percentWatched ??
        percent;
      return {
        ok: true,
        found: true,
        snap: { ...snap, percent },
        synced,
        settings,
        overlay: buildOverlay({
          auth,
          lookup: synced.lookup || lookup,
          percent: Math.max(displayPct, saved),
          snap,
          syncMeta,
          resumeNudge,
          settings,
        }),
      };
    }
  }

  return {
    ok: true,
    found: Boolean(lookup?.found),
    skipped: percent <= 0,
    snap: { ...snap, percent },
    synced,
    settings,
    overlay: buildOverlay({
      auth,
      lookup,
      percent: displayPct,
      snap,
      syncMeta,
      resumeNudge,
      settings,
    }),
  };
}

async function cleanupExpiredConnectTabs() {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    const parsed = parseConnectUrl(tab.url || '');
    if (!parsed) continue;
    deadCodes.add(parsed.code);
    await stripCodeFromTab(tab.id, tab.url);
  }
}

async function flushQueue() {
  const queue = await getQueue();
  if (!queue.length) {
    await patchSyncStatus({ state: 'idle', queueLength: 0 });
    return { ok: true, remaining: 0 };
  }
  const remaining = [];
  for (const item of queue) {
    try {
      const result = await syncProgress(item.youtubeVideoId, item.percentWatched, {
        forceStatus: item.status || undefined,
        allowWhenPaused: true,
      });
      // Drop non-catalog / dead items — never keep syncing random YouTube
      if (result?.catalogMiss || result?.found === false) {
        await rememberMiss(item.youtubeVideoId);
        continue;
      }
      if (!result.ok && result.queued) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  await setQueue(remaining);
  await patchSyncStatus({
    state: remaining.length ? 'queued' : 'idle',
    queueLength: remaining.length,
    lastError: remaining.length ? 'Some items still queued' : null,
  });
  if (remaining.length) await setBadge('Q', '#d97706');
  return { ok: true, remaining: remaining.length };
}

async function getFullStatus() {
  const [auth, settings, sync, queue, lastLookup] = await Promise.all([
    getAuth(),
    getSettings(),
    getSyncStatus(),
    getQueue(),
    getLastLookup(),
  ]);
  return {
    ok: true,
    signedIn: Boolean(auth.token),
    email: auth.email,
    apiOrigin: auth.apiOrigin,
    settings,
    sync: { ...sync, queueLength: queue.length },
    queueLength: queue.length,
    lastLookup,
    conflictPolicyLabel: 'Highest progress wins',
  };
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message?.type) {
      sendResponse({ ok: false });
      return;
    }

    switch (message.type) {
      case MSG.AUTH_CODE:
        sendResponse(
          await handleAuthCode({
            ...message,
            tabId: message.tabId || sender?.tab?.id,
            href: message.href || sender?.tab?.url,
          })
        );
        return;
      case MSG.PROGRESS_UPDATE:
        sendResponse(
          await syncProgress(message.youtubeVideoId, message.percentWatched)
        );
        return;
      case MSG.POLL_YOUTUBE_TAB:
      case MSG.PLAYER_EVENT:
        sendResponse(
          await pollYoutubeTab(sender?.tab?.id || message.tabId, {
            reason: message.reason || message.event || 'poll',
          })
        );
        return;
      case MSG.SYNC_ACTIVE_TAB: {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab?.id || !tab.url?.includes('youtube.com')) {
          sendResponse({ ok: false, error: 'Open a YouTube watch tab first' });
          return;
        }
        sendResponse(await pollYoutubeTab(tab.id, { reason: 'manual' }));
        return;
      }
      case MSG.GET_STATUS:
        sendResponse(await getFullStatus());
        return;
      case MSG.SET_SETTINGS:
        sendResponse({ ok: true, settings: await setSettings(message.patch || {}) });
        return;
      case MSG.TOGGLE_PAUSE: {
        const settings = await getSettings();
        const next = await setSettings({ syncPaused: !settings.syncPaused });
        sendResponse({ ok: true, settings: next });
        return;
      }
      case MSG.FLUSH_QUEUE:
        sendResponse(await flushQueue());
        return;
      case MSG.MARK_COMPLETE: {
        const videoId = message.youtubeVideoId;
        const result = await syncProgress(videoId, 100, {
          forceStatus: 'COMPLETED',
          allowWhenPaused: true,
        });
        sendResponse(result);
        return;
      }
      case MSG.MARK_SKIP: {
        const videoId = message.youtubeVideoId;
        const result = await syncProgress(videoId, message.percentWatched ?? 0, {
          forceStatus: 'SKIPPED',
          allowWhenPaused: true,
        });
        const nextId =
          result.lookup?.siblings?.next?.youtubeVideoId ||
          message.nextVideoId ||
          null;
        sendResponse({ ...result, nextVideoId: nextId });
        return;
      }
      case MSG.RESUME_NUDGE_DISMISS:
        await dismissResumeNudge(message.youtubeVideoId);
        sendResponse({ ok: true });
        return;
      case MSG.SEEK_PERCENT: {
        const tabId = sender?.tab?.id || message.tabId;
        sendResponse(await seekTabToPercent(tabId, message.percent));
        return;
      }
      case MSG.GET_SHARE: {
        const status = await getFullStatus();
        const lookup = status.lastLookup;
        if (!lookup?.found || !lookup.path?.slug) {
          sendResponse({ ok: false, error: 'No active path to share' });
          return;
        }
        const origin = (status.apiOrigin || DEFAULT_API_ORIGIN).replace(/\/$/, '');
        const url = `${origin}/og-trackers/${lookup.path.slug}`;
        const pct = lookup.pathProgress?.percent ?? lookup.progress?.percentWatched ?? 0;
        const text = `I'm ${pct}% through “${lookup.path.title}” on 10Tracker OG Trackers. ${url}`;
        sendResponse({ ok: true, text, url, title: lookup.path.title, percent: pct });
        return;
      }
      case MSG.LOOKUP:
        try {
          sendResponse({
            ok: true,
            data: await cachedLookup(message.youtubeVideoId, { force: true }),
          });
        } catch (err) {
          sendResponse({ ok: false, error: err.message, code: err.code });
        }
        return;
      case MSG.DISCONNECT:
        try {
          await revokeCurrentToken();
        } catch {
          /* ignore */
        }
        await clearAuth();
        lastPostedPercent.clear();
        lookupCache.clear();
        await setBadge('');
        sendResponse({ ok: true });
        return;
      case MSG.OPEN_CONNECT: {
        const auth = await getAuth();
        const origin = message.apiOrigin || auth.apiOrigin || DEFAULT_API_ORIGIN;
        await setAuth({ apiOrigin: origin });
        await browser.tabs.create({
          url: `${origin.replace(/\/$/, '')}/extension/connect`,
        });
        sendResponse({ ok: true });
        return;
      }
      case MSG.FINISH_CONNECT_FROM_TABS: {
        const auth = await getAuth();
        if (auth.token) {
          sendResponse({ ok: true, email: auth.email, already: true });
          return;
        }
        const tabs = await browser.tabs.query({});
        let lastError = null;
        for (const tab of tabs) {
          const result = await tryCaptureConnectFromTab(tab);
          if (result?.ok) {
            sendResponse(result);
            return;
          }
          if (result && !result.ok && result.error && !result.dead) {
            lastError = result.error;
          }
        }
        sendResponse({
          ok: false,
          error:
            lastError ||
            'No fresh connect tab. Click Connect → Authorize again.',
        });
        return;
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message' });
    }
  })().catch((err) => sendResponse({ ok: false, error: err.message }));

  return true;
});

browser.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'EXTENSION_AUTH_CODE' || message?.type === MSG.AUTH_CODE) {
    handleAuthCode({
      code: message.code,
      apiOrigin: message.apiOrigin,
    })
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  return false;
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && !changeInfo.url) return;
  const url = changeInfo.url || tab?.url;
  if (!url || !url.includes('/extension/connected')) return;
  void tryCaptureConnectFromTab({ id: tabId, url });
});

browser.alarms.create('flush-progress-queue', { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush-progress-queue') void flushQueue();
});

browser.runtime.onInstalled.addListener(() => {
  void cleanupExpiredConnectTabs();
  void flushQueue();
});

browser.runtime.onStartup?.addListener?.(() => {
  void cleanupExpiredConnectTabs();
});
