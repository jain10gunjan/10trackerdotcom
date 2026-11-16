/**
 * YouTube watch-page agent — event-driven + soft safety tick.
 */

import browser from '../lib/browser.js';
import { MSG } from '../lib/messages.js';
import { renderOverlay, hideOverlay } from './overlay.js';

const SAFETY_TICK_MS = 10_000;
const HIDDEN_TICK_MS = 30_000;

let lastHref = location.href;
let safetyTimer = null;
let inFlight = false;
let lastVideoId = null;
let playerHooked = false;
let lastEventAt = 0;

function isWatchPage() {
  try {
    const url = new URL(location.href);
    return url.hostname.includes('youtube.com') && Boolean(url.searchParams.get('v'));
  } catch {
    return false;
  }
}

function currentVideoId() {
  try {
    return new URL(location.href).searchParams.get('v');
  } catch {
    return null;
  }
}

function send(type, payload = {}) {
  return new Promise((resolve) => {
    browser.runtime.sendMessage({ type, ...payload }, (response) => {
      if (browser.runtime.lastError) {
        resolve({ ok: false, error: browser.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false });
    });
  });
}

function applyOverlay(result) {
  const videoId = currentVideoId();
  if (!videoId) {
    hideOverlay();
    return;
  }

  // Strict catalog: never show HUD on random YouTube (incl. unsigned)
  const overlay = result?.overlay;
  if (!overlay || result?.found === false || result?.catalogMiss) {
    hideOverlay();
    return;
  }

  renderOverlay({
    videoId,
    forceShow: videoId !== lastVideoId,
    onAction: handleOverlayAction,
    ...overlay,
  });
  lastVideoId = videoId;
}

async function handleOverlayAction(action, view) {
  const videoId = view?.videoId || currentVideoId();
  if (!videoId) return;

  if (action === 'pause') {
    await send(MSG.TOGGLE_PAUSE);
    void poll('toggle-pause');
    return;
  }
  if (action === 'complete') {
    await send(MSG.MARK_COMPLETE, { youtubeVideoId: videoId });
    void poll('complete');
    return;
  }
  if (action === 'skip') {
    const result = await send(MSG.MARK_SKIP, {
      youtubeVideoId: videoId,
      nextVideoId: view.nextVideoId,
      percentWatched: view.percent,
    });
    const nextId = result.nextVideoId || view.nextVideoId;
    if (nextId) {
      location.href = `https://www.youtube.com/watch?v=${nextId}`;
    } else {
      void poll('skip');
    }
    return;
  }
  if (action === 'next' && view.nextVideoId) {
    location.href = `https://www.youtube.com/watch?v=${view.nextVideoId}`;
    return;
  }
  if (action === 'resume-seek' && view.resumeNudge?.percent != null) {
    await send(MSG.SEEK_PERCENT, { percent: view.resumeNudge.percent });
    await send(MSG.RESUME_NUDGE_DISMISS, { youtubeVideoId: videoId });
    void poll('resume-seek');
    return;
  }
  if (action === 'resume-dismiss') {
    await send(MSG.RESUME_NUDGE_DISMISS, { youtubeVideoId: videoId });
    void poll('resume-dismiss');
  }
}

async function poll(reason = 'tick') {
  if (!isWatchPage() || inFlight) return;
  inFlight = true;
  try {
    const result = await send(MSG.PLAYER_EVENT, { reason, event: reason });
    applyOverlay(result);
  } finally {
    inFlight = false;
  }
}

function scheduleSafetyTick() {
  if (safetyTimer) clearInterval(safetyTimer);
  const ms =
    document.visibilityState === 'hidden' ? HIDDEN_TICK_MS : SAFETY_TICK_MS;
  safetyTimer = setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      lastVideoId = null;
      playerHooked = false;
      hideOverlay();
      hookPlayer();
    }
    if (!isWatchPage()) {
      hideOverlay();
      return;
    }
    // Soft fallback if MAIN events went quiet
    if (Date.now() - lastEventAt > ms) {
      void poll('interval');
    }
  }, ms);
}

function hookPlayer() {
  if (!isWatchPage() || playerHooked) return;
  void injectMainBridge();
}

async function injectMainBridge() {
  try {
    // Ask SW to inject by polling tab — content doesn't have tabId for scripting.
    // Instead listen for yt navigation and use postMessage from page via custom event
    // injected once via inline script element (isolated → MAIN bridge).
    if (document.getElementById('tt-player-bridge')) {
      playerHooked = true;
      return;
    }
    const script = document.createElement('script');
    script.id = 'tt-player-bridge';
    script.textContent = `
      (function () {
        if (window.__ttPlayerBridge) return;
        window.__ttPlayerBridge = true;
        var last = 0;
        function emit(kind) {
          var now = Date.now();
          if (kind === 'timeupdate' && now - last < 2000) return;
          last = now;
          window.postMessage({ source: 'tt-player', kind: kind }, '*');
        }
        function attach() {
          var videos = Array.prototype.slice.call(document.querySelectorAll('video'));
          if (!videos.length) return false;
          videos.sort(function (a, b) {
            return (b.duration || 0) - (a.duration || 0);
          });
          var v = videos[0];
          if (v.__ttBound) return true;
          v.__ttBound = true;
          ['play', 'pause', 'seeking', 'seeked', 'ended', 'timeupdate'].forEach(function (ev) {
            v.addEventListener(ev, function () { emit(ev); }, { passive: true });
          });
          emit('bound');
          return true;
        }
        var tries = 0;
        var timer = setInterval(function () {
          tries += 1;
          if (attach() || tries > 40) clearInterval(timer);
        }, 500);
        document.addEventListener('yt-navigate-finish', function () {
          tries = 0;
          timer = setInterval(function () {
            tries += 1;
            if (attach() || tries > 40) clearInterval(timer);
          }, 400);
        });
      })();
    `;
    (document.documentElement || document.head).appendChild(script);
    playerHooked = true;
  } catch {
    playerHooked = false;
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== 'tt-player') return;
  lastEventAt = Date.now();
  void poll(data.kind || 'player');
});

document.addEventListener(
  'visibilitychange',
  () => {
    scheduleSafetyTick();
    if (document.visibilityState === 'visible') {
      hookPlayer();
      void poll('visible');
    }
  },
  { passive: true }
);

document.addEventListener('yt-navigate-finish', () => {
  lastHref = location.href;
  lastVideoId = null;
  playerHooked = false;
  hideOverlay();
  hookPlayer();
  void poll('navigate');
});

scheduleSafetyTick();
hookPlayer();
setTimeout(() => void poll('start'), 600);
setTimeout(() => void poll('start2'), 2000);
