'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Download, Upload } from 'lucide-react';
import VendorAdminNav from './VendorAdminNav';
import VendorPortalShell from './VendorPortalShell';

const EMPTY_FORM = {
  topic: '',
  category: '',
  subject: '',
  chapter: '',
  difficulty: 'easy',
  question: '',
  options_A: '',
  options_B: '',
  options_C: '',
  options_D: '',
  correct_option: 'A',
  solution: '',
};

export default function VendorQuestionsClient({ slug }) {
  const [tab, setTab] = useState('bank');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonPreview, setJsonPreview] = useState(null);
  const [platform, setPlatform] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ category: 'GATE-CSE', topic: '', q: '' });
  const [busy, setBusy] = useState(false);

  const loadBank = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/questions?limit=100`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setQuestions(data.questions || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (tab === 'bank') loadBank();
  }, [tab, loadBank]);

  const createQuestion = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Create failed');
      toast.success('Question added');
      setForm(EMPTY_FORM);
      setTab('bank');
      await loadBank();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/questions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      toast.success('Deleted');
      await loadBank();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const previewCsv = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/questions/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Validation failed');
      setCsvPreview(data);
      toast.success(
        `${data.validCount} new, ${data.skippedCount || 0} skipped, ${data.errorCount} errors`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/questions/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Import failed');
      toast.success(
        `Imported ${data.savedCount} (skipped ${data.skippedCount || 0} duplicates)`
      );
      setCsvText('');
      setCsvPreview(null);
      setTab('bank');
      await loadBank();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const previewJson = async () => {
    setBusy(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err) {
        throw new Error(`Invalid JSON: ${err.message}`);
      }
      const res = await fetch(`/api/practice-tests/${slug}/questions/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: parsed, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Validation failed');
      setJsonPreview(data);
      toast.success(
        `${data.validCount} new, ${data.skippedCount || 0} skipped, ${data.errorCount} errors`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const importJson = async () => {
    setBusy(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err) {
        throw new Error(`Invalid JSON: ${err.message}`);
      }
      const res = await fetch(`/api/practice-tests/${slug}/questions/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: parsed, dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Import failed');
      toast.success(
        `Imported ${data.savedCount} (skipped ${data.skippedCount || 0} duplicates)`
      );
      setJsonText('');
      setJsonPreview(null);
      setTab('bank');
      await loadBank();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const searchPlatform = async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.topic) params.set('topic', filters.topic);
      if (filters.q) params.set('q', filters.q);
      params.set('limit', '30');
      const res = await fetch(
        `/api/practice-tests/${slug}/questions/import-platform?${params}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Search failed');
      setPlatform(data.questions || []);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const importSelected = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/questions/import-platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Import failed');
      toast.success(`Copied ${data.imported} (skipped ${data.skipped})`);
      setTab('bank');
      await loadBank();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <VendorPortalShell>
    <div className="mx-auto max-w-4xl px-4">
      <VendorAdminNav slug={slug} active="admin/questions" />
      <h1 className="text-2xl font-semibold text-neutral-900">Question bank</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Manual entry, CSV/JSON upload, or copy from the platform examtracker bank.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ['bank', 'Bank'],
          ['manual', 'Add manually'],
          ['csv', 'CSV'],
          ['json', 'JSON'],
          ['import', 'Import from platform'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'bank' ? (
        <div className="mt-8">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-neutral-500">No questions yet. Add some or import.</p>
          ) : (
            <ul className="space-y-3">
              {questions.map((q) => (
                <li
                  key={q._id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-neutral-500">
                        {q.category} · {q.topic} · {q.difficulty} · {q.source}
                      </p>
                      <div
                        className="mt-1 text-neutral-900"
                        dangerouslySetInnerHTML={{
                          __html: String(q.question || '').slice(0, 280),
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteQuestion(q._id)}
                      className="shrink-0 text-xs text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'manual' ? (
        <form
          onSubmit={createQuestion}
          className="mt-8 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
        >
          {['topic', 'category', 'subject', 'chapter'].map((key) => (
            <label key={key} className="text-sm">
              <span className="text-neutral-600">{key}</span>
              <input
                required={key === 'topic' || key === 'category'}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
          <label className="text-sm">
            <span className="text-neutral-600">difficulty</span>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-neutral-600">correct_option</span>
            <input
              value={form.correct_option}
              onChange={(e) => setForm((f) => ({ ...f, correct_option: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder="A or NAT value"
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            <span className="text-neutral-600">question (HTML ok)</span>
            <textarea
              required
              rows={3}
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          {['A', 'B', 'C', 'D'].map((letter) => (
            <label key={letter} className="text-sm">
              <span className="text-neutral-600">options_{letter}</span>
              <input
                value={form[`options_${letter}`]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [`options_${letter}`]: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
          <label className="sm:col-span-2 text-sm">
            <span className="text-neutral-600">solution</span>
            <textarea
              rows={2}
              value={form.solution}
              onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="sm:col-span-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save question
          </button>
        </form>
      ) : null}

      {tab === 'csv' ? (
        <div className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
          <a
            href={`/api/practice-tests/${slug}/questions/csv`}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700"
          >
            <Download className="h-4 w-4" /> Download template
          </a>
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV (UTF-8)…"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !csvText.trim()}
              onClick={previewCsv}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium"
            >
              Preview / validate
            </button>
            <button
              type="button"
              disabled={busy || !csvText.trim()}
              onClick={importCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" /> Import
            </button>
          </div>
          {csvPreview ? (
            <p className="text-xs text-neutral-600">
              New: {csvPreview.validCount} · Skipped: {csvPreview.skippedCount || 0} ·
              Errors: {csvPreview.errorCount}
              {csvPreview.rowErrors?.[0]
                ? ` · e.g. row ${csvPreview.rowErrors[0].row}: ${csvPreview.rowErrors[0].error}`
                : ''}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === 'json' ? (
        <div className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
          <a
            href={`/api/practice-tests/${slug}/questions/json`}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700"
          >
            <Download className="h-4 w-4" /> Download template
          </a>
          <p className="text-xs text-neutral-500">
            Paste a JSON array of question objects, or{' '}
            <code className="rounded bg-neutral-100 px-1">{'{ "questions": [ ... ] }'}</code>.
            Max 500 per upload. Same fields as CSV.
          </p>
          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='[{"topic":"...","category":"...","question":"...","correct_option":"A",...}]'
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !jsonText.trim()}
              onClick={previewJson}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium"
            >
              Preview / validate
            </button>
            <button
              type="button"
              disabled={busy || !jsonText.trim()}
              onClick={importJson}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" /> Import
            </button>
          </div>
          {jsonPreview ? (
            <p className="text-xs text-neutral-600">
              New: {jsonPreview.validCount} · Skipped: {jsonPreview.skippedCount || 0} ·
              Errors: {jsonPreview.errorCount}
              {jsonPreview.rowErrors?.[0]
                ? ` · e.g. row ${jsonPreview.rowErrors[0].row}: ${jsonPreview.rowErrors[0].error}`
                : ''}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === 'import' ? (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              placeholder="category"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <input
              value={filters.topic}
              onChange={(e) => setFilters((f) => ({ ...f, topic: e.target.value }))}
              placeholder="topic"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <input
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="search text"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={searchPlatform}
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Search
            </button>
            <button
              type="button"
              disabled={busy || !selectedIds.length}
              onClick={importSelected}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Copy selected ({selectedIds.length})
            </button>
          </div>
          <ul className="space-y-2">
            {platform.map((q) => (
              <li
                key={q._id}
                className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(q._id)}
                  onChange={() => toggleId(q._id)}
                />
                <div>
                  <p className="text-xs text-neutral-500">
                    {q.category} · {q.topic} · {q.difficulty}
                  </p>
                  <div
                    className="mt-1"
                    dangerouslySetInnerHTML={{
                      __html: String(q.question || '').slice(0, 200),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
    </VendorPortalShell>
  );
}
