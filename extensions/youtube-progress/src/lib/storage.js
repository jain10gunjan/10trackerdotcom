import browser from './browser.js';

const KEYS = {
  token: 'authToken',
  email: 'authEmail',
  expiresAt: 'authExpiresAt',
  apiOrigin: 'apiOrigin',
  queue: 'progressQueue',
  lastLookup: 'lastLookup',
  settings: 'extSettings',
  syncStatus: 'extSyncStatus',
  resumeDismiss: 'resumeDismissals',
  missCache: 'lookupMissCache',
};

const DEFAULT_API_ORIGIN = 'https://www.10tracker.com';

export const DEFAULT_SETTINGS = Object.freeze({
  syncPaused: false,
  /** Always on — only OG Tracker path videos sync. Not user-toggleable. */
  catalogOnly: true,
  conflictPolicy: 'max',
  batterySaver: true,
});

export const DEFAULT_SYNC_STATUS = Object.freeze({
  state: 'idle',
  queueLength: 0,
  lastError: null,
  lastSyncedAt: null,
  lastVideoId: null,
});

export async function getAuth() {
  const data = await browser.storage.local.get([
    KEYS.token,
    KEYS.email,
    KEYS.expiresAt,
    KEYS.apiOrigin,
  ]);
  return {
    token: data[KEYS.token] || null,
    email: data[KEYS.email] || null,
    expiresAt: data[KEYS.expiresAt] || null,
    apiOrigin: data[KEYS.apiOrigin] || DEFAULT_API_ORIGIN,
  };
}

export async function setAuth({ token, email, expiresAt, apiOrigin }) {
  const patch = {};
  if (token !== undefined) patch[KEYS.token] = token;
  if (email !== undefined) patch[KEYS.email] = email;
  if (expiresAt !== undefined) patch[KEYS.expiresAt] = expiresAt;
  if (apiOrigin !== undefined) patch[KEYS.apiOrigin] = apiOrigin;
  await browser.storage.local.set(patch);
}

export async function clearAuth() {
  await browser.storage.local.remove([KEYS.token, KEYS.email, KEYS.expiresAt]);
}

export async function getQueue() {
  const data = await browser.storage.local.get(KEYS.queue);
  return Array.isArray(data[KEYS.queue]) ? data[KEYS.queue] : [];
}

export async function setQueue(queue) {
  await browser.storage.local.set({ [KEYS.queue]: queue.slice(-50) });
}

export async function enqueueProgress(item) {
  const queue = await getQueue();
  const next = queue.filter((q) => q.youtubeVideoId !== item.youtubeVideoId);
  next.push(item);
  await setQueue(next);
  await patchSyncStatus({
    state: 'queued',
    queueLength: next.length,
    lastVideoId: item.youtubeVideoId,
  });
}

export async function setLastLookup(lookup) {
  await browser.storage.local.set({ [KEYS.lastLookup]: lookup });
}

export async function getLastLookup() {
  const data = await browser.storage.local.get(KEYS.lastLookup);
  return data[KEYS.lastLookup] || null;
}

export async function getSettings() {
  const data = await browser.storage.local.get(KEYS.settings);
  // catalogOnly is hard-locked — never honor a stored false
  return {
    ...DEFAULT_SETTINGS,
    ...(data[KEYS.settings] || {}),
    catalogOnly: true,
  };
}

export async function setSettings(patch) {
  const current = await getSettings();
  const next = {
    ...current,
    ...patch,
    catalogOnly: true,
  };
  await browser.storage.local.set({ [KEYS.settings]: next });
  return next;
}

export async function getSyncStatus() {
  const data = await browser.storage.local.get(KEYS.syncStatus);
  return { ...DEFAULT_SYNC_STATUS, ...(data[KEYS.syncStatus] || {}) };
}

export async function patchSyncStatus(patch) {
  const current = await getSyncStatus();
  const next = { ...current, ...patch };
  await browser.storage.local.set({ [KEYS.syncStatus]: next });
  return next;
}

/** @returns {Record<string, string>} videoId → YYYY-MM-DD dismiss day */
export async function getResumeDismissals() {
  const data = await browser.storage.local.get(KEYS.resumeDismiss);
  return data[KEYS.resumeDismiss] && typeof data[KEYS.resumeDismiss] === 'object'
    ? data[KEYS.resumeDismiss]
    : {};
}

export async function dismissResumeNudge(videoId) {
  const map = await getResumeDismissals();
  map[videoId] = new Date().toISOString().slice(0, 10);
  await browser.storage.local.set({ [KEYS.resumeDismiss]: map });
}

export async function isResumeDismissedToday(videoId) {
  const map = await getResumeDismissals();
  return map[videoId] === new Date().toISOString().slice(0, 10);
}

const MISS_TTL_MS = 24 * 60 * 60 * 1000;

export async function getMissCache() {
  const data = await browser.storage.local.get(KEYS.missCache);
  return data[KEYS.missCache] && typeof data[KEYS.missCache] === 'object'
    ? data[KEYS.missCache]
    : {};
}

export async function rememberMiss(videoId) {
  const map = await getMissCache();
  map[videoId] = Date.now();
  // prune old
  const cutoff = Date.now() - MISS_TTL_MS;
  for (const [id, at] of Object.entries(map)) {
    if (Number(at) < cutoff) delete map[id];
  }
  await browser.storage.local.set({ [KEYS.missCache]: map });
}

export async function clearMiss(videoId) {
  const map = await getMissCache();
  if (map[videoId]) {
    delete map[videoId];
    await browser.storage.local.set({ [KEYS.missCache]: map });
  }
}

export async function isKnownMiss(videoId) {
  const map = await getMissCache();
  const at = Number(map[videoId] || 0);
  return at > 0 && Date.now() - at < MISS_TTL_MS;
}

export { DEFAULT_API_ORIGIN, KEYS, MISS_TTL_MS };
