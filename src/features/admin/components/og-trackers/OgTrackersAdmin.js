'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { RESOURCE_TYPES } from '@/features/og-trackers/lib/constants';
import { OG_TRACKER_ICONS } from '@/features/og-trackers/lib/trackerMeta';

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
};

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

  const saveResource = async (e) => {
    e.preventDefault();
    if (!selectedPathId) return;
    setError(null);
    try {
      const payload = {
        ...resourceForm,
        durationSeconds: resourceForm.durationSeconds
          ? Number(resourceForm.durationSeconds)
          : null,
        isPremium:
          resourceForm.isPremium === '' || resourceForm.isPremium === null
            ? null
            : Boolean(resourceForm.isPremium),
      };

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

  const deleteResource = async (id) => {
    if (!confirm('Delete resource?')) return;
    await fetch(`/api/admin/og-trackers/resources/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await loadResources(selectedPathId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">OG Trackers</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Create multiple trackers (Java, Web Dev, DSA, …). Each has category, tags, icon,
          ordering, active/premium flags, and its own resources.
        </p>
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
          Each tracker is a flat learning path (e.g. Java, Web Dev, DSA) with its own videos and
          problems.
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
            placeholder="Category (e.g. Java, Web Dev)"
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
              checked={pathForm.isPremium}
              onChange={(e) => setPathForm({ ...pathForm, isPremium: e.target.checked })}
            />
            Premium tracker
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pathForm.isActive}
              onChange={(e) => setPathForm({ ...pathForm, isActive: e.target.checked })}
            />
            Active
          </label>
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
                  {p.is_premium ? ' · Premium' : ''}
                  {!p.is_active ? ' · Inactive' : ''}
                  {` · order ${p.sort_order ?? 0}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPathId(p.id);
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
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Resources
          </h2>
          <form onSubmit={saveResource} className="grid sm:grid-cols-2 gap-3">
            <select
              value={resourceForm.type}
              onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
            ) : (
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
            )}
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white sm:col-span-2"
            >
              {editingResourceId ? 'Update resource' : 'Add resource'}
            </button>
          </form>

          <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl">
            {resources.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{r.title}</span>
                  <span className="block text-xs text-neutral-500">
                    {r.type} · order {r.sort_order}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingResourceId(r.id);
                    setResourceForm({
                      type: r.type,
                      title: r.title,
                      sortOrder: r.sort_order,
                      youtubeVideoId: r.youtube_video_id || '',
                      durationSeconds: r.duration_seconds ?? '',
                      externalSlug: r.external_slug || '',
                      difficulty: r.difficulty || '',
                      externalUrl: r.external_url || '',
                      isPremium: r.is_premium,
                    });
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
          </ul>
        </section>
      ) : null}
    </div>
  );
}
