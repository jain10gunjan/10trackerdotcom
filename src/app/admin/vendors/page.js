'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MetaDataJobs from '@/components/ui/Seo';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Building2,
  ExternalLink,
  Loader2,
  Plus,
  PauseCircle,
  PlayCircle,
  UserPlus,
} from 'lucide-react';

export default function AdminVendorsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [setupHint, setSetupHint] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    domain: '',
    adminEmail: '',
    city: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in?redirect=/admin/vendors');
    }
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.dbSetupRequired) setSetupHint(data.error || '');
        throw new Error(data.error || 'Failed to load vendors');
      }
      setSetupHint('');
      setVendors(data.vendors || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Create failed');
      toast.success('Vendor created');
      setForm({ name: '', slug: '', domain: '', adminEmail: '', city: '' });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const patchVendor = async (vendorId, body, okMsg) => {
    setBusyId(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
      toast.success(okMsg || 'Updated');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const assignAdmin = async (vendor) => {
    const email = window.prompt(`Assign vendor admin email for ${vendor.name}`);
    if (!email) return;
    await patchVendor(vendor.id, { assignAdminEmail: email.trim() }, 'Admin assigned');
  };

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold">Admin only</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="Vendors" seoDescription="Manage institute portals" />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Vendors</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Create institutes, assign admins, suspend portals. Students use{' '}
          <code className="rounded bg-neutral-100 px-1 text-xs">/practice-tests/[slug]</code>
        </p>
      </div>

      {setupHint ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Database setup required</p>
          <p className="mt-1">{setupHint}</p>
        </div>
      ) : null}

      <form
        onSubmit={onCreate}
        className="mb-10 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm font-semibold text-neutral-900">Add vendor</h2>
        <input
          required
          placeholder="Name (e.g. IPS Academy Indore)"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Slug (e.g. ips-academy-indore)"
          value={form.slug}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            }))
          }
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Allowed domain (e.g. ipsacademy.org)"
          value={form.domain}
          onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Vendor admin email (optional)"
          value={form.adminEmail}
          onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create
        </button>
      </form>

      {fetching ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No vendors yet. Run the SQL seed or create one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {vendors.map((v) => {
            const busy = busyId === v.id;
            const suspended = v.status === 'suspended';
            return (
              <li
                key={v.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-700" />
                      <h3 className="font-semibold text-neutral-900">{v.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          suspended
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      /practice-tests/{v.slug}
                      {v.domains?.length ? ` · ${v.domains.map((d) => `@${d}`).join(', ')}` : ''}
                      {v.access_mode ? ` · ${v.access_mode}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/practice-tests/${v.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-800"
                    >
                      Portal <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/practice-tests/${v.slug}/admin`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-800"
                    >
                      Admin
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => assignAdmin(v)}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium"
                    >
                      <UserPlus className="h-3 w-3" /> Assign admin
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        patchVendor(
                          v.id,
                          { status: suspended ? 'active' : 'suspended' },
                          suspended ? 'Vendor activated' : 'Vendor suspended'
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        suspended
                          ? 'border border-emerald-200 text-emerald-700'
                          : 'border border-rose-200 text-rose-700'
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : suspended ? (
                        <PlayCircle className="h-3 w-3" />
                      ) : (
                        <PauseCircle className="h-3 w-3" />
                      )}
                      {suspended ? 'Activate' : 'Suspend'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
