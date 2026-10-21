'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import VendorAdminNav from '@/features/vendor-tests/components/VendorAdminNav';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';

export default function AdminContestEditorClient({ slug, contestId }) {
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [selectedPid, setSelectedPid] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [problemForm, setProblemForm] = useState({
    title: '',
    statement: '',
    points: 100,
    cpu_time_limit: 2,
    wall_time_limit: 5,
    memory_limit_kb: 128000,
  });
  const emptyTcForm = {
    input: '',
    expected_output: '',
    is_hidden: true,
    sort_order: 0,
  };
  const [tcForm, setTcForm] = useState(emptyTcForm);
  const [editingTcId, setEditingTcId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-contests/${contestId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setContest(data.contest);
      setProblems(data.problems || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, contestId]);

  const loadCases = useCallback(
    async (pid) => {
      if (!pid) return;
      const res = await fetch(
        `/api/practice-tests/${slug}/coding-contests/${contestId}/problems/${pid}/test-cases`
      );
      const data = await res.json();
      if (res.ok && data.success) setTestCases(data.testCases || []);
    },
    [slug, contestId]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedPid) {
      loadCases(selectedPid);
      setEditingTcId(null);
      setTcForm(emptyTcForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPid, loadCases]);

  const saveContest = async (patch) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-contests/${contestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
      setContest(data.contest);
      toast.success('Contest updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addProblem = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(
        `/api/practice-tests/${slug}/coding-contests/${contestId}/problems`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(problemForm),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Create failed');
      toast.success('Problem added');
      setSelectedPid(data.problem.id);
      setProblemForm({
        title: '',
        statement: '',
        points: 100,
        cpu_time_limit: 2,
        wall_time_limit: 5,
        memory_limit_kb: 128000,
      });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startEditTestCase = (tc) => {
    setEditingTcId(tc.id);
    setTcForm({
      input: tc.input ?? '',
      expected_output: tc.expected_output ?? '',
      is_hidden: tc.is_hidden !== false,
      sort_order: typeof tc.sort_order === 'number' ? tc.sort_order : 0,
    });
  };

  const cancelEditTestCase = () => {
    setEditingTcId(null);
    setTcForm(emptyTcForm);
  };

  const saveTestCase = async (e) => {
    e.preventDefault();
    if (!selectedPid) return;
    setBusy(true);
    try {
      const url = `/api/practice-tests/${slug}/coding-contests/${contestId}/problems/${selectedPid}/test-cases`;
      const nextOrder =
        editingTcId != null
          ? Number(tcForm.sort_order) || 0
          : Number.isFinite(Number(tcForm.sort_order)) && Number(tcForm.sort_order) > 0
            ? Number(tcForm.sort_order)
            : testCases.length
              ? Math.max(...testCases.map((t) => Number(t.sort_order) || 0)) + 1
              : 1;
      const res = await fetch(url, {
        method: editingTcId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingTcId
            ? {
                id: editingTcId,
                input: tcForm.input,
                expected_output: tcForm.expected_output,
                is_hidden: tcForm.is_hidden,
                sort_order: nextOrder,
              }
            : {
                input: tcForm.input,
                expected_output: tcForm.expected_output,
                is_hidden: tcForm.is_hidden,
                sort_order: nextOrder,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      toast.success(editingTcId ? 'Test case updated' : 'Test case added');
      cancelEditTestCase();
      await loadCases(selectedPid);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteTestCase = async (id) => {
    if (!selectedPid || !id) return;
    if (!window.confirm('Delete this test case?')) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/practice-tests/${slug}/coding-contests/${contestId}/problems/${selectedPid}/test-cases?id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      toast.success('Test case deleted');
      if (editingTcId === id) cancelEditTestCase();
      await loadCases(selectedPid);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <VendorPortalShell>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-12 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </VendorPortalShell>
    );
  }

  if (!contest) {
    return (
      <VendorPortalShell>
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-neutral-600">
          Contest not found.{' '}
          <Link href={`/practice-tests/${slug}/admin/coding-contests`} className="text-teal-700">
            Back
          </Link>
        </div>
      </VendorPortalShell>
    );
  }

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <VendorAdminNav slug={slug} active="admin/coding-contests" />
        <Link
          href={`/practice-tests/${slug}/admin/coding-contests`}
          className="text-sm font-medium text-teal-700"
        >
          ← Contests
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">{contest.title}</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            value={contest.status}
            onChange={(e) => saveContest({ status: e.target.value })}
            disabled={busy}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
          <Link
            href={`/practice-tests/${slug}/coding-contests/${contestId}/leaderboard`}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium"
          >
            Leaderboard
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Problems</h2>
          <ul className="mt-2 space-y-1">
            {problems.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPid(p.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                    selectedPid === p.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-800'
                  }`}
                >
                  {p.title} · {p.points} pts
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={addProblem} className="mt-4 space-y-2 rounded-2xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Add problem
            </h3>
            <input
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Title"
              value={problemForm.title}
              onChange={(e) => setProblemForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <textarea
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm font-mono"
              placeholder="Problem statement (Markdown/plain)"
              rows={6}
              value={problemForm.statement}
              onChange={(e) => setProblemForm((f) => ({ ...f, statement: e.target.value }))}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                className="rounded-xl border border-neutral-200 px-2 py-2 text-sm"
                placeholder="CPU s"
                value={problemForm.cpu_time_limit}
                onChange={(e) =>
                  setProblemForm((f) => ({ ...f, cpu_time_limit: Number(e.target.value) }))
                }
              />
              <input
                type="number"
                className="rounded-xl border border-neutral-200 px-2 py-2 text-sm"
                placeholder="Wall s"
                value={problemForm.wall_time_limit}
                onChange={(e) =>
                  setProblemForm((f) => ({ ...f, wall_time_limit: Number(e.target.value) }))
                }
              />
              <input
                type="number"
                className="rounded-xl border border-neutral-200 px-2 py-2 text-sm"
                placeholder="Memory KB"
                value={problemForm.memory_limit_kb}
                onChange={(e) =>
                  setProblemForm((f) => ({ ...f, memory_limit_kb: Number(e.target.value) }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
            >
              Add problem
            </button>
          </form>
        </section>

        {selectedPid ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold">Test cases</h2>
            <ul className="mt-2 space-y-2">
              {testCases.length === 0 ? (
                <li className="rounded-xl border border-dashed border-neutral-200 px-3 py-4 text-sm text-neutral-500">
                  No test cases yet. Add one below.
                </li>
              ) : (
                testCases.map((tc, idx) => (
                  <li
                    key={tc.id}
                    className={`rounded-xl border bg-white p-3 text-xs font-mono ${
                      editingTcId === tc.id
                        ? 'border-teal-500 ring-1 ring-teal-200'
                        : 'border-neutral-200'
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 font-sans">
                      <p className="text-[11px] font-semibold uppercase text-neutral-500">
                        Test #{idx + 1}
                        {tc.is_hidden ? ' · hidden' : ' · sample'}
                        <span className="ml-1 font-normal normal-case text-neutral-400">
                          (order {tc.sort_order})
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEditTestCase(tc)}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteTestCase(tc.id)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-neutral-800">IN: {tc.input}</pre>
                    <pre className="mt-1 whitespace-pre-wrap text-neutral-800">
                      OUT: {tc.expected_output}
                    </pre>
                  </li>
                ))
              )}
            </ul>
            <form
              onSubmit={saveTestCase}
              className="mt-4 space-y-2 rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {editingTcId ? 'Edit test case' : 'Add test case'}
              </h3>
              <textarea
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
                placeholder={'Input (exact stdin)\n4\n2 7 11 15\n9'}
                rows={4}
                value={tcForm.input}
                onChange={(e) => setTcForm((f) => ({ ...f, input: e.target.value }))}
                required
              />
              <textarea
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
                placeholder="Expected output"
                rows={3}
                value={tcForm.expected_output}
                onChange={(e) => setTcForm((f) => ({ ...f, expected_output: e.target.value }))}
                required
              />
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={tcForm.is_hidden}
                    onChange={(e) => setTcForm((f) => ({ ...f, is_hidden: e.target.checked }))}
                  />
                  Hidden (not shown to students)
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  Order
                  <input
                    type="number"
                    min={0}
                    className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                    value={tcForm.sort_order}
                    onChange={(e) =>
                      setTcForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
                    }
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {editingTcId ? 'Save changes' : 'Add test case'}
                </button>
                {editingTcId ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={cancelEditTestCase}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </VendorPortalShell>
  );
}
