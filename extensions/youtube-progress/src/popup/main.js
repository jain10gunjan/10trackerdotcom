import browser from '../lib/browser.js';
import { MSG } from '../lib/messages.js';
import { getAuth, DEFAULT_API_ORIGIN } from '../lib/storage.js';

const els = {
  unsigned: document.getElementById('auth-unsigned'),
  signed: document.getElementById('auth-signed'),
  email: document.getElementById('auth-email'),
  connect: document.getElementById('btn-connect'),
  disconnect: document.getElementById('btn-disconnect'),
  devices: document.getElementById('link-devices'),
  status: document.getElementById('video-status'),
  path: document.getElementById('link-path'),
  banner: document.getElementById('sync-banner'),
  goalCard: document.getElementById('goal-card'),
  goalStatus: document.getElementById('goal-status'),
  setPause: document.getElementById('set-pause'),
  setBattery: document.getElementById('set-battery'),
  retry: document.getElementById('btn-retry'),
  share: document.getElementById('btn-share'),
};

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

function extractVideoId(url) {
  try {
    const u = new URL(url);
    const v = u.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
  } catch {
    /* ignore */
  }
  return null;
}

function setBanner(text, kind = '') {
  if (!els.banner) return;
  if (!text) {
    els.banner.classList.add('hidden');
    els.banner.textContent = '';
    return;
  }
  els.banner.textContent = text;
  els.banner.classList.remove('hidden', 'ok', 'err');
  if (kind) els.banner.classList.add(kind);
}

function setAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  if (!msg) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function refreshAuthUi(status) {
  const auth = status
    ? {
        token: status.signedIn,
        email: status.email,
        apiOrigin: status.apiOrigin,
      }
    : await getAuth();
  const signedIn = Boolean(status?.signedIn ?? auth.token);
  if (signedIn) {
    els.unsigned.classList.add('hidden');
    els.signed.classList.remove('hidden');
    els.email.textContent = status?.email || auth.email || 'Connected';
    const origin = (status?.apiOrigin || auth.apiOrigin || DEFAULT_API_ORIGIN).replace(
      /\/$/,
      ''
    );
    els.devices.href = `${origin}/extension/devices`;
  } else {
    els.signed.classList.add('hidden');
    els.unsigned.classList.remove('hidden');
  }
  return { ...auth, token: signedIn ? auth.token || true : null };
}

function applySettingsUi(settings) {
  if (!settings) return;
  if (els.setPause) els.setPause.checked = Boolean(settings.syncPaused);
  if (els.setBattery) els.setBattery.checked = settings.batterySaver !== false;
}

function applySyncBanner(status) {
  const sync = status?.sync || {};
  const q = status?.queueLength ?? sync.queueLength ?? 0;
  if (q > 0) {
    setBanner(`Queued (${q}) — offline or failed posts waiting`, '');
    return;
  }
  if (sync.state === 'error' && sync.lastError) {
    setBanner(sync.lastError, 'err');
    return;
  }
  if (sync.lastSyncedAt) {
    setBanner('Synced', 'ok');
    return;
  }
  setBanner('');
}

function applyGoal(data) {
  const week = data?.weekGoal;
  if (!week || !els.goalCard) {
    els.goalCard?.classList.add('hidden');
    return;
  }
  els.goalCard.classList.remove('hidden');
  els.goalStatus.textContent = `${week.weeklyCompleted} / ${week.weeklyGoal} videos this week${
    week.weeklyMet ? ' · goal met' : ''
  }`;
}

async function refreshVideoUi(auth) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const videoId = tab?.url ? extractVideoId(tab.url) : null;

  if (!videoId) {
    els.status.textContent = 'Open a YouTube watch page to track progress.';
    els.path.classList.add('hidden');
    els.goalCard?.classList.add('hidden');
    return;
  }

  if (!auth?.token) {
    els.status.textContent = `Video ${videoId}\nSign in to sync progress.`;
    els.path.classList.add('hidden');
    return;
  }

  els.status.textContent = `Checking ${videoId}…`;
  const result = await send(MSG.LOOKUP, { youtubeVideoId: videoId });

  if (!result.ok) {
    els.status.textContent = result.error || 'Lookup failed';
    els.path.classList.add('hidden');
    return;
  }

  const data = result.data;
  const origin = (auth.apiOrigin || DEFAULT_API_ORIGIN).replace(/\/$/, '');

  if (!data.found) {
    els.status.textContent =
      'Not in your OG Tracker paths — this video is ignored (tracker catalog only).';
    els.path.classList.add('hidden');
    els.goalCard?.classList.add('hidden');
    return;
  }

  if (data.locked) {
    els.status.textContent = `${data.resource?.title || 'Video'}\nPremium — unlock to track`;
    els.path.href = `${origin}/og-trackers/${data.path?.slug || ''}`;
    els.path.classList.remove('hidden');
    return;
  }

  const percent =
    data.progress?.percentWatched ?? data.progress?.percent_watched ?? 0;
  const device = data.progress?.lastDeviceLabel
    ? `\nLast synced: ${data.progress.lastDeviceLabel}`
    : '';
  const pathPct = data.pathProgress?.percent != null
    ? `\nPath ${data.pathProgress.completed}/${data.pathProgress.total} (${data.pathProgress.percent}%)`
    : '';
  els.status.textContent = `${data.resource?.title || 'Tracked video'}\n${percent}% · ${data.path?.title || 'Path'}${pathPct}${device}`;
  els.path.href = `${origin}/og-trackers/${data.path?.slug || ''}`;
  els.path.classList.remove('hidden');
  applyGoal(data);
}

async function openConnect(apiOrigin) {
  await send(MSG.OPEN_CONNECT, { apiOrigin });
  window.close();
}

els.connect.addEventListener('click', async () => {
  const auth = await getAuth();
  await openConnect(auth.apiOrigin || DEFAULT_API_ORIGIN);
});

document.getElementById('btn-finish')?.addEventListener('click', async () => {
  setAuthError(null);
  els.status.textContent = 'Finishing connect…';
  const result = await send(MSG.FINISH_CONNECT_FROM_TABS);
  if (!result.ok) {
    setAuthError(result.error || 'Connect failed. Click Authorize on the site again.');
    return;
  }
  const status = await send(MSG.GET_STATUS);
  const auth = await refreshAuthUi(status);
  applySettingsUi(status.settings);
  applySyncBanner(status);
  els.status.textContent = `Connected as ${result.email || status.email || 'you'}`;
  await refreshVideoUi(auth);
});

els.disconnect.addEventListener('click', async () => {
  await send(MSG.DISCONNECT);
  const status = await send(MSG.GET_STATUS);
  await refreshAuthUi(status);
  els.status.textContent = 'Disconnected';
  els.path.classList.add('hidden');
  setBanner('');
});

function formatSnap(snap) {
  const t = Math.floor(Number(snap?.currentTime) || 0);
  const d = Math.floor(Number(snap?.duration) || 0);
  const raw = snap?.rawPercent != null ? `${snap.rawPercent}% raw` : '';
  return `t=${t}s / ${d}s${raw ? ` · ${raw}` : ''}${snap?.paused ? ' · paused' : ''}`;
}

document.getElementById('btn-sync')?.addEventListener('click', async () => {
  setAuthError(null);
  els.status.textContent = 'Reading YouTube player…';
  const result = await send(MSG.SYNC_ACTIVE_TAB);
  if (!result.ok) {
    const detail = result.snap?.error || result.error || 'Sync failed';
    els.status.textContent = `Sync failed: ${detail}`;
    return;
  }
  if (result.skipped) {
    els.status.textContent = `Still 0% saved — ${formatSnap(result.snap)}. Play past 5 seconds, then Sync again.`;
    return;
  }
  const percent =
    result.synced?.progress?.percent_watched ??
    result.synced?.progress?.percentWatched ??
    result.snap?.percent ??
    0;
  els.status.textContent = `Synced ${percent}% · ${formatSnap(result.snap)}`;
  const status = await send(MSG.GET_STATUS);
  applySyncBanner(status);
  await refreshVideoUi({
    token: status.signedIn,
    apiOrigin: status.apiOrigin,
  });
});

async function patchSetting(key, value) {
  await send(MSG.SET_SETTINGS, { patch: { [key]: value } });
  const status = await send(MSG.GET_STATUS);
  applySettingsUi(status.settings);
  applySyncBanner(status);
}

els.setPause?.addEventListener('change', () =>
  patchSetting('syncPaused', els.setPause.checked)
);
els.setBattery?.addEventListener('change', () =>
  patchSetting('batterySaver', els.setBattery.checked)
);

els.retry?.addEventListener('click', async () => {
  els.status.textContent = 'Retrying queue…';
  const result = await send(MSG.FLUSH_QUEUE);
  const status = await send(MSG.GET_STATUS);
  applySyncBanner(status);
  els.status.textContent =
    result.remaining > 0
      ? `${result.remaining} still queued`
      : 'Queue cleared';
});

els.share?.addEventListener('click', async () => {
  const result = await send(MSG.GET_SHARE);
  if (!result.ok) {
    els.status.textContent = result.error || 'Nothing to share';
    return;
  }
  try {
    if (navigator.share) {
      await navigator.share({ title: result.title, text: result.text, url: result.url });
    } else {
      await navigator.clipboard.writeText(result.text);
      els.status.textContent = 'Share text copied';
    }
  } catch {
    try {
      await navigator.clipboard.writeText(result.text);
      els.status.textContent = 'Share text copied';
    } catch {
      els.status.textContent = result.text;
    }
  }
});

(async () => {
  let status = await send(MSG.GET_STATUS);
  if (!status.signedIn) {
    const finish = await send(MSG.FINISH_CONNECT_FROM_TABS);
    if (finish.ok) {
      status = await send(MSG.GET_STATUS);
      els.status.textContent = `Connected as ${finish.email || status.email || 'you'}`;
    }
  }

  const auth = await refreshAuthUi(status);
  applySettingsUi(status.settings);
  applySyncBanner(status);

  if (status.lastLookup?.found && status.lastLookup.resource?.title) {
    els.status.textContent = `${status.lastLookup.resource.title}\n${
      status.lastLookup.progress?.percentWatched ?? 0
    }% (last sync)`;
    applyGoal(status.lastLookup);
  }
  await refreshVideoUi(auth);
})();
