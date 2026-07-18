'use client';

import { useState, useEffect } from 'react';
import { User, Sparkles } from 'lucide-react';

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Singapore',
  'Germany',
  'France',
  'Other',
];

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  country: 'India',
  phone_number: '',
  city: '',
  state: '',
  bio: '',
  target_exam: '',
  avatar_url: '',
  email: '',
};

export default function MockTestProfileModal({
  open,
  suggested,
  saving,
  onSave,
  mandatory = true,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && suggested) {
      setForm({
        ...EMPTY_FORM,
        ...suggested,
        country: suggested.country || 'India',
      });
      setError('');
    }
  }, [open, suggested]);

  if (!open) return null;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSave({ ...form });
    } catch (err) {
      setError(err.message || 'Could not save profile');
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 sm:p-6 border-b border-neutral-100 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Complete your profile</h2>
              <p className="text-sm text-neutral-600">
                {mandatory
                  ? 'Required before mock tests, leaderboards, and rankings.'
                  : 'Update your details anytime.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {form.email && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input type="email" value={form.email} disabled className={`${inputClass} bg-neutral-100 text-neutral-600`} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={set('first_name')}
                placeholder="First name"
                maxLength={50}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={set('last_name')}
                placeholder="Last name"
                maxLength={50}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select value={form.country} onChange={set('country')} required className={inputClass}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={set('phone_number')}
              placeholder="+91 98765 43210"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={set('city')} placeholder="City" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">State / Region</label>
              <input type="text" value={form.state} onChange={set('state')} placeholder="State" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Primary exam preparing for</label>
            <input
              type="text"
              value={form.target_exam}
              onChange={set('target_exam')}
              placeholder="e.g. UPSC Prelims, GATE CSE"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Short bio</label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              placeholder="Optional — college, year, goals…"
              rows={2}
              maxLength={300}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Profile photo URL</label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={set('avatar_url')}
              placeholder="https://… (optional, uses Google photo if empty)"
              className={inputClass}
            />
          </div>

          <p className="text-xs text-neutral-500">
            Leaderboards show your first & last name only. Email and phone are not public.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={
              saving ||
              !form.first_name.trim() ||
              !form.last_name.trim() ||
              !form.country ||
              !form.phone_number.trim()
            }
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
