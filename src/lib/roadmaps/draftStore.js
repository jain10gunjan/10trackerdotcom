/** Client-side roadmap progress drafts (localStorage) before batch save to server. */

const STORAGE_PREFIX = 'roadmap-draft-v1';

export function draftStorageKey(slug, userKey = 'guest') {
  return `${STORAGE_PREFIX}:${slug}:${userKey || 'guest'}`;
}

export function loadDraft(slug, userKey) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(draftStorageKey(slug, userKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistDraft(slug, userKey, draft) {
  if (typeof window === 'undefined') return;
  const key = draftStorageKey(slug, userKey);
  if (!draft || !Object.keys(draft).length) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(draft));
}

export function clearDraft(slug, userKey) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(draftStorageKey(slug, userKey));
}

export function mergeProgressMap(serverMap = {}, draft = {}) {
  const merged = { ...(serverMap || {}) };
  for (const [taskId, patch] of Object.entries(draft)) {
    const base = merged[taskId] || { status: 'not_completed', user_notes: '' };
    merged[taskId] = {
      status: patch.status ?? base.status,
      user_notes: patch.user_notes ?? base.user_notes ?? '',
    };
  }
  return merged;
}

function serverEntry(serverMap, taskId) {
  return serverMap[taskId] || { status: 'not_completed', user_notes: '' };
}

export function isTaskDirty(serverMap, draft, taskId) {
  const patch = draft[taskId];
  if (!patch) return false;
  const server = serverEntry(serverMap, taskId);
  const status = patch.status ?? server.status;
  const notes = patch.user_notes ?? server.user_notes ?? '';
  return status !== server.status || notes !== (server.user_notes || '');
}

export function countDirtyTasks(serverMap, draft) {
  return Object.keys(draft).filter((taskId) => isTaskDirty(serverMap, draft, taskId)).length;
}

export function getDirtyTasks(serverMap, draft) {
  return Object.keys(draft)
    .filter((taskId) => isTaskDirty(serverMap, draft, taskId))
    .map((taskId) => {
      const patch = draft[taskId];
      const server = serverEntry(serverMap, taskId);
      return {
        taskId,
        status: patch.status ?? server.status,
        userNotes: patch.user_notes ?? server.user_notes ?? '',
      };
    });
}
