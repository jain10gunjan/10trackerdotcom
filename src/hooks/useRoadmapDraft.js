'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearDraft,
  countDirtyTasks,
  getDirtyTasks,
  loadDraft,
  mergeProgressMap,
  persistDraft,
} from '@/lib/roadmaps/draftStore';

export function useRoadmapDraft(slug, serverProgressMap, userKey) {
  const [draft, setDraft] = useState({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraft(loadDraft(slug, userKey));
    setHydrated(true);
  }, [slug, userKey]);

  useEffect(() => {
    if (!hydrated || userKey === 'guest') return;
    const guestDraft = loadDraft(slug, 'guest');
    if (!Object.keys(guestDraft).length) return;
    setDraft((prev) => {
      const merged = { ...guestDraft, ...prev };
      clearDraft(slug, 'guest');
      return merged;
    });
  }, [slug, userKey, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    persistDraft(slug, userKey, draft);
  }, [slug, userKey, draft, hydrated]);

  const mergedMap = useMemo(
    () => mergeProgressMap(serverProgressMap, draft),
    [serverProgressMap, draft]
  );

  const dirtyCount = useMemo(
    () => countDirtyTasks(serverProgressMap, draft),
    [serverProgressMap, draft]
  );

  const updateTask = useCallback((taskId, patch) => {
    setDraft((prev) => {
      const next = { ...prev };
      const existing = next[taskId] || {};
      const merged = {
        ...existing,
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.user_notes !== undefined ? { user_notes: patch.user_notes } : {}),
      };

      const server = serverProgressMap[taskId] || { status: 'not_completed', user_notes: '' };
      const status = merged.status ?? server.status;
      const notes = merged.user_notes ?? server.user_notes ?? '';
      if (status === server.status && notes === (server.user_notes || '')) {
        delete next[taskId];
      } else {
        next[taskId] = merged;
      }
      return next;
    });
  }, [serverProgressMap]);

  const toggleComplete = useCallback(
    (taskId) => {
      const current =
        mergedMap[taskId]?.status ||
        serverProgressMap[taskId]?.status ||
        'not_completed';
      updateTask(taskId, {
        status: current === 'completed' ? 'not_completed' : 'completed',
      });
    },
    [mergedMap, serverProgressMap, updateTask]
  );

  const setNotes = useCallback(
    (taskId, user_notes) => {
      updateTask(taskId, { user_notes });
    },
    [updateTask]
  );

  const discardChanges = useCallback(() => {
    clearDraft(slug, userKey);
    setDraft({});
  }, [slug, userKey]);

  const getTasksToSave = useCallback(
    () => getDirtyTasks(serverProgressMap, draft),
    [serverProgressMap, draft]
  );

  const resetDraftAfterSave = useCallback(() => {
    clearDraft(slug, userKey);
    setDraft({});
  }, [slug, userKey]);

  useEffect(() => {
    if (!dirtyCount) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyCount]);

  return {
    mergedMap,
    draft,
    dirtyCount,
    isDirty: dirtyCount > 0,
    hydrated,
    updateTask,
    toggleComplete,
    setNotes,
    discardChanges,
    getTasksToSave,
    resetDraftAfterSave,
  };
}
