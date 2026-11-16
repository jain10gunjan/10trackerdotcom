'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Eye,
  Crown,
} from 'lucide-react';
import { RESOURCE_TYPES } from '@/features/og-trackers/lib/constants';
import { OG_TRACKER_ICONS } from '@/features/og-trackers/lib/trackerMeta';
import {
  buildMockTestUrl,
  buildPracticeChapterUrl,
} from '@/features/og-trackers/lib/platformUrls';

const TYPE_LABELS = {
  VIDEO: 'Video (YouTube)',
  PRACTICE_CHAPTER: 'Practice chapter (10Tracker)',
  MOCK_TEST: 'Mock test (10Tracker)',
  LEETCODE_PROBLEM: 'LeetCode problem',
  CODESTUDIO_PROBLEM: 'CodeStudio problem',
  HACKERRANK_PROBLEM: 'HackerRank problem',
};

const emptyPath = {
  title: '',
  slug: '',
  description: '',
  category: 'General',
  tags: '',
  icon: 'Map',
  sortOrder: 0,
  isPremium: false,
  isActive: true,
  sequentialUnlock: false,
  weeklyGoal: 3,
  unlockThreshold: 70,
};

const emptyResource = {
  type: 'VIDEO',
  title: '',
  sortOrder: 0,
  youtubeVideoId: '',
  durationSeconds: '',
  externalSlug: '',
  difficulty: '',
  externalUrl: '',
  isPremium: null,
  sectionLabel: '',
  practiceArea: '',
  practiceSubject: '',
  practiceChapter: '',
  practiceThreshold: '70',
  mockExamCategory: '',
  mockTestId: '',
};

function resourceFormFromRow(r) {
  const meta = r.meta && typeof r.meta === 'object' ? r.meta : {};
  return {
    type: r.type,
    title: r.title,
    sortOrder: r.sort_order,
    youtubeVideoId: r.youtube_video_id || '',
    durationSeconds: r.duration_seconds ?? '',
    externalSlug: r.external_slug || '',
    difficulty: r.difficulty || '',
    externalUrl: r.external_url || '',
    isPremium: r.is_premium,
    sectionLabel: r.section_label || '',
    practiceArea: meta.area || '',
    practiceSubject: meta.subject || '',
    practiceChapter: meta.chapter || '',
    practiceThreshold: String(meta.completionPercent ?? 70),
    mockExamCategory: meta.examCategory || '',
    mockTestId: meta.testId || '',
  };
}

function buildResourcePayload(resourceForm) {
  const type = resourceForm.type;
  const payload = {
    type,
    title: resourceForm.title,
    sortOrder: Number(resourceForm.sortOrder) || 0,
    durationSeconds: resourceForm.durationSeconds
      ? Number(resourceForm.durationSeconds)
      : null,
    difficulty: resourceForm.difficulty || null,
    isPremium:
      resourceForm.isPremium === '' || resourceForm.isPremium === null
        ? null
        : Boolean(resourceForm.isPremium),
    sectionLabel: resourceForm.sectionLabel || null,
  };

  if (type === 'VIDEO') {
    payload.youtubeVideoId = resourceForm.youtubeVideoId;
  } else if (type === 'PRACTICE_CHAPTER') {
    payload.meta = {
      area: resourceForm.practiceArea,
      subject: resourceForm.practiceSubject,
      chapter: resourceForm.practiceChapter,
      completionPercent: Number(resourceForm.practiceThreshold) || 70,
    };
  } else if (type === 'MOCK_TEST') {
    payload.meta = {
      examCategory: resourceForm.mockExamCategory,
      testId: resourceForm.mockTestId,
    };
  } else {
    payload.externalUrl = resourceForm.externalUrl;
    payload.externalSlug = resourceForm.externalSlug || null;
  }

  return payload;
}

export default function OgTrackersAdmin() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupHint, setSetupHint] = useState(null);
  const [error, setError] = useState(null);
  const [pathForm, setPathForm] = useState(emptyPath);
  const [editingPathId, setEditingPathId] = useState(null);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [editingResourceId, setEditingResourceId] = useState(null);

  const loadPaths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/og-trackers', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setPaths(data.paths || []);
      setSetupHint(data.setupRequired ? data.setupHint : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResources = useCallback(async (pathId) => {
    if (!pathId) {
      setResources([]);
      return;
    }
    const res = await fetch(`/api/admin/og-trackers/${pathId}`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.success) setResources(data.resources || []);
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  useEffect(() => {
    loadResources(selectedPathId);
  }, [selectedPathId, loadResources]);

  const savePath = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const url = editingPathId
        ? `/api/admin/og-trackers/${editingPathId}`
        : '/api/admin/og-trackers';
      const method = editingPathId ? 'PATCH' : 'POST';
      const payload = {
        ...pathForm,
        tags: pathForm.tags,
        sortOrder: Number(pathForm.sortOrder) || 0,
        isPremium: Boolean(pathForm.isPremium),
        isActive: Boolean(pathForm.isActive),
        sequentialUnlock: Boolean(pathForm.sequentialUnlock),
        weeklyGoal: Number(pathForm.weeklyGoal) || 3,
        unlockThreshold: Number(pathForm.unlockThreshold) || 70,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      setPathForm(emptyPath);
      setEditingPathId(null);
      await loadPaths();
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePath = async (id) => {
    if (!confirm('Delete this path and all resources?')) return;
    await fetch(`/api/admin/og-trackers/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (selectedPathId === id) setSelectedPathId(null);
    await loadPaths();
  };

  const togglePathPremium = async (path) => {
    setError(null);
    const nextPremium = !Boolean(path.is_premium);
    try {
      const res = await fetch(`/api/admin/og-trackers/${path.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPremium: nextPremium }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update premium');
      if (editingPathId === path.id) {
        setPathForm((prev) => ({ ...prev, isPremium: nextPremium }));
      }
      await loadPaths();
      if (selectedPathId === path.id) await loadResources(path.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveResource = async (e) => {
    e.preventDefault();
    if (!selectedPathId) return;
    setError(null);
    try {
      const payload = buildResourcePayload(resourceForm);

      let res;
      if (editingResourceId) {
        res = await fetch(`/api/admin/og-trackers/resources/${editingResourceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/og-trackers/${selectedPathId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      setResourceForm(emptyResource);
      setEditingResourceId(null);
      await loadResources(selectedPathId);
    } catch (err) {
      setError(err.message);
    }
  };

  const practicePreview = buildPracticeChapterUrl({
    area: resourceForm.practiceArea,
    subject: resourceForm.practiceSubject,
    chapter: resourceForm.practiceChapter,
  });
  const mockPreview = buildMockTestUrl({
    examCategory: resourceForm.mockExamCategory,
    testId: resourceForm.mockTestId,
  });

  const deleteResource = async (id) => {
    if (!confirm('Delete resource?')) return;
    await fetch(`/api/admin/og-trackers/resources/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await loadResources(selectedPathId);
  };

  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId) || null,
    [paths, selectedPathId]
  );

  const resourceCounts = useMemo(() => {
    const counts = {};
    for (const r of resources) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }
    return counts;
  }, [resources]);

  const moveResource = async (resourceId, direction) => {
    const idx = resources.findIndex((r) => r.id === resourceId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= resources.length) return;
    const a = resources[idx];
    const b = resources[swapIdx];
    setError(null);
    try {
      await Promise.all([
        fetch(`/api/admin/og-trackers/resources/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sortOrder: b.sort_order }),
        }),
        fetch(`/api/admin/og-trackers/resources/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sortOrder: a.sort_order }),
        }),
      ]);
      await loadResources(selectedPathId);
    } catch (err) {
      setError(err.message || 'Reorder failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">OG Trackers panel</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage study paths: modules, videos, practice, mocks, coding problems, unlock rules,
            and weekly goals.
          </p>
        </div>
        <Link
          href="/og-trackers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          <Eye className="w-4 h-4" />
          View catalog
        </Link>
      </div>

      {setupHint ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {setupHint}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900 mb-4">
          {editingPathId ? 'Edit tracker' : 'New tracker'}
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Study settings control ordered unlock, weekly goals, and unlock % for the path viewer.
          Run <code className="text-[11px]">add_og_trackers_path_study_settings.sql</code> if
          saves fail on new columns.
        </p>
        <form onSubmit={savePath} className="grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Title (e.g. Java, Web Dev, DSA)"
            value={pathForm.title}
            onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Slug (optional)"
            value={pathForm.slug}
            onChange={(e) => setPathForm({ ...pathForm, slug: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Category (e.g. GATE CSE)"
            value={pathForm.category}
            onChange={(e) => setPathForm({ ...pathForm, category: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Tags comma-separated (e.g. beginner, interview)"
            value={pathForm.tags}
            onChange={(e) => setPathForm({ ...pathForm, tags: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={pathForm.icon}
            onChange={(e) => setPathForm({ ...pathForm, icon: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          >
            {OG_TRACKER_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                Icon: {icon}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Sort order"
            value={pathForm.sortOrder}
            onChange={(e) => setPathForm({ ...pathForm, sortOrder: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={pathForm.description}
            onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
            className="sm:col-span-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            rows={2}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(pathForm.isPremium)}
              onChange={(e) => setPathForm({ ...pathForm, isPremium: e.target.checked })}
            />
            Premium tracker (paid)
            <span className="text-xs text-neutral-500">
              — turning off also unlocks all steps on this path
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pathForm.isActive}
              onChange={(e) => setPathForm({ ...pathForm, isActive: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={pathForm.sequentialUnlock}
              onChange={(e) =>
                setPathForm({ ...pathForm, sequentialUnlock: e.target.checked })
              }
            />
            Sequential unlock (finish previous step before next)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            placeholder="Weekly goal (steps)"
            value={pathForm.weeklyGoal}
            onChange={(e) => setPathForm({ ...pathForm, weeklyGoal: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            max={100}
            placeholder="Unlock threshold %"
            value={pathForm.unlockThreshold}
            onChange={(e) => setPathForm({ ...pathForm, unlockThreshold: e.target.value })}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              {editingPathId ? 'Update' : 'Create'}
            </button>
            {editingPathId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingPathId(null);
                  setPathForm(emptyPath);
                }}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100 font-medium text-sm">
          Paths {loading ? <Loader2 className="inline w-4 h-4 animate-spin ml-2" /> : null}
        </div>
        <ul className="divide-y divide-neutral-100">
          {paths.map((p) => (
            <li
              key={p.id}
              className={`px-5 py-3 flex items-center gap-3 text-sm ${
                selectedPathId === p.id ? 'bg-indigo-50/50' : ''
              }`}
            >
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => setSelectedPathId(p.id)}
              >
                <span className="font-medium text-neutral-900">{p.title}</span>
                <span className="block text-xs text-neutral-500">
                  {p.category || 'General'} · /{p.slug}
                  {p.is_premium ? ' · Premium' : ' · Free'}
                  {!p.is_active ? ' · Inactive' : ''}
                  {` · order ${p.sort_order ?? 0}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => togglePathPremium(p)}
                title={p.is_premium ? 'Switch to free' : 'Switch to premium'}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                  p.is_premium
                    ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                {p.is_premium ? 'Paid' : 'Free'}
              </button>
              <Link
                href={`/og-trackers/${p.slug}`}
                target="_blank"
                className="p-1.5 text-neutral-500 hover:text-neutral-900"
                title="Open live path"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEditingPathId(p.id);
                  setSelectedPathId(p.id);
                  setPathForm({
                    title: p.title,
                    slug: p.slug,
                    description: p.description || '',
                    category: p.category || 'General',
                    tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
                    icon: p.icon || 'Map',
                    sortOrder: p.sort_order || 0,
                    isPremium: p.is_premium,
                    isActive: p.is_active,
                    sequentialUnlock: Boolean(p.sequential_unlock),
                    weeklyGoal: p.weekly_goal ?? 3,
                    unlockThreshold: p.unlock_threshold ?? 70,
                  });
                }}
                className="p-1.5 text-neutral-500 hover:text-neutral-900"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deletePath(p.id)}
                className="p-1.5 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {!paths.length && !loading ? (
            <li className="px-5 py-8 text-center text-neutral-500 text-sm">No paths yet</li>
          ) : null}
        </ul>
      </section>

      {selectedPathId ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Resources
                {selectedPath ? (
                  <span className="text-neutral-500 font-normal">· {selectedPath.title}</span>
                ) : null}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {resources.length} steps
                {Object.entries(resourceCounts)
                  .map(([t, n]) => ` · ${n} ${TYPE_LABELS[t] || t}`)
                  .join('')}
              </p>
              {selectedPath ? (
                <p className="text-[11px] text-neutral-500 mt-1">
                  {selectedPath.sequential_unlock ? 'Sequential unlock on' : 'Free order'}
                  {` · weekly goal ${selectedPath.weekly_goal ?? 3}`}
                  {` · unlock ≥${selectedPath.unlock_threshold ?? 70}%`}
                </p>
              ) : null}
            </div>
            {selectedPath ? (
              <Link
                href={`/og-trackers/${selectedPath.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Preview path
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </div>
          <form onSubmit={saveResource} className="grid sm:grid-cols-2 gap-3">
            <select
              value={resourceForm.type}
              onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t] || t}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Title"
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Section / module (e.g. Day 1, Aptitude)"
              value={resourceForm.sectionLabel}
              onChange={(e) =>
                setResourceForm({ ...resourceForm, sectionLabel: e.target.value })
              }
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Sort order"
              value={resourceForm.sortOrder}
              onChange={(e) =>
                setResourceForm({ ...resourceForm, sortOrder: e.target.value })
              }
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />

            {resourceForm.type === 'VIDEO' ? (
              <>
                <input
                  placeholder="YouTube URL or video ID"
                  value={resourceForm.youtubeVideoId}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, youtubeVideoId: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  placeholder="Duration seconds (optional)"
                  value={resourceForm.durationSeconds}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, durationSeconds: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </>
            ) : null}

            {resourceForm.type === 'PRACTICE_CHAPTER' ? (
              <>
                <input
                  required
                  placeholder="Area / exam slug (e.g. gate-cse)"
                  value={resourceForm.practiceArea}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, practiceArea: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Subject slug (e.g. data-structures)"
                  value={resourceForm.practiceSubject}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, practiceSubject: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Chapter slug (e.g. trees)"
                  value={resourceForm.practiceChapter}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, practiceChapter: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Completion % threshold (default 70)"
                  value={resourceForm.practiceThreshold}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, practiceThreshold: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                {practicePreview ? (
                  <p className="sm:col-span-2 text-xs text-neutral-500 font-mono">
                    Link preview: {practicePreview}
                  </p>
                ) : null}
              </>
            ) : null}

            {resourceForm.type === 'MOCK_TEST' ? (
              <>
                <input
                  required
                  placeholder="Exam category (e.g. gate-cse)"
                  value={resourceForm.mockExamCategory}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, mockExamCategory: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Mock test UUID"
                  value={resourceForm.mockTestId}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, mockTestId: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                {mockPreview ? (
                  <p className="sm:col-span-2 text-xs text-neutral-500 font-mono">
                    Link preview: {mockPreview}
                  </p>
                ) : null}
              </>
            ) : null}

            {resourceForm.type !== 'VIDEO' &&
            resourceForm.type !== 'PRACTICE_CHAPTER' &&
            resourceForm.type !== 'MOCK_TEST' ? (
              <>
                <input
                  required
                  placeholder="Problem URL (e.g. https://leetcode.com/problems/two-sum/)"
                  value={resourceForm.externalUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    const inferred =
                      url.toLowerCase().includes('leetcode')
                        ? 'LEETCODE_PROBLEM'
                        : url.toLowerCase().includes('hackerrank')
                          ? 'HACKERRANK_PROBLEM'
                          : url.toLowerCase().includes('codingninjas') ||
                              url.toLowerCase().includes('codestudio')
                            ? 'CODESTUDIO_PROBLEM'
                            : resourceForm.type;
                    setResourceForm({
                      ...resourceForm,
                      externalUrl: url,
                      type: inferred,
                    });
                  }}
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  placeholder="Slug override (optional — auto from URL)"
                  value={resourceForm.externalSlug}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, externalSlug: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Difficulty"
                  value={resourceForm.difficulty}
                  onChange={(e) =>
                    setResourceForm({ ...resourceForm, difficulty: e.target.value })
                  }
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </>
            ) : null}

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white sm:col-span-2"
            >
              {editingResourceId ? 'Update resource' : 'Add resource'}
            </button>
            {editingResourceId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingResourceId(null);
                  setResourceForm(emptyResource);
                }}
                className="rounded-xl border px-4 py-2 text-sm sm:col-span-2"
              >
                Cancel edit
              </button>
            ) : null}
          </form>

          <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl">
            {resources.map((r, idx) => (
              <li key={r.id} className="px-4 py-3 flex items-center gap-2 text-sm">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveResource(r.id, 'up')}
                    className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === resources.length - 1}
                    onClick={() => moveResource(r.id, 'down')}
                    className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{r.title}</span>
                  <span className="block text-xs text-neutral-500">
                    {TYPE_LABELS[r.type] || r.type}
                    {r.section_label ? ` · ${r.section_label}` : ''}
                    {` · order ${r.sort_order}`}
                    {r.youtube_video_id ? ` · yt:${r.youtube_video_id}` : ''}
                    {r.external_url ? ` · ${r.external_url}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingResourceId(r.id);
                    setResourceForm(resourceFormFromRow(r));
                  }}
                  className="p-1.5 text-neutral-500"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteResource(r.id)}
                  className="p-1.5 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
            {!resources.length ? (
              <li className="px-4 py-8 text-center text-sm text-neutral-500">
                No resources yet — add videos, practice chapters, mocks, or coding problems.
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
