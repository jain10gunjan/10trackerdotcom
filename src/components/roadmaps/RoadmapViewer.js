'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  Save,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import LegalTermsCheckbox from '@/components/legal/LegalTermsCheckbox';
import RoadmapCheckout from '@/components/roadmaps/RoadmapCheckout';
import { calculateDayProgress } from '@/lib/roadmaps/progressUtils';
import { parseJsonResponse } from '@/lib/toastAsync';

export default function RoadmapViewer({ slug }) {
  const { user, setShowAuthModal } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [noteDraft, setNoteDraft] = useState({});
  const [savingTask, setSavingTask] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roadmaps/${encodeURIComponent(slug)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await parseJsonResponse(res);
      if (!json.success) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const progressMap = data?.progressMap || {};

  const filteredDays = useMemo(() => {
    const days = data?.days || [];
    if (!searchQuery.trim()) return days;
    const q = searchQuery.toLowerCase();
    return days.filter((d) => `day ${d.day_number}`.includes(q));
  }, [data?.days, searchQuery]);

  const updateTask = async (taskId, patch) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSavingTask(taskId);
    try {
      const res = await fetch(`/api/roadmaps/${encodeURIComponent(slug)}/progress`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...patch }),
      });
      const json = await parseJsonResponse(res);
      if (!json.success) throw new Error(json.error);
      setData((prev) =>
        prev
          ? {
              ...prev,
              progress: json.progress,
              progressMap: json.progressMap,
            }
          : prev
      );
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSavingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/roadmaps" className="text-sm font-medium text-neutral-700 underline">
          ← All roadmaps
        </Link>
      </div>
    );
  }

  const { roadmap, purchased, progress, totalDays, unlockedDayCount, days } = data;
  const needsPurchase = !purchased && unlockedDayCount < totalDays;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/roadmaps"
        className="text-sm text-neutral-500 hover:text-neutral-900 mb-6 inline-block"
      >
        ← All roadmaps
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">{roadmap.title}</h1>
        {roadmap.description ? (
          <p className="mt-2 text-neutral-600 max-w-2xl leading-relaxed">{roadmap.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100">
            <BookOpen className="w-4 h-4" />
            {totalDays} days
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100">
            ₹{roadmap.price_inr} one-time
          </span>
          {roadmap.free_preview_days > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
              First {roadmap.free_preview_days} day{roadmap.free_preview_days === 1 ? '' : 's'} free
            </span>
          ) : null}
          {purchased ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              Purchased · {progress.percent}% complete
            </span>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {error}
        </p>
      ) : null}

      {needsPurchase && (
        <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">
            {purchased ? null : 'Unlock the full roadmap'}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {roadmap.free_preview_days > 0
              ? `You have full access to day 1–${roadmap.free_preview_days}. Purchase once for lifetime access to all ${totalDays} days.`
              : `Purchase once for lifetime access to all ${totalDays} days while 10Tracker operates.`}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Unlimited plans cover practice & mock tests only. Roadmaps are separate products. All
            sales are final — no refunds.
          </p>
          {!purchased && (
            <div className="mt-4 max-w-md">
              <LegalTermsCheckbox
                id="roadmap-checkout-terms"
                checked={termsAccepted}
                onChange={setTermsAccepted}
                returnPath={`/roadmaps/${slug}`}
                className="mb-4"
              />
              <RoadmapCheckout
                roadmapSlug={slug}
                roadmapTitle={roadmap.title}
                priceInr={roadmap.price_inr}
                termsAccepted={termsAccepted}
                onSuccess={load}
              />
            </div>
          )}
        </section>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          placeholder="Search by day number…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      <div className="space-y-3">
        {filteredDays.map((day) => {
          const dayProgress = day.locked
            ? 0
            : calculateDayProgress(
                { focus_areas: day.focus_areas },
                progressMap
              );

          return (
            <button
              key={day.id || day.day_number}
              type="button"
              onClick={() => !day.locked && setSelectedDay(day)}
              disabled={day.locked}
              className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition-shadow ${
                day.locked
                  ? 'border-neutral-200 bg-neutral-50 opacity-80 cursor-not-allowed'
                  : 'border-neutral-200 bg-white hover:shadow-md cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {day.locked ? (
                    <Lock className="w-5 h-5 text-neutral-400 shrink-0" />
                  ) : (
                    <Calendar className="w-5 h-5 text-neutral-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">Day {day.day_number}</p>
                    {day.time_required ? (
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {day.time_required}
                      </p>
                    ) : null}
                    {day.locked ? (
                      <p className="text-xs text-neutral-500 mt-1">
                        {(day.focus_area_labels || []).join(' · ')} · {day.task_count} tasks
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!day.locked && (
                    <span className="text-sm font-medium tabular-nums text-neutral-700">
                      {dayProgress}%
                    </span>
                  )}
                  {!day.locked && <ChevronRight className="w-4 h-4 text-neutral-400" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && !selectedDay.locked && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/50">
          <div className="bg-white w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Day {selectedDay.day_number}</h2>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-lg hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              {(selectedDay.focus_areas || []).map((fa, fi) => (
                <div key={fi}>
                  <h3 className="font-semibold text-neutral-900 mb-3">{fa.focus_area}</h3>
                  <ul className="space-y-4">
                    {(fa.tasks || []).map((task) => (
                      <li
                        key={task.task_id}
                        className="rounded-xl border border-neutral-100 p-4 bg-neutral-50/50"
                      >
                        <p className="text-sm font-medium text-neutral-900">{task.task}</p>
                        {task.resources ? (
                          <a
                            href={task.resources}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Resource
                          </a>
                        ) : null}
                        <select
                          value={progressMap[task.task_id]?.status || 'not_completed'}
                          disabled={savingTask === task.task_id}
                          onChange={(e) =>
                            updateTask(task.task_id, { status: e.target.value })
                          }
                          className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
                        >
                          <option value="not_completed">Not completed</option>
                          <option value="completed">Completed</option>
                        </select>
                        <textarea
                          rows={2}
                          placeholder="Notes…"
                          value={
                            noteDraft[task.task_id] ??
                            progressMap[task.task_id]?.user_notes ??
                            ''
                          }
                          onChange={(e) =>
                            setNoteDraft((p) => ({ ...p, [task.task_id]: e.target.value }))
                          }
                          className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
                        />
                        <button
                          type="button"
                          disabled={savingTask === task.task_id}
                          onClick={() =>
                            updateTask(task.task_id, {
                              userNotes: noteDraft[task.task_id] ?? '',
                            })
                          }
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save note
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
