'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ExtensionStatus from '@/features/extension-auth/components/ExtensionStatus';

export default function ExtensionDevicesPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/extension/auth/devices', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load devices');
      }
      setDevices(json.devices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, load]);

  const revoke = async (tokenId, all = false) => {
    setBusyId(all ? 'all' : tokenId);
    try {
      const res = await fetch('/api/extension/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(all ? { all: true } : { tokenId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to revoke');
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 flex justify-center text-neutral-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Connected devices</h1>
          <p className="mt-2 text-sm text-neutral-600">Sign in to manage extension access.</p>
          <button
            type="button"
            onClick={() => signInWithGoogle({ redirectUrl: '/extension/devices' })}
            className="mt-5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/10tracker.png"
              alt="10tracker.com"
              className="h-8 w-auto max-w-[200px] object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Extension devices
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Revoke YouTube Progress extension tokens linked to {user.email}.
          </p>
        </div>
        <Link
          href="/extension/connect"
          className="shrink-0 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Connect new
        </Link>
      </div>

      <ExtensionStatus variant="both" enabled className="mb-6" />

      {error ? (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading devices…
        </div>
      ) : devices.length === 0 ? (
        <p className="text-sm text-neutral-500">No extension tokens yet.</p>
      ) : (
        <ul className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
          {devices.map((d) => (
            <li key={d.id} className="px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{d.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {d.active ? 'Active' : d.revoked ? 'Revoked' : 'Expired'}
                  {d.lastUsedAt
                    ? ` · Last used ${new Date(d.lastUsedAt).toLocaleString()}`
                    : ` · Created ${new Date(d.createdAt).toLocaleString()}`}
                </p>
              </div>
              {d.active ? (
                <button
                  type="button"
                  disabled={busyId === d.id}
                  onClick={() => revoke(d.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {busyId === d.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Revoke
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {devices.some((d) => d.active) ? (
        <button
          type="button"
          disabled={busyId === 'all'}
          onClick={() => revoke(null, true)}
          className="mt-4 text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          {busyId === 'all' ? 'Revoking…' : 'Revoke all devices'}
        </button>
      ) : null}
    </div>
  );
}
