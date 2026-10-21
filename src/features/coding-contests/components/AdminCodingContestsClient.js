'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import VendorAdminNav from '@/features/vendor-tests/components/VendorAdminNav';
import VendorPortalShell from '@/features/vendor-tests/components/VendorPortalShell';

const EMPTY = {
  title: '',
  description: '',
  status: 'draft',
  scoring_mode: 'icpc',
  stop_on_first_fail: true,
  ignore_ce_penalty: true,
  wrong_penalty_minutes: 20,
  starts_at: '',
  ends_at: '',
};

export default function AdminCodingContestsClient({ slug }) {
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-contests`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setContests(data.contests || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-contests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Create failed');
      toast.success('Contest created');
      setForm(EMPTY);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const syncLanguages = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/coding-languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableDefaults: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Sync failed');
      toast.success(`Synced ${data.upserted} languages from Judge0`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-3xl px-4">
        <VendorAdminNav slug={slug} active="admin/coding-contests" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">Coding contests</h1>
          <button
            type="button"
            onClick={syncLanguages}
            disabled={syncBusy}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          >
            {syncBusy ? 'Syncing…' : 'Sync Judge0 languages'}
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Create multi-language contests judged by Judge0. Hidden test cases never leave the
          server.
        </p>

        <form
          onSubmit={create}
          className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-neutral-900">New contest</h2>
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-neutral-600">
              Starts at
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              />
            </label>
            <label className="text-xs text-neutral-600">
              Ends at
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create draft'}
          </button>
        </form>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-900">All contests</h2>
          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : contests.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No contests yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
              {contests.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium text-neutral-900">{c.title}</p>
                    <p className="text-xs text-neutral-500">
                      {c.status} · {c.scoring_mode}
                    </p>
                  </div>
                  <Link
                    href={`/practice-tests/${slug}/admin/coding-contests/${c.id}`}
                    className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Edit →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </VendorPortalShell>
  );
}
