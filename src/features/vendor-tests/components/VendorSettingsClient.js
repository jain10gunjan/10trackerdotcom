'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import VendorAdminNav from './VendorAdminNav';
import VendorPortalShell from './VendorPortalShell';

const MODE_OPTIONS = [
  { value: 'domain_and_allowlist', label: 'Domain + allowlist (default)' },
  { value: 'domain_only', label: 'Domain only' },
  { value: 'allowlist_only', label: 'Allowlist only' },
  { value: 'open_to_all', label: 'Open to all (super admin only)' },
];

export default function VendorSettingsClient({ slug, isSuperAdmin }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [settings, setSettings] = useState(null);
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [form, setForm] = useState({
    name: '',
    city: '',
    contact_email: '',
    theme_color: '#0F766E',
    logo_url: '',
    banner_url: '',
    access_mode: 'domain_and_allowlist',
    auto_enroll: true,
    allow_subdomains: false,
    require_workspace_hd: false,
    allow_gmail_auto_enroll: false,
    enrollment_min_length: 1,
    enrollment_max_length: 64,
    enrollment_digits_only: false,
    enrollment_prefix: '',
    enrollment_hint: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/settings`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load settings');
      setVendor(data.vendor);
      setSettings(data.settings);
      setDomains(data.domains || []);
      setForm({
        name: data.vendor?.name || '',
        city: data.vendor?.city || '',
        contact_email: data.vendor?.contact_email || '',
        theme_color: data.vendor?.theme_color || '#0F766E',
        logo_url: data.vendor?.logo_url || '',
        banner_url: data.vendor?.banner_url || '',
        access_mode: data.settings?.access_mode || 'domain_and_allowlist',
        auto_enroll: data.settings?.auto_enroll !== false,
        allow_subdomains: !!data.settings?.allow_subdomains,
        require_workspace_hd: !!data.settings?.require_workspace_hd,
        allow_gmail_auto_enroll: !!data.settings?.allow_gmail_auto_enroll,
        enrollment_min_length: data.settings?.enrollment_min_length ?? 1,
        enrollment_max_length: data.settings?.enrollment_max_length ?? 64,
        enrollment_digits_only: !!data.settings?.enrollment_digits_only,
        enrollment_prefix: data.settings?.enrollment_prefix || '',
        enrollment_hint: data.settings?.enrollment_hint || '',
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      toast.success('Settings saved');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      const res = await fetch(`/api/practice-tests/${slug}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add domain');
      toast.success('Domain added');
      setNewDomain('');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeDomain = async (domain) => {
    if (!confirm(`Remove domain ${domain}? Access updates immediately.`)) return;
    try {
      const res = await fetch(`/api/practice-tests/${slug}/domains`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove');
      toast.success('Domain removed');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <VendorPortalShell>
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      </VendorPortalShell>
    );
  }

  return (
    <VendorPortalShell>
    <div className="mx-auto max-w-3xl px-4">
      <VendorAdminNav slug={slug} active="admin/settings" />
      <h1 className="text-2xl font-semibold text-neutral-900">Access & branding</h1>
      <p className="mt-1 text-sm text-neutral-600">{vendor?.name}</p>

      <form onSubmit={save} className="mt-8 space-y-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Branding</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['name', 'Institute name'],
              ['city', 'City'],
              ['contact_email', 'Contact email'],
              ['theme_color', 'Theme color'],
              ['logo_url', 'Logo URL'],
              ['banner_url', 'Banner URL'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="text-neutral-600">{label}</span>
                <input
                  value={form[key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  type={key === 'theme_color' ? 'text' : key.includes('email') ? 'email' : 'text'}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Access mode</h2>
          <select
            value={form.access_mode}
            onChange={(e) => setForm((f) => ({ ...f, access_mode: e.target.value }))}
            className="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          >
            {MODE_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.value === 'open_to_all' && !isSuperAdmin}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.auto_enroll}
                onChange={(e) => setForm((f) => ({ ...f, auto_enroll: e.target.checked }))}
              />
              Auto-enroll matching domain users
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allow_subdomains}
                onChange={(e) => setForm((f) => ({ ...f, allow_subdomains: e.target.checked }))}
              />
              Allow subdomains (e.g. cs.ipsacademy.org)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.require_workspace_hd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, require_workspace_hd: e.target.checked }))
                }
              />
              Require Google Workspace hosted domain (hd)
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.allow_gmail_auto_enroll}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allow_gmail_auto_enroll: e.target.checked }))
                }
              />
              <span>
                Let any @gmail.com account enter as a student, with no approval
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Off means Gmail users must request access. Revoked accounts stay blocked.
                  Institute-domain rules still apply to other emails.
                </span>
              </span>
            </label>
          </div>
          {settings?.access_mode ? (
            <p className="mt-3 text-xs text-neutral-500">
              Current saved mode: {settings.access_mode}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Enrollment numbers</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Students must match these rules before a test starts. Correct a saved number from Members.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-neutral-600">Minimum length</span>
              <input
                type="number"
                min={1}
                max={64}
                value={form.enrollment_min_length}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enrollment_min_length: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Maximum length</span>
              <input
                type="number"
                min={1}
                max={64}
                value={form.enrollment_max_length}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enrollment_max_length: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Required prefix</span>
              <input
                value={form.enrollment_prefix}
                onChange={(e) => setForm((f) => ({ ...f, enrollment_prefix: e.target.value }))}
                placeholder="Optional, e.g. IPS"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                checked={form.enrollment_digits_only}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enrollment_digits_only: e.target.checked }))
                }
              />
              Digits only
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-neutral-600">Hint shown to students</span>
              <input
                value={form.enrollment_hint}
                onChange={(e) => setForm((f) => ({ ...f, enrollment_hint: e.target.value }))}
                placeholder="Optional, e.g. Use the number on your ID card"
                maxLength={160}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save settings
        </button>
      </form>

      <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Allowed email domains</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Exact match on the part after @. Removing a domain takes effect immediately.
        </p>
        <ul className="mt-4 space-y-2">
          {domains.length === 0 ? (
            <li className="text-sm text-neutral-500">No domains yet.</li>
          ) : (
            domains.map((d) => (
              <li
                key={d.id || d.domain}
                className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm"
              >
                <span className="font-medium">@{d.domain}</span>
                <button
                  type="button"
                  onClick={() => removeDomain(d.domain)}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={addDomain} className="mt-4 flex gap-2">
          <input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="ipsacademy.org"
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </section>
    </div>
    </VendorPortalShell>
  );
}
