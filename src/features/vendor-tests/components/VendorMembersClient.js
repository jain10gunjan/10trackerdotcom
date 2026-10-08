'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, UserPlus } from 'lucide-react';
import VendorAdminNav from './VendorAdminNav';
import VendorPortalShell from './VendorPortalShell';

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = {
    email: headers.findIndex((h) => h === 'email' || h === 'user_email'),
    name: headers.findIndex((h) => h === 'name' || h === 'display_name'),
    roll_no: headers.findIndex((h) => h === 'roll_no' || h === 'roll' || h === 'roll no'),
    branch: headers.findIndex((h) => h === 'branch'),
    batch: headers.findIndex((h) => h === 'batch'),
    year: headers.findIndex((h) => h === 'year'),
    role: headers.findIndex((h) => h === 'role'),
  };
  if (idx.email < 0) throw new Error('CSV must include an email column');

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      email: cols[idx.email],
      name: idx.name >= 0 ? cols[idx.name] : '',
      roll_no: idx.roll_no >= 0 ? cols[idx.roll_no] : '',
      branch: idx.branch >= 0 ? cols[idx.branch] : '',
      batch: idx.batch >= 0 ? cols[idx.batch] : '',
      year: idx.year >= 0 ? cols[idx.year] : '',
      role: idx.role >= 0 ? cols[idx.role] || 'student' : 'student',
      status: 'active',
      source: 'allowlist',
    };
  });
}

export default function VendorMembersClient({ slug }) {
  const [tab, setTab] = useState('members');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    email: '',
    name: '',
    roll_no: '',
    branch: '',
    batch: '',
    role: 'student',
  });
  const [csvText, setCsvText] = useState('');
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(
      `/api/practice-tests/${slug}/members?limit=200${q ? `&q=${encodeURIComponent(q)}` : ''}`
    );
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load members');
    setMembers(data.members || []);
  }, [slug, q]);

  const loadRequests = useCallback(async () => {
    const res = await fetch(`/api/practice-tests/${slug}/access-requests?status=pending`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load requests');
    setRequests(data.requests || []);
  }, [slug]);

  const loadLogs = useCallback(async () => {
    const res = await fetch(`/api/practice-tests/${slug}/audit-logs?limit=80`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load audit log');
    setLogs(data.logs || []);
  }, [slug]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'members') await loadMembers();
      else if (tab === 'requests') await loadRequests();
      else await loadLogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, loadMembers, loadRequests, loadLogs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = useMemo(() => requests.length, [requests]);

  const addMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'allowlist', status: 'active' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add');
      toast.success('Member added');
      setForm({ email: '', name: '', roll_no: '', branch: '', batch: '', role: 'student' });
      await loadMembers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    setBusy(true);
    try {
      const membersPayload = parseCsv(csvText);
      if (!membersPayload.length) throw new Error('No rows in CSV');
      const res = await fetch(`/api/practice-tests/${slug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: membersPayload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Import failed');
      toast.success(`Imported ${data.upserted?.length || 0} members`);
      setCsvText('');
      await loadMembers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const patchMember = async (email, patch) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...patch }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
      toast.success(patch.status === 'revoked' ? 'Access revoked' : 'Updated');
      await loadMembers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resolveRequest = async (id, action) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/access-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      toast.success(action === 'approve' ? 'Approved' : 'Rejected');
      await loadRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <VendorPortalShell>
    <div className="mx-auto max-w-4xl px-4">
      <VendorAdminNav slug={slug} active="admin/members" />
      <h1 className="text-2xl font-semibold text-neutral-900">Members & access</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Allowlist, revoke, roles, and access requests. Revoke freezes in-progress attempts.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: 'members', label: 'Members' },
          { id: 'requests', label: `Requests${pendingCount ? ` (${pendingCount})` : ''}` },
          { id: 'audit', label: 'Audit log' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : null}

      {!loading && tab === 'members' ? (
        <div className="mt-8 space-y-8">
          <form
            onSubmit={addMember}
            className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
          >
            <h2 className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-4 w-4" /> Add member
            </h2>
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Enrollment / roll no"
              value={form.roll_no}
              onChange={(e) => setForm((f) => ({ ...f, roll_no: e.target.value }))}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Branch"
              value={form.branch}
              onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Batch"
              value={form.batch}
              onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="student">Student</option>
              <option value="vendor_staff">Staff</option>
              <option value="vendor_admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="sm:col-span-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Add to allowlist
            </button>
          </form>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Bulk CSV</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Headers: email, name, roll_no (enrollment), branch, batch, year, role
            </p>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="email,name,roll_no,branch,batch&#10;a@x.com,Ann,101,CSE,2026"
              className="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={importCsv}
              disabled={busy || !csvText.trim()}
              className="mt-3 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Import CSV
            </button>
          </section>

          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email"
              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={loadMembers}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            >
              Search
            </button>
          </div>

          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
            {members.length === 0 ? (
              <li className="p-4 text-sm text-neutral-500">No members yet.</li>
            ) : (
              members.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{m.user_email}</p>
                    <p className="text-xs text-neutral-500">
                      {m.role} · {m.status} · {m.source}
                      {m.roll_no ? ` · enrollment ${m.roll_no}` : ''}
                      {m.batch ? ` · ${m.batch}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.status !== 'revoked' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchMember(m.user_email, { status: 'revoked' })}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchMember(m.user_email, { status: 'active' })}
                        className="rounded-lg border border-teal-200 px-2 py-1 text-xs font-medium text-teal-700"
                      >
                        Restore
                      </button>
                    )}
                    {m.role !== 'vendor_admin' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchMember(m.user_email, { role: 'vendor_admin' })}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                      >
                        Make admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchMember(m.user_email, { role: 'student' })}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                      >
                        Demote
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {!loading && tab === 'requests' ? (
        <ul className="mt-8 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {requests.length === 0 ? (
            <li className="p-4 text-sm text-neutral-500">No pending requests.</li>
          ) : (
            requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{r.user_email}</p>
                  <p className="text-xs text-neutral-500">{r.message || 'No message'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => resolveRequest(r.id, 'approve')}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => resolveRequest(r.id, 'reject')}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {!loading && tab === 'audit' ? (
        <ul className="mt-8 space-y-2">
          {logs.length === 0 ? (
            <li className="text-sm text-neutral-500">No audit events yet.</li>
          ) : (
            logs.map((log) => (
              <li
                key={log.id}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700"
              >
                <span className="font-semibold text-neutral-900">{log.action}</span>
                {' · '}
                {log.actor_email || 'system'}
                {' · '}
                {new Date(log.created_at).toLocaleString()}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
    </VendorPortalShell>
  );
}
