'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import VendorAdminNav from './VendorAdminNav';
import VendorPortalShell from './VendorPortalShell';

const EMPTY_TEST = {
  title: '',
  description: '',
  instructions: '',
  duration_minutes: 60,
  negative_marking: 0,
  passing_marks: '',
  max_attempts: 1,
  shuffle_questions: false,
  shuffle_options: false,
  anti_cheat_enabled: true,
  result_release: 'instant',
  starts_at: '',
  ends_at: '',
};

export default function VendorTestsClient({ slug }) {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [bank, setBank] = useState([]);
  const [form, setForm] = useState(EMPTY_TEST);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/tests`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load tests');
      setTests(data.tests || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadBank = useCallback(async () => {
    const res = await fetch(`/api/practice-tests/${slug}/questions?limit=200`);
    const data = await res.json();
    if (res.ok && data.success) setBank(data.questions || []);
  }, [slug]);

  useEffect(() => {
    loadTests();
    loadBank();
  }, [loadTests, loadBank]);

  const createTest = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        passing_marks: form.passing_marks === '' ? null : Number(form.passing_marks),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      const res = await fetch(`/api/practice-tests/${slug}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Create failed');
      toast.success('Draft test created');
      setForm(EMPTY_TEST);
      setSelectedTestId(data.test.id);
      setSelectedQuestionIds([]);
      await loadTests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openTest = async (testId) => {
    setSelectedTestId(testId);
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/tests/${testId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setSelectedQuestionIds((data.questionPins || []).map((p) => p.question_id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const savePins = async () => {
    if (!selectedTestId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/practice-tests/${slug}/tests/${selectedTestId}/questions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: selectedQuestionIds }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save questions');
      toast.success(`${data.count} questions pinned`);
      await loadTests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (testId, status) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
      toast.success(`Test ${status}`);
      await loadTests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const seedSample = async () => {
    if (!confirm('Create a sample published test with a few questions?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/seed-sample`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Seed failed');
      toast.success(`Sample test ready (${data.questionCount} questions)`);
      await loadTests();
      await loadBank();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleQ = (id) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <VendorPortalShell>
    <div className="mx-auto max-w-4xl px-4">
      <VendorAdminNav slug={slug} active="admin/tests" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tests</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Draft → publish → archive. Pin questions from the vendor bank.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={seedSample}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800"
        >
          <Sparkles className="h-4 w-4" /> Seed sample test
        </button>
      </div>

      <form
        onSubmit={createTest}
        className="mt-8 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm font-semibold">Create draft test</h2>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="sm:col-span-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="sm:col-span-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          rows={2}
        />
        <textarea
          placeholder="Instructions"
          value={form.instructions}
          onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          className="sm:col-span-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          rows={2}
        />
        <label className="text-sm">
          Duration (min)
          <input
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))
            }
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          Negative marking (per wrong)
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.negative_marking}
            onChange={(e) =>
              setForm((f) => ({ ...f, negative_marking: Number(e.target.value) }))
            }
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          Max attempts
          <input
            type="number"
            min={1}
            value={form.max_attempts}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_attempts: Number(e.target.value) }))
            }
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          Result release
          <select
            value={form.result_release}
            onChange={(e) => setForm((f) => ({ ...f, result_release: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="instant">instant</option>
            <option value="after_window">after_window</option>
            <option value="manual">manual</option>
          </select>
        </label>
        <label className="text-sm">
          Starts at
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          Ends at
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.shuffle_questions}
            onChange={(e) =>
              setForm((f) => ({ ...f, shuffle_questions: e.target.checked }))
            }
          />
          Shuffle questions
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.shuffle_options}
            onChange={(e) => setForm((f) => ({ ...f, shuffle_options: e.target.checked }))}
          />
          Shuffle options
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.anti_cheat_enabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, anti_cheat_enabled: e.target.checked }))
            }
          />
          Anti-cheat enabled
        </label>
        <button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Create draft
        </button>
      </form>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-neutral-900">Existing tests</h2>
        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {tests.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{t.title}</p>
                    <p className="text-xs text-neutral-500">
                      {t.status} · {t.duration_minutes} min · {t.total_questions} Q · max{' '}
                      {t.max_attempts} attempts
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openTest(t.id)}
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                    >
                      Edit questions
                    </button>
                    {t.status !== 'published' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(t.id, 'published')}
                        className="rounded-lg bg-teal-700 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(t.id, 'archived')}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                      >
                        Archive
                      </button>
                    )}
                    {t.status === 'archived' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(t.id, 'draft')}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                      >
                        Back to draft
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedTestId ? (
        <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold">
            Pin questions ({selectedQuestionIds.length} selected)
          </h2>
          <p className="mt-1 text-xs text-neutral-500">Test id: {selectedTestId}</p>
          {bank.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              Question bank is empty. Add questions first.
            </p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {bank.map((q) => (
                <li key={q._id} className="flex gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedQuestionIds.includes(q._id)}
                    onChange={() => toggleQ(q._id)}
                  />
                  <div>
                    <p className="text-xs text-neutral-500">
                      {q.topic} · {q.difficulty}
                    </p>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: String(q.question || '').slice(0, 160),
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={savePins}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Save question set
          </button>
        </section>
      ) : null}
    </div>
    </VendorPortalShell>
  );
}
