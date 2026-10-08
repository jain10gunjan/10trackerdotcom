'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Loader2,
  Sparkles,
  Power,
  Trash2,
  Plus,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';
import { mockTestHrefForSlug } from '@/lib/platformExams';

const DIFFICULTIES = ['mixed', 'easy', 'medium', 'hard'];

export default function MockOfTheDayAdminPanel({ examcategory, tests = [], onPoolChange }) {
  const studentHub = mockTestHrefForSlug(examcategory);
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState([]);
  const [today, setToday] = useState(null);
  const [setupHint, setSetupHint] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [addingId, setAddingId] = useState('');

  const [form, setForm] = useState({
    totalQuestions: 30,
    duration: 45,
    difficulty: 'mixed',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mock-test/admin/mock-of-day?category=${encodeURIComponent(examcategory)}`,
        { credentials: 'include' }
      );
      const data = await parseJsonResponse(res);
      if (!data.success) {
        throw new Error(
          data.setupHint ? `${data.error}\n${data.setupHint}` : data.error || 'Failed to load'
        );
      }
      setPool(data.pool || []);
      setToday(data.today || null);
      setSetupHint(data.setupRequired ? data.setupHint : null);
      if (data.defaults) {
        setForm((prev) => ({
          totalQuestions: data.defaults.totalQuestions ?? prev.totalQuestions,
          duration: data.defaults.duration ?? prev.duration,
          difficulty: data.defaults.difficulty ?? prev.difficulty,
        }));
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load MOTD pool', { duration: 8000 });
      setPool([]);
    } finally {
      setLoading(false);
    }
  }, [examcategory]);

  useEffect(() => {
    load();
  }, [load]);

  const poolIds = useMemo(
    () => new Set(pool.map((p) => p.mockTestId).filter(Boolean)),
    [pool]
  );

  const addableTests = useMemo(
    () =>
      (tests || []).filter(
        (t) =>
          t.isActive &&
          t.id &&
          !poolIds.has(t.id) &&
          !String(t.creationMode || '')
            .toLowerCase()
            .includes('topic')
      ),
    [tests, poolIds]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/mock-of-day', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate',
              examCategory: examcategory,
              totalQuestions: Number(form.totalQuestions),
              duration: Number(form.duration),
              difficulty: form.difficulty,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(
              data.setupHint ? `${data.error}\n${data.setupHint}` : data.error || 'Generate failed'
            );
          }
          await load();
          onPoolChange?.();
          return data.message || 'MOTD mock generated';
        },
        {
          loading: 'Generating mock from question bank…',
          success: (msg) => msg,
          error: (e) => e.message || 'Generate failed',
        }
      );
    } catch {
      /* toasted */
    } finally {
      setGenerating(false);
    }
  };

  const handleAddExisting = async () => {
    if (!addingId) {
      toast.error('Select a mock to add');
      return;
    }
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/mock-of-day', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add',
              examCategory: examcategory,
              mockTestId: addingId,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(
              data.setupHint ? `${data.error}\n${data.setupHint}` : data.error || 'Add failed'
            );
          }
          setAddingId('');
          await load();
          onPoolChange?.();
          return data.message || 'Added to pool';
        },
        {
          loading: 'Adding to pool…',
          success: (msg) => msg,
          error: (e) => e.message || 'Add failed',
        }
      );
    } catch {
      /* toasted */
    }
  };

  const toggleActive = async (item) => {
    setBusyId(item.id);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/mock-of-day', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examCategory: examcategory,
              poolId: item.id,
              is_active: !item.isActive,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error || 'Update failed');
          await load();
          return item.isActive ? 'Removed from rotation' : 'Included in rotation';
        },
        {
          loading: 'Updating…',
          success: (msg) => msg,
          error: (e) => e.message || 'Update failed',
        }
      );
    } catch {
      /* toasted */
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Remove "${item.mock?.name || 'mock'}" from the MOTD pool?`)) return;
    setBusyId(item.id);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/mock-of-day', {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examCategory: examcategory,
              poolId: item.id,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error || 'Remove failed');
          await load();
          return 'Removed from pool';
        },
        {
          loading: 'Removing…',
          success: (msg) => msg,
          error: (e) => e.message || 'Remove failed',
        }
      );
    } catch {
      /* toasted */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
              Homepage · daily rotation (IST)
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-neutral-900">
              <Sparkles className="h-4 w-4 text-violet-600" />
              Mock of the Day pool
            </h2>
            <p className="mt-1 text-sm text-neutral-600 max-w-2xl">
              Generate mocks from the question bank or add existing ones. One active pool
              mock is shown per calendar day (IST) on the signed-in homepage.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {setupHint ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Run <code className="rounded bg-white px-1 text-xs">{setupHint}</code> in
            Supabase SQL Editor.
          </div>
        ) : null}

        {today?.status === 'ready' && today.mock ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Today · {today.date} IST
            </p>
            <p className="mt-1 font-semibold text-neutral-900">{today.mock.name}</p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {today.mock.totalQuestions} Qs · {today.mock.duration} min ·{' '}
              {today.mock.difficulty}
              {today.poolSize != null
                ? ` · pool #${(today.poolIndex ?? 0) + 1}/${today.poolSize}`
                : ''}
            </p>
            <Link
              href={today.mock.href || `${studentHub}/attempt/${today.mock.id}`}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
            >
              Preview attempt
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
            No Mock of the Day yet — generate one or add mocks to the pool.
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
          <p className="text-sm font-semibold text-neutral-900">One-click generate</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Builds a new mock from the bank and adds it to this exam’s pool.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="block text-xs font-medium text-neutral-600">
              Questions
              <input
                type="number"
                min={5}
                max={200}
                value={form.totalQuestions}
                onChange={(e) =>
                  setForm((p) => ({ ...p, totalQuestions: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-neutral-600">
              Duration (min)
              <input
                type="number"
                min={5}
                max={300}
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-neutral-600 sm:col-span-2">
              Difficulty
              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={generating || Boolean(setupHint)}
            onClick={handleGenerate}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate &amp; add to pool
          </button>
        </div>

        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-900">Add existing mock</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              value={addingId}
              onChange={(e) => setAddingId(e.target.value)}
              className="w-full flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select an active full mock…</option>
              {addableTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.totalQuestions ?? 0} Qs)
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!addingId || Boolean(setupHint)}
              onClick={handleAddExisting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add to pool
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">
            Pool ({pool.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : pool.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
              Pool is empty. Generate a mock to start daily rotation.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
              {pool.map((item) => {
                const busy = busyId === item.id;
                const isToday =
                  today?.status === 'ready' && today?.mock?.id === item.mockTestId;
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.mock?.name || item.mockTestId}
                        {isToday ? (
                          <span className="ml-2 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-800">
                            Today
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.mock?.totalQuestions ?? '—'} Qs · {item.mock?.duration ?? '—'}{' '}
                        min · {item.isActive ? 'In rotation' : 'Paused'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                      ) : (
                        <>
                          {item.mock?.href ? (
                            <Link
                              href={item.mock.href}
                              target="_blank"
                              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50"
                              title="Preview"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            title={item.isActive ? 'Pause in rotation' : 'Include in rotation'}
                            onClick={() => toggleActive(item)}
                            className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Remove from pool"
                            onClick={() => removeItem(item)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
