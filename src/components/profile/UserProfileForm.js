'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, User } from 'lucide-react';
import LegalTermsCheckbox from '@/components/legal/LegalTermsCheckbox';
import { parseJsonResponse } from '@/lib/toastAsync';
import { isValidExamSlug } from '@/lib/examProfile';
import { validateProfileFormFields } from '@/lib/userProfile';
import { TERMS_VERSION } from '@/lib/billing/legal';

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

const INPUT_BASE =
  'w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-white';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>;
}

function FormLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-neutral-500 mb-1.5">
      {children}
      {required ? <span className="text-red-500 ml-0.5">*</span> : null}
    </label>
  );
}

function FormSection({ title, description, children, last = false }) {
  return (
    <section className={last ? 'pt-8' : 'pt-8 pb-8 border-b border-neutral-100'}>
      {(title || description) && (
        <div className="mb-5">
          {title ? <h3 className="text-sm font-semibold text-neutral-900">{title}</h3> : null}
          {description ? (
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

function ProfileAvatar({ form }) {
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ') || 'User';
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const src = form.avatar_url?.trim();

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center">
        {src ? (
          <Image src={src} alt={displayName} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-lg font-semibold text-neutral-500">{initials || '?'}</span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900">Profile picture</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Uses your Google photo. Add a custom URL below in Additional details.
        </p>
      </div>
    </div>
  );
}

export default function UserProfileForm({
  suggested,
  saving,
  onSave,
  submitLabel = 'Save changes',
  requireTerms = false,
  returnPath = '',
  termsBanner = null,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    setFieldErrors({});
    setSubmitError('');
    setTouched({});
    setTermsAccepted(false);
  }, [suggested]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/exams/active');
        const data = await parseJsonResponse(res);
        if (!cancelled && data.success) setActiveExams(data.exams || []);
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

  const set = useCallback(
    (field) => (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const toggleExam = useCallback((slug) => {
    const s = String(slug).toLowerCase();
    setForm((prev) => {
      const setSlugs = new Set(prev.target_exams || []);
      if (setSlugs.has(s)) setSlugs.delete(s);
      else setSlugs.add(s);
      const target_exams = [...setSlugs];
      let target_exam = prev.target_exam;
      if (!target_exams.includes(target_exam)) target_exam = target_exams[0] || '';
      return { ...prev, target_exams, target_exam };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.target_exams;
      delete next.target_exam;
      return next;
    });
  }, []);

  const setPrimary = useCallback((slug) => {
    const s = String(slug).toLowerCase();
    setForm((prev) => {
      const target_exams = prev.target_exams?.includes(s)
        ? prev.target_exams
        : [...(prev.target_exams || []), s];
      return { ...prev, target_exam: s, target_exams };
    });
  }, []);

  const runValidation = useCallback(
    (markAllTouched = false) => {
      const errors = validateProfileFormFields(form, { requireTerms, termsAccepted });
      if (markAllTouched) {
        const allTouched = { terms: requireTerms };
        ['first_name', 'last_name', 'country', 'phone_number', 'target_exams', 'target_exam'].forEach(
          (k) => {
            allTouched[k] = true;
          }
        );
        setTouched((prev) => ({ ...prev, ...allTouched }));
      }
      setFieldErrors(errors);
      return errors;
    },
    [form, requireTerms, termsAccepted]
  );

  const handleBlur = useCallback(
    (field) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      runValidation(false);
    },
    [runValidation]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errors = runValidation(true);
    if (Object.keys(errors).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    try {
      const { email: _email, legacy_target_exam: _legacy, ...payload } = form;
      await onSave({
        ...payload,
        ...(requireTerms ? { termsAccepted: true, termsVersion: TERMS_VERSION } : {}),
      });
    } catch (err) {
      setSubmitError(err.message || 'Could not save profile');
    }
  };

  const inputClass = (field) =>
    `${INPUT_BASE} ${
      touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/40' : ''
    }`;

  const showLegacyBanner =
    form.legacy_target_exam && !isValidExamSlug(form.legacy_target_exam);

  const validationErrors = useMemo(
    () => validateProfileFormFields(form, { requireTerms, termsAccepted }),
    [form, requireTerms, termsAccepted]
  );

  const canSubmit = Object.keys(validationErrors).length === 0;
  const visibleError = (field) => (touched[field] || submitError ? fieldErrors[field] : '');

  return (
    <form onSubmit={handleSubmit} noValidate>
      {showLegacyBanner && (
        <div className="mb-6 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Your saved exam &quot;{form.legacy_target_exam}&quot; needs updating. Select exams
            below.
          </p>
        </div>
      )}

      {termsBanner}

      <FormSection title="Picture">
        <ProfileAvatar form={form} />
      </FormSection>

      <FormSection
        title="Personal information"
        description="Shown on your dashboard and mock-test leaderboards (name only — never email or phone)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <FormLabel htmlFor="first_name" required>
              First name
            </FormLabel>
            <input
              id="first_name"
              type="text"
              value={form.first_name}
              onChange={set('first_name')}
              onBlur={handleBlur('first_name')}
              placeholder="First name"
              maxLength={50}
              autoComplete="given-name"
              className={inputClass('first_name')}
            />
            <FieldError message={visibleError('first_name')} />
          </div>
          <div>
            <FormLabel htmlFor="last_name" required>
              Last name
            </FormLabel>
            <input
              id="last_name"
              type="text"
              value={form.last_name}
              onChange={set('last_name')}
              onBlur={handleBlur('last_name')}
              placeholder="Last name"
              maxLength={50}
              autoComplete="family-name"
              className={inputClass('last_name')}
            />
            <FieldError message={visibleError('last_name')} />
          </div>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="email">Email address</FormLabel>
            <input
              id="email"
              type="email"
              value={form.email}
              disabled
              className={`${INPUT_BASE} bg-neutral-50 text-neutral-500 cursor-not-allowed`}
            />
          </div>
          <div>
            <FormLabel htmlFor="phone_number" required>
              Phone number
            </FormLabel>
            <input
              id="phone_number"
              type="tel"
              value={form.phone_number}
              onChange={set('phone_number')}
              onBlur={handleBlur('phone_number')}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              className={inputClass('phone_number')}
            />
            <FieldError message={visibleError('phone_number')} />
          </div>
          <div>
            <FormLabel htmlFor="country" required>
              Country
            </FormLabel>
            <select
              id="country"
              value={form.country}
              onChange={set('country')}
              onBlur={handleBlur('country')}
              className={inputClass('country')}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError message={visibleError('country')} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Exam preferences"
        description="Select exams you prepare for. Your primary exam drives your home dashboard."
      >
        {examsLoading ? (
          <p className="text-sm text-neutral-500">Loading exams…</p>
        ) : activeExams.length === 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No active exams right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {activeExams.map((exam) => {
              const checked = form.target_exams?.includes(exam.slug);
              return (
                <label
                  key={exam.slug}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    checked
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => toggleExam(exam.slug)}
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-sm font-medium text-neutral-900">{exam.name}</span>
                </label>
              );
            })}
          </div>
        )}
        <FieldError message={visibleError('target_exams')} />

        {form.target_exams?.length > 0 && (
          <div className="max-w-sm">
            <FormLabel htmlFor="target_exam" required>
              Primary exam
            </FormLabel>
            <select
              id="target_exam"
              value={form.target_exam}
              onChange={(e) => setPrimary(e.target.value)}
              onBlur={handleBlur('target_exam')}
              className={inputClass('target_exam')}
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
            <FieldError message={visibleError('target_exam')} />
          </div>
        )}
      </FormSection>

      <FormSection title="Additional details" description="Optional — city, bio, or custom photo URL.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <FormLabel htmlFor="city">City</FormLabel>
            <input
              id="city"
              type="text"
              value={form.city}
              onChange={set('city')}
              placeholder="City"
              autoComplete="address-level2"
              className={inputClass('city')}
            />
          </div>
          <div>
            <FormLabel htmlFor="state">State / Region</FormLabel>
            <input
              id="state"
              type="text"
              value={form.state}
              onChange={set('state')}
              placeholder="State"
              autoComplete="address-level1"
              className={inputClass('state')}
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="bio">Short bio</FormLabel>
            <textarea
              id="bio"
              value={form.bio}
              onChange={set('bio')}
              placeholder="College, year, goals…"
              rows={2}
              maxLength={300}
              className={inputClass('bio')}
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="avatar_url">Custom photo URL</FormLabel>
            <input
              id="avatar_url"
              type="url"
              value={form.avatar_url}
              onChange={set('avatar_url')}
              onBlur={handleBlur('avatar_url')}
              placeholder="https://…"
              className={inputClass('avatar_url')}
            />
            <FieldError message={visibleError('avatar_url')} />
          </div>
        </div>
      </FormSection>

      {requireTerms && (
        <FormSection title="Terms & policies" last>
          <LegalTermsCheckbox
            id="profile-terms-checkbox"
            checked={termsAccepted}
            onChange={(checked) => {
              setTermsAccepted(checked);
              if (checked) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.terms;
                  return next;
                });
              }
            }}
            termsVersion={TERMS_VERSION}
            openInNewTab={false}
            returnPath={returnPath}
            className="bg-neutral-50 border-neutral-200"
          />
          <FieldError message={touched.terms || submitError ? fieldErrors.terms : ''} />
        </FormSection>
      )}

      {!requireTerms && (
        <div className="pt-8 flex items-start gap-2 text-xs text-neutral-500">
          <User className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Leaderboards show your first and last name only.
        </div>
      )}

      {submitError && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
