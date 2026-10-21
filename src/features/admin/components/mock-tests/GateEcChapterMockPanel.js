'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';
import { mockTestAdminBase } from '@/features/mock-test/lib/mockTestAdminPaths';
import { mockTestHrefForSlug } from '@/lib/platformExams';

export default function GateEcChapterMockPanel({ examcategory = 'gate-ec' }) {
  const base = mockTestAdminBase(examcategory);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [addToMotd, setAddToMotd] = useState(false);
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mock-test/admin/gate-ec/chapters?category=${encodeURIComponent(examcategory)}`,
        { credentials: 'include' }
      );
      const data = await parseJsonResponse(res);
      if (!data.success) throw new Error(data.error || 'Failed to load chapters');
      setSubjects(data.subjects || []);
      setChapters(data.chapters || []);
      setSubject((prev) => prev || data.subjects?.[0] || '');
    } catch (e) {
      toast.error(e.message || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  }, [examcategory]);

  useEffect(() => {
    load();
  }, [load]);

  const chaptersForSubject = useMemo(
    () => chapters.filter((c) => c.subject === subject),
    [chapters, subject]
  );

  useEffect(() => {
    setChapter('');
  }, [subject]);

  const selectedMeta = chaptersForSubject.find((c) => c.chapter === chapter);

  const handleCreate = async () => {
    if (!subject || !chapter) {
      toast.error('Select subject and chapter');
      return;
    }
    setBusy(true);
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/mock-test/admin/gate-ec/chapter-create', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examCategory: examcategory,
              subject,
              chapter,
              totalQuestions: 20,
              durationMinutes: 45,
              addToMotdPool: addToMotd,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(
              data.available != null
                ? `${data.error} (available: ${data.available})`
                : data.error || 'Create failed'
            );
          }
          setCreated(data.test);
          return data.message || 'Chapter mock created';
        },
        {
          loading: 'Picking 20 random questions…',
          success: (msg) => msg,
          error: (e) => e.message || 'Create failed',
        }
      );
    } catch {
      /* toasted */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Chapter mock
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">GATE EC · one chapter</h1>
        <p className="mt-1 text-sm text-neutral-600">
          You pick the chapter; we randomly select <strong>20 questions</strong> from the bank
          and create a <strong>45 minute</strong> mock (GATE +1/−⅓ marking).
        </p>
      </div>

      {created ? (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-neutral-900">Mock created</p>
          <p className="mt-1 text-sm text-neutral-600">{created.name}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`${mockTestHrefForSlug(examcategory)}/attempt/${created.id}`}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Open attempt
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setChapter('');
              }}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              Create another
            </button>
            <Link
              href={base}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              Back to admin
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-neutral-700">
                Subject
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-neutral-700">
                Chapter
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Select chapter…</option>
                  {chaptersForSubject.map((c) => (
                    <option key={`${c.subject}-${c.chapter}`} value={c.chapter}>
                      {c.chapter} ({c.count} Q)
                    </option>
                  ))}
                </select>
              </label>

              {selectedMeta ? (
                <p className="text-xs text-neutral-500">
                  Bank has <strong>{selectedMeta.count}</strong> questions in this chapter.
                  {selectedMeta.count < 20 ? (
                    <span className="text-rose-600"> Need at least 20 to create.</span>
                  ) : (
                    <span> Will pick 20 at random.</span>
                  )}
                </p>
              ) : null}

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={addToMotd}
                  onChange={(e) => setAddToMotd(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                Add to Mock of the Day pool
              </label>

              <button
                type="button"
                disabled={busy || !chapter || (selectedMeta && selectedMeta.count < 20)}
                onClick={handleCreate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Create 20Q / 45 min mock
              </button>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-sm text-neutral-500">
        <Link href={base} className="font-medium text-neutral-700 hover:underline">
          ← Back to {examcategory} mocks
        </Link>
      </p>
    </div>
  );
}
