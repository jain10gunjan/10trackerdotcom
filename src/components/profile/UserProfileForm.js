'use client';

import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { parseJsonResponse } from '@/lib/toastAsync';
import { isValidExamSlug } from '@/lib/examProfile';

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
  target_exams: [],
  legacy_target_exam: '',
  avatar_url: '',
  email: '',
};

export default function UserProfileForm({
  suggested,
  saving,
  onSave,
  submitLabel = 'Save & continue',
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [activeExams, setActiveExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);

  useEffect(() => {
    setForm({
      ...EMPTY_FORM,
      ...suggested,
      target_exams: Array.isArray(suggested?.target_exams) ? suggested.target_exams : [],
      country: suggested?.country?.trim() ? suggested.country : 'India',
      email: suggested?.email || '',
    });
    setError('');
  }, [suggested]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/exams/active');
        const data = await parseJsonResponse(res);
        if (!cancelled && data.success) {
          setActiveExams(data.exams || []);
        }
      } catch {
        if (!cancelled) setActiveExams([]);
      } finally {
        if (!cancelled) setExamsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleExam = (slug) => {
    const s = String(slug).toLowerCase();
    setForm((prev) => {
      const setSlugs = new Set(prev.target_exams || []);
      if (setSlugs.has(s)) {
        setSlugs.delete(s);
      } else {
        setSlugs.add(s);
      }
      const target_exams = [...setSlugs];
      let target_exam = prev.target_exam;
      if (!target_exams.includes(target_exam)) {
        target_exam = target_exams[0] || '';
      }
      return { ...prev, target_exams, target_exam };
    });
  };

  const setPrimary = (slug) => {
    const s = String(slug).toLowerCase();
    setForm((prev) => {
      const target_exams = prev.target_exams?.includes(s)
        ? prev.target_exams
        : [...(prev.target_exams || []), s];
      return { ...prev, target_exam: s, target_exams };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.target_exams?.length) {
      setError('Select at least one exam you are preparing for');
      return;
    }
    if (!form.target_exam || !form.target_exams.includes(form.target_exam)) {
      setError('Choose a primary exam from your selected exams');
      return;
    }
    try {
      const { email: _email, legacy_target_exam: _legacy, ...payload } = form;
      await onSave(payload);
    } catch (err) {
      setError(err.message || 'Could not save profile');
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900';

  const showLegacyBanner =
    form.legacy_target_exam && !isValidExamSlug(form.legacy_target_exam);

  const canSubmit =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.country &&
    form.phone_number.trim() &&
    form.target_exams.length > 0 &&
    form.target_exam;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showLegacyBanner && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Your saved exam &quot;{form.legacy_target_exam}&quot; needs updating. Select your
            exam(s) below from the active list.
          </p>
        </div>
      )}

      {form.email && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className={`${inputClass} bg-neutral-100 text-neutral-600`}
          />
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
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Exams you are preparing for <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-neutral-500 mb-2">Select all that apply. Admins control which exams appear here.</p>
        {examsLoading ? (
          <p className="text-sm text-neutral-500">Loading exams…</p>
        ) : activeExams.length === 0 ? (
          <p className="text-sm text-amber-700">No active exams. Ask an admin to enable exams in Platform exams.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeExams.map((exam) => {
              const checked = form.target_exams?.includes(exam.slug);
              return (
                <label
                  key={exam.slug}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                    checked
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => toggleExam(exam.slug)}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium text-neutral-900">{exam.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {form.target_exams?.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Primary exam <span className="text-red-500">*</span>
          </label>
          <select
            value={form.target_exam}
            onChange={(e) => setPrimary(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Select primary exam</option>
            {form.target_exams.map((slug) => {
              const meta = activeExams.find((e) => e.slug === slug);
              return (
                <option key={slug} value={slug}>
                  {meta?.name || slug}
                </option>
              );
            })}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            Your home dashboard and leaderboard default to this exam.
          </p>
        </div>
      )}

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
        disabled={saving || !canSubmit}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
