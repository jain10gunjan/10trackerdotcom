'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import MetaDataJobs from '@/components/ui/Seo';
import AdminShell from '@/features/admin/components/AdminShell';
import QuestionStudentPreview from '@/features/admin/components/QuestionStudentPreview';

const PAGE_SIZE = 50;
const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];
const DIFFICULTIES = [
  { value: '', label: 'Any difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNat(q) {
  return !(q?.options_A || q?.options_B || q?.options_C || q?.options_D);
}

function statusBadge(status) {
  const s = String(status || 'draft').toLowerCase();
  if (s === 'published') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (s === 'rejected') {
    return 'bg-rose-100 text-rose-800';
  }
  return 'bg-amber-100 text-amber-900';
}

function Select({ label, value, onChange, children, disabled }) {
  return (
    <label className="flex min-w-[140px] flex-1 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}

function ReviewDrawer({ question, onClose, onSaved, onStatus, initialTab = 'preview' }) {
  const [draft, setDraft] = useState(question);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setDraft(question);
    setTab(initialTab);
    setShowSolution(false);
  }, [question, initialTab]);

  if (!question) return null;

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/examtracker', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: draft }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');
      toast.success('Saved');
      onSaved(json.question || draft);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Review question</p>
            <p className="font-mono text-[11px] text-neutral-500">{question._id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2">
          {[
            ['preview', 'Student preview'],
            ['edit', 'Edit fields'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {label}
            </button>
          ))}
          {tab === 'preview' ? (
            <label className="ml-auto flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={showSolution}
                onChange={(e) => setShowSolution(e.target.checked)}
              />
              Show solution
            </label>
          ) : null}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {tab === 'preview' ? (
            <QuestionStudentPreview question={draft} showSolution={showSolution} />
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-medium ${statusBadge(draft.status)}`}>
                  {draft.status || 'draft'}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                  {draft.difficulty || '—'}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                  {isNat(draft) ? 'NAT' : 'MCQ'}
                </span>
              </div>

              {[
                ['question', 'Question', true, 6],
                ['options_A', 'Option A'],
                ['options_B', 'Option B'],
                ['options_C', 'Option C'],
                ['options_D', 'Option D'],
                ['correct_option', 'Correct'],
                ['solution', 'Solution', true, 5],
                ['solutiontext', 'Solution text', true, 4],
                ['questionImage', 'Image URL'],
                ['questionCode', 'Code block'],
                ['subject', 'Subject'],
                ['chapter', 'Chapter'],
                ['topic', 'Topic'],
                ['difficulty', 'Difficulty'],
                ['year', 'Year'],
              ].map(([key, label, multiline, rows]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {label}
                  </span>
                  {multiline || key === 'questionCode' ? (
                    <textarea
                      rows={key === 'questionCode' ? 6 : rows || 3}
                      value={draft[key] ?? ''}
                      onChange={(e) => setField(key, e.target.value)}
                      className="resize-y rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
                    />
                  ) : (
                    <input
                      value={draft[key] ?? ''}
                      onChange={(e) => setField(key, e.target.value)}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    />
                  )}
                </label>
              ))}

              {draft.questionImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.questionImage}
                  alt=""
                  className="max-h-48 rounded-lg border border-neutral-200 object-contain"
                />
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-neutral-200 p-4">
          {tab === 'edit' ? (
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save edits
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTab('edit')}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700"
            >
              Edit fields
            </button>
          )}
          <button
            type="button"
            onClick={() => onStatus([question._id], 'published')}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => onStatus([question._id], 'rejected')}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onStatus([question._id], 'draft')}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700"
          >
            Mark draft
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function QuestionReviewPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('draft');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in?redirect=/admin/question-review');
    }
  }, [loading, user, router]);

  const filterParams = useMemo(() => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (subject) p.set('subject', subject);
    if (chapter) p.set('chapter', chapter);
    if (difficulty) p.set('difficulty', difficulty);
    if (status && status !== 'all') p.set('status', status);
    return p;
  }, [category, subject, chapter, difficulty, status]);

  const loadFilters = useCallback(async (scope, extra = {}) => {
    const params = new URLSearchParams({ action: 'filters', scope });
    if (extra.category) params.set('category', extra.category);
    if (extra.subject) params.set('subject', extra.subject);
    if (extra.chapter) params.set('chapter', extra.chapter);
    const res = await fetch(`/api/admin/examtracker?${params}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load filters');
    return json.filters || {};
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadFilters('categories')
      .then((f) => setCategories(f.categories || []))
      .catch((err) => toast.error(err.message));
  }, [isAdmin, loadFilters]);

  useEffect(() => {
    if (!isAdmin || !category) {
      setSubjects([]);
      return;
    }
    loadFilters('subjects', { category })
      .then((f) => setSubjects(f.subjects || []))
      .catch((err) => toast.error(err.message));
  }, [isAdmin, category, loadFilters]);

  useEffect(() => {
    if (!isAdmin || !category || !subject) {
      setChapters([]);
      return;
    }
    loadFilters('chapters', { category, subject })
      .then((f) => setChapters(f.chapters || []))
      .catch((err) => toast.error(err.message));
  }, [isAdmin, category, subject, loadFilters]);

  const loadQuestions = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingList(true);
    try {
      const params = new URLSearchParams(filterParams);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(offset));
      params.set('includeCount', 'true');
      const res = await fetch(`/api/admin/examtracker?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load questions');
      const nextTotal = json.count ?? 0;
      const nextQuestions = json.questions || [];
      // If filters shrank the list and we're past the last page, jump back.
      if (nextTotal > 0 && offset >= nextTotal) {
        setOffset(Math.max(0, Math.floor((nextTotal - 1) / PAGE_SIZE) * PAGE_SIZE));
        setTotal(nextTotal);
        return;
      }
      if (nextTotal === 0 && offset !== 0) {
        setOffset(0);
        setTotal(0);
        setQuestions([]);
        setSelected(new Set());
        return;
      }
      setQuestions(nextQuestions);
      setTotal(nextTotal);
      setSelected(new Set());
    } catch (err) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoadingList(false);
    }
  }, [isAdmin, filterParams, offset]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const patchStatus = useCallback(
    async (payload) => {
      setBusy(true);
      try {
        const res = await fetch('/api/admin/examtracker/status', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Update failed');
        toast.success(`${json.updatedCount} question(s) → ${json.status}`);
        setActive(null);
        await loadQuestions();
      } catch (err) {
        toast.error(err.message || 'Update failed');
      } finally {
        setBusy(false);
      }
    },
    [loadQuestions]
  );

  const onStatusIds = (ids, nextStatus) =>
    patchStatus({ ids, status: nextStatus });

  const onBulkSelected = (nextStatus) => {
    const ids = [...selected];
    if (!ids.length) {
      toast.error('Select at least one question');
      return;
    }
    onStatusIds(ids, nextStatus);
  };

  const onPublishAllFiltered = () => {
    const label = status === 'all' ? 'all matching' : status;
    const ok = window.confirm(
      `Publish ALL ${total} questions matching the current filters (${label})?`
    );
    if (!ok) return;
    patchStatus({
      mode: 'all-matching',
      status: 'published',
      filter: {
        category: category || undefined,
        subject: subject || undefined,
        chapter: chapter || undefined,
        difficulty: difficulty || undefined,
        status: status === 'all' ? undefined : status,
      },
    });
  };

  const onGenerateCnDrafts = async () => {
    const ok = window.confirm(
      'Generate GATE CSE Computer Networks drafts (5 easy / 5 medium / 5 hard per chapter)? Built-in verified templates — no OpenAI. They stay unpublished until you review.'
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/examtracker/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || 'Generation failed');
      toast.success(`Generated ${json.inserted} draft questions`);
      setCategory('GATE-CSE');
      setSubject('computer-networks');
      setChapter('');
      setStatus('draft');
      setOffset(0);
    } catch (err) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const allSelected =
    questions.length > 0 && questions.every((q) => selected.has(q._id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(questions.map((q) => q._id)));
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-neutral-600">Admin only.</p>
      </div>
    );
  }

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);

  return (
    <AdminShell>
      <MetaDataJobs title="Question review | Admin" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Question review</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Drafts stay off practice until you publish. Use bulk actions for batches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateCnDrafts}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Generate CN drafts
            </button>
            <button
              type="button"
              onClick={loadQuestions}
              disabled={loadingList || busy}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <Select
            label="Category"
            value={category}
            onChange={(v) => {
              setCategory(v);
              setSubject('');
              setChapter('');
              setOffset(0);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            label="Subject"
            value={subject}
            disabled={!category}
            onChange={(v) => {
              setSubject(v);
              setChapter('');
              setOffset(0);
            }}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            label="Chapter"
            value={chapter}
            disabled={!subject}
            onChange={(v) => {
              setChapter(v);
              setOffset(0);
            }}
          >
            <option value="">All chapters</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(v) => {
              setDifficulty(v);
              setOffset(0);
            }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value || 'any'} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setOffset(0);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => onBulkSelected('published')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish selected ({selected.size})
          </button>
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => onBulkSelected('rejected')}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <XCircle className="h-4 w-4" />
            Reject selected
          </button>
          <button
            type="button"
            disabled={busy || total === 0}
            onClick={onPublishAllFiltered}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 disabled:opacity-40"
          >
            Publish all matching ({total})
          </button>
          <p className="ml-auto text-xs text-neutral-500">
            Showing {pageStart}–{pageEnd} of {total}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all on page"
                    />
                  </th>
                  <th className="px-3 py-3">Question</th>
                  <th className="px-3 py-3">Meta</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-neutral-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-neutral-500">
                      No questions match these filters.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q._id} className="border-b border-neutral-100 align-top">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(q._id)}
                          onChange={() => toggleOne(q._id)}
                          aria-label={`Select ${q._id}`}
                        />
                      </td>
                      <td className="max-w-md px-3 py-3">
                        <p className="line-clamp-3 text-neutral-800">{stripHtml(q.question)}</p>
                        <p className="mt-1 font-mono text-[10px] text-neutral-400">{q._id}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-600">
                        <div>{q.subject || '—'}</div>
                        <div>{q.chapter || '—'}</div>
                        <div className="mt-1">
                          {q.difficulty || '—'} · {isNat(q) ? 'NAT' : 'MCQ'}
                          {q.year ? ` · ${q.year}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge(q.status)}`}
                        >
                          {q.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setActive(q)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onStatusIds([q._id], 'published')}
                            className="text-left text-xs font-medium text-emerald-700 hover:underline"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onStatusIds([q._id], 'rejected')}
                            className="text-left text-xs font-medium text-rose-700 hover:underline"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-3">
            <button
              type="button"
              disabled={offset <= 0 || loadingList}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              disabled={offset + PAGE_SIZE >= total || loadingList}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {active ? (
        <ReviewDrawer
          question={active}
          onClose={() => setActive(null)}
          onSaved={(q) => {
            setActive(q);
            setQuestions((prev) => prev.map((row) => (row._id === q._id ? { ...row, ...q } : row)));
          }}
          onStatus={onStatusIds}
        />
      ) : null}
    </AdminShell>
  );
}
