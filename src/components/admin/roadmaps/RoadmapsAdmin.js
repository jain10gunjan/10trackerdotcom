'use client';

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

const FOCUS_PRESETS = ['Java', 'Aptitude', 'DSA', 'Computer Networks', 'Operating System', 'DBMS'];

function emptyDayForm() {
  return {
    day_number: '',
    time_required: '',
    notes: '',
    focusAreas: [
      {
        focus_area: 'DSA',
        tasks: [{ task_id: uuidv4(), task: '', resources: '' }],
      },
    ],
  };
}

function emptyRoadmapForm() {
  return {
    slug: '',
    title: '',
    description: '',
    price_inr: '',
    free_preview_days: '',
    exam_slug: '',
    sort_order: 0,
    is_active: true,
  };
}

function dayToForm(day) {
  return {
    day_number: String(day.day_number),
    time_required: day.time_required || '',
    notes: day.notes || '',
    focusAreas: (day.focus_areas || []).map((fa) => ({
      focus_area: fa.focus_area,
      tasks: (fa.tasks || []).map((t) => ({
        task_id: t.task_id || uuidv4(),
        task: t.task || '',
        resources: t.resources || '',
      })),
    })),
  };
}

function roadmapToForm(r) {
  return {
    slug: r.slug || '',
    title: r.title || '',
    description: r.description || '',
    price_inr: String(r.price_inr ?? ''),
    free_preview_days: String(r.free_preview_days ?? ''),
    exam_slug: r.exam_slug || '',
    sort_order: r.sort_order ?? 0,
    is_active: r.is_active !== false,
  };
}

export default function RoadmapsAdmin() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupHint, setSetupHint] = useState(null);
  const [roadmapForm, setRoadmapForm] = useState(emptyRoadmapForm());
  const [editRoadmapForm, setEditRoadmapForm] = useState(null);
  const [dayForm, setDayForm] = useState(emptyDayForm());
  const [editingDayId, setEditingDayId] = useState(null);
  const [creatingRoadmap, setCreatingRoadmap] = useState(false);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [savingDay, setSavingDay] = useState(false);

  const fetchRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roadmaps', { credentials: 'include' });
      const data = await parseJsonResponse(res);
      if (!data.success) throw new Error(data.setupHint || data.error);
      setSetupHint(data.setupHint || null);
      setRoadmaps(data.roadmaps || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load roadmaps', { duration: 8000 });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDays = useCallback(async (roadmapId) => {
    if (!roadmapId) return;
    const res = await fetch(`/api/admin/roadmaps/${roadmapId}/days`, { credentials: 'include' });
    const data = await parseJsonResponse(res);
    if (data.success) setDays(data.days || []);
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  useEffect(() => {
    if (selectedId) fetchDays(selectedId);
    else setDays([]);
    setEditingDayId(null);
    setDayForm(emptyDayForm());
  }, [selectedId, fetchDays]);

  useEffect(() => {
    const selected = roadmaps.find((r) => r.id === selectedId);
    setEditRoadmapForm(selected ? roadmapToForm(selected) : null);
  }, [selectedId, roadmaps]);

  const handleUpdateRoadmap = async (e) => {
    e.preventDefault();
    if (!selectedId || !editRoadmapForm) return;
    setSavingRoadmap(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/admin/roadmaps', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedId,
              ...editRoadmapForm,
              price_inr: Number(editRoadmapForm.price_inr),
              free_preview_days: Number(editRoadmapForm.free_preview_days),
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error);
          await fetchRoadmaps();
          return 'Roadmap updated';
        },
        { loading: 'Saving…', success: (m) => m, error: (e) => e.message }
      );
    } finally {
      setSavingRoadmap(false);
    }
  };

  const startEditDay = (day) => {
    setEditingDayId(day.id);
    setDayForm(dayToForm(day));
  };

  const cancelEditDay = () => {
    setEditingDayId(null);
    setDayForm(emptyDayForm());
  };

  const handleSaveDay = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSavingDay(true);
    const wasEdit = Boolean(editingDayId);
    try {
      await toastPromise(
        async () => {
          const payload = {
            day_number: Number(dayForm.day_number),
            time_required: dayForm.time_required,
            notes: dayForm.notes,
            focus_areas: dayForm.focusAreas,
          };
          const res = await fetch(`/api/admin/roadmaps/${selectedId}/days`, {
            method: wasEdit ? 'PATCH' : 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wasEdit ? { id: editingDayId, ...payload } : payload),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error);
          cancelEditDay();
          await fetchDays(selectedId);
          return wasEdit ? 'Day updated' : 'Day added';
        },
        {
          loading: wasEdit ? 'Updating day…' : 'Adding day…',
          success: (m) => m,
          error: (e) => e.message,
        }
      );
    } finally {
      setSavingDay(false);
    }
  };

  const handleCreateRoadmap = async (e) => {
    e.preventDefault();
    setCreatingRoadmap(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/admin/roadmaps', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...roadmapForm,
              price_inr: Number(roadmapForm.price_inr),
              free_preview_days: Number(roadmapForm.free_preview_days),
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error);
          setRoadmapForm(emptyRoadmapForm());
          await fetchRoadmaps();
          setSelectedId(data.roadmap.id);
          return 'Roadmap created';
        },
        { loading: 'Creating roadmap…', success: (m) => m, error: (e) => e.message }
      );
    } finally {
      setCreatingRoadmap(false);
    }
  };

  const handleAddDay = handleSaveDay;

  const deleteDay = async (dayId) => {
    if (!selectedId || !confirm('Delete this day?')) return;
    try {
      const res = await fetch(
        `/api/admin/roadmaps/${selectedId}/days?dayId=${encodeURIComponent(dayId)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      const data = await parseJsonResponse(res);
      if (!data.success) throw new Error(data.error);
      await fetchDays(selectedId);
      toast.success('Day deleted');
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const selected = roadmaps.find((r) => r.id === selectedId);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {setupHint && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Run <code className="text-xs bg-white px-1 rounded">scripts/setup_roadmaps.sql</code> in
          Supabase, then reload schema.
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Create roadmap</h2>
        <form onSubmit={handleCreateRoadmap} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Slug *</span>
            <input
              required
              value={roadmapForm.slug}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="placement-cse"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Title *</span>
            <input
              required
              value={roadmapForm.title}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-neutral-700">Description</span>
            <textarea
              value={roadmapForm.description}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Price (INR) *</span>
            <input
              type="number"
              required
              min={1}
              value={roadmapForm.price_inr}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, price_inr: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Exam slug (optional)</span>
            <input
              value={roadmapForm.exam_slug}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, exam_slug: e.target.value }))}
              placeholder="gate-cse"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <span className="text-xs text-neutral-500 mt-0.5 block">
              Matches platform_exams.slug for catalog filters
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-700">Free preview days *</span>
            <input
              type="number"
              required
              min={0}
              value={roadmapForm.free_preview_days}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, free_preview_days: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creatingRoadmap}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creatingRoadmap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create roadmap
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Roadmaps</h2>
        {roadmaps.length === 0 ? (
          <p className="text-sm text-neutral-500">No roadmaps yet.</p>
        ) : (
          <ul className="space-y-2 mb-6">
            {roadmaps.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm ${
                    selectedId === r.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <span className="font-semibold text-neutral-900">{r.title}</span>
                  <span className="text-neutral-500 ml-2">/{r.slug}</span>
                  <span className="block text-xs text-neutral-500 mt-0.5">
                    ₹{r.price_inr} · {r.free_preview_days} preview days ·{' '}
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && editRoadmapForm && (
          <form onSubmit={handleUpdateRoadmap} className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 grid gap-3 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm font-semibold text-emerald-900 flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit roadmap
            </p>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">Slug</span>
              <input
                required
                value={editRoadmapForm.slug}
                onChange={(e) => setEditRoadmapForm((f) => ({ ...f, slug: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">Title</span>
              <input
                required
                value={editRoadmapForm.title}
                onChange={(e) => setEditRoadmapForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-neutral-700">Description</span>
              <textarea
                value={editRoadmapForm.description}
                onChange={(e) => setEditRoadmapForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">Price (INR)</span>
              <input
                type="number"
                required
                min={1}
                value={editRoadmapForm.price_inr}
                onChange={(e) => setEditRoadmapForm((f) => ({ ...f, price_inr: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">Free preview days</span>
              <input
                type="number"
                required
                min={0}
                value={editRoadmapForm.free_preview_days}
                onChange={(e) =>
                  setEditRoadmapForm((f) => ({ ...f, free_preview_days: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">Exam slug</span>
              <input
                value={editRoadmapForm.exam_slug}
                onChange={(e) => setEditRoadmapForm((f) => ({ ...f, exam_slug: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={editRoadmapForm.is_active}
                onChange={(e) => setEditRoadmapForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <span className="font-medium text-neutral-700">Active (visible in catalog)</span>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingRoadmap}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingRoadmap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save roadmap
              </button>
            </div>
          </form>
        )}

        {selected && (
          <>
            <p className="text-sm text-neutral-600 mb-4">
              Managing <strong>{selected.title}</strong> ·{' '}
              <a
                href={`/roadmaps/${selected.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Preview
              </a>
            </p>

            <ul className="mb-6 space-y-2 max-h-64 overflow-y-auto">
              {days.map((d) => (
                <li
                  key={d.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    editingDayId === d.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-neutral-100'
                  }`}
                >
                  <span>
                    Day {d.day_number} · {(d.focus_areas || []).length} focus areas
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditDay(d)}
                      className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                      title="Edit day"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDay(d.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-900">
                {editingDayId ? 'Edit day' : 'Add day'}
              </h3>
              {editingDayId ? (
                <button
                  type="button"
                  onClick={cancelEditDay}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel edit
                </button>
              ) : null}
            </div>
            <form onSubmit={handleSaveDay} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  Day number *
                  <input
                    type="number"
                    required
                    min={1}
                    value={dayForm.day_number}
                    onChange={(e) => setDayForm((f) => ({ ...f, day_number: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Time required
                  <input
                    value={dayForm.time_required}
                    onChange={(e) => setDayForm((f) => ({ ...f, time_required: e.target.value }))}
                    placeholder="5h"
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-neutral-700">Day notes / description</span>
                <span className="text-neutral-400 font-normal"> (optional — shown to students)</span>
                <textarea
                  value={dayForm.notes}
                  onChange={(e) => setDayForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="What to focus on today, tips, links context…"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
              </label>

              {dayForm.focusAreas.map((fa, fi) => (
                <div key={fi} className="rounded-xl border border-neutral-200 p-4 space-y-3">
                  <label className="block text-sm">
                    Focus area
                    <select
                      value={fa.focus_area}
                      onChange={(e) => {
                        const next = [...dayForm.focusAreas];
                        next[fi] = { ...next[fi], focus_area: e.target.value };
                        setDayForm((f) => ({ ...f, focusAreas: next }));
                      }}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                    >
                      {FOCUS_PRESETS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fa.tasks.map((t, ti) => (
                    <div key={ti} className="grid gap-2 sm:grid-cols-2">
                      <input
                        placeholder="Task description *"
                        value={t.task}
                        onChange={(e) => {
                          const next = [...dayForm.focusAreas];
                          const tasks = [...next[fi].tasks];
                          tasks[ti] = { ...tasks[ti], task: e.target.value };
                          next[fi] = { ...next[fi], tasks };
                          setDayForm((f) => ({ ...f, focusAreas: next }));
                        }}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Resource URL"
                        value={t.resources}
                        onChange={(e) => {
                          const next = [...dayForm.focusAreas];
                          const tasks = [...next[fi].tasks];
                          tasks[ti] = { ...tasks[ti], resources: e.target.value };
                          next[fi] = { ...next[fi], tasks };
                          setDayForm((f) => ({ ...f, focusAreas: next }));
                        }}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs font-medium text-neutral-600"
                    onClick={() => {
                      const next = [...dayForm.focusAreas];
                      next[fi].tasks.push({ task_id: uuidv4(), task: '', resources: '' });
                      setDayForm((f) => ({ ...f, focusAreas: next }));
                    }}
                  >
                    + Add task
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="text-sm font-medium text-neutral-700"
                onClick={() =>
                  setDayForm((f) => ({
                    ...f,
                    focusAreas: [
                      ...f.focusAreas,
                      {
                        focus_area: 'Aptitude',
                        tasks: [{ task_id: uuidv4(), task: '', resources: '' }],
                      },
                    ],
                  }))
                }
              >
                + Add focus area
              </button>

              <button
                type="submit"
                disabled={savingDay}
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingDay ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingDayId ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingDayId ? 'Save day changes' : 'Add day to roadmap'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
