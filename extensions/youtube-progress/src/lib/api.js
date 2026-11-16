import { getAuth, clearAuth } from './storage.js';

async function apiFetch(path, { method = 'GET', body } = {}) {
  const auth = await getAuth();
  if (!auth.token) {
    const err = new Error('Not signed in');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const url = `${auth.apiOrigin.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    await clearAuth();
    const err = new Error(json.error || 'Unauthorized');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  if (!res.ok || json.success === false) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

export async function exchangeCode(apiOrigin, code) {
  const url = `${apiOrigin.replace(/\/$/, '')}/api/extension/auth/exchange`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, label: 'Chrome · YouTube Progress' }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to exchange connect code');
  }
  return json;
}

export async function lookupByYoutube(videoId) {
  return apiFetch(`/api/extension/og/by-youtube?v=${encodeURIComponent(videoId)}`);
}

export async function postProgress({
  youtubeVideoId,
  percentWatched,
  status,
}) {
  const body = { youtubeVideoId, percentWatched };
  if (status) body.status = status;
  return apiFetch('/api/extension/og/progress', {
    method: 'POST',
    body,
  });
}

export async function revokeCurrentToken() {
  return apiFetch('/api/extension/auth/revoke', {
    method: 'POST',
    body: {},
  });
}
