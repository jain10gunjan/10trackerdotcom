'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, RotateCcw, User } from 'lucide-react';
import LegalTermsCheckbox from '@/features/legal/components/LegalTermsCheckbox';
import { parseJsonResponse } from '@/lib/toastAsync';
import { isValidExamSlug } from '@/lib/examProfile';
import { validateProfileFormFields } from '@/lib/userProfile';
import { TERMS_VERSION } from '@/features/billing/lib/legal';

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
  'w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white';

const ERROR_FIELD_ORDER = [
  'first_name',
  'last_name',
  'phone_number',
  'country',
  'target_exams',
  'target_exam',
  'avatar_url',
  'bio',
  'terms',
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

function FormLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-neutral-600 mb-1">
      {children}
      {required ? (
        <span className="text-red-500 ml-0.5" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

function SectionHeading({ number, title, description }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      {number ? (
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[10px] font-bold tabular-nums text-emerald-800 border border-emerald-100">
          {number}
        </span>
      ) : null}
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-neutral-900 leading-none">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-neutral-500 leading-snug">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function ProfileAvatar({ form, googleImage, onAvatarChange, avatarError, onBlur }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ') || 'User';
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const src = form.avatar_url?.trim();
  const showImage = Boolean(src) && !imgFailed;
  const canResetToGoogle =
    Boolean(googleImage) && src && src !== String(googleImage).trim();

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-sm font-bold text-emerald-700 tracking-tight">
            {initials || '?'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <button
            type="button"
            onClick={() => setShowUrl((v) => !v)}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-expanded={showUrl}
          >
            Change photo
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showUrl ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {canResetToGoogle ? (
            <button
              type="button"
              onClick={() => onAvatarChange(googleImage)}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              <RotateCcw className="w-3 h-3" aria-hidden />
              Use Google photo
            </button>
          ) : null}
          {imgFailed && src ? (
            <span className="text-xs text-amber-700">Photo unavailable — initials shown</span>
          ) : null}
        </div>
        {showUrl ? (
          <div className="mt-2">
            <FormLabel htmlFor="avatar_url">Photo URL</FormLabel>
            <input
              id="avatar_url"
              type="url"
              value={form.avatar_url}
              onChange={(e) => onAvatarChange(e.target.value)}
              onBlur={onBlur}
              placeholder="https://…"
              inputMode="url"
              autoComplete="photo"
              aria-invalid={Boolean(avatarError)}
              aria-describedby={avatarError ? 'avatar_url-error' : undefined}
              className={`${INPUT_BASE} ${avatarError ? 'border-red-300 bg-red-50/40' : ''}`}
            />
            <FieldError id="avatar_url-error" message={avatarError} />
          </div>
        ) : (
          <input type="hidden" id="avatar_url" value={form.avatar_url || ''} readOnly />
        )}
      </div>
    </div>
  );
}

function scrollToFirstError(errors) {
  const key = ERROR_FIELD_ORDER.find((k) => errors[k]);
  if (!key) return;
  const el =
    key === 'terms'
      ? document.getElementById('profile-terms-checkbox')
      : key === 'target_exams'
        ? document.getElementById('exam-preferences')
        : document.getElementById(key);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el && typeof el.focus === 'function' && key !== 'target_exams' && key !== 'avatar_url') {
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  }
}

export default function UserProfileForm({
  suggested,
  saving,
  onSave,
  submitLabel = 'Save changes',
  requireTerms = false,
  returnPath = '',
  termsBanner = null,
  googleImage = '',
  showPrivacyNote = true,
  elevateSaveBar = false,
}) {
  const formId = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeExams, setActiveExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState(false);
  const baselineRef = useRef('');
  const firstNameRef = useRef(null);

  useEffect(() => {
    const next = {
      ...EMPTY_FORM,
      ...suggested,
      target_exams: Array.isArray(suggested?.target_exams) ? suggested.target_exams : [],
      country: suggested?.country?.trim() ? suggested.country : 'India',
      email: suggested?.email || '',
    };
    setForm(next);
    setFieldErrors({});
    setSubmitError('');
    setTouched({});
    setTermsAccepted(false);
    baselineRef.current = JSON.stringify({
      first_name: next.first_name,
      last_name: next.last_name,
      country: next.country,
      phone_number: next.phone_number,
      city: next.city,
      state: next.state,
      bio: next.bio,
      target_exam: next.target_exam,
      target_exams: next.target_exams,
      avatar_url: next.avatar_url,
    });
  }, [suggested]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/exams/active');
        const data = await parseJsonResponse(res);
        if (!cancelled) {
          if (data.success) {
            setActiveExams(data.exams || []);
            setExamsError(false);
          } else {
            setActiveExams([]);
            setExamsError(true);
          }
        }
      } catch {
        if (!cancelled) {
          setActiveExams([]);
          setExamsError(true);
        }
      } finally {
        if (!cancelled) setExamsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop stale/inactive exam slugs that aren't shown in the checkbox list,
  // so they can't reappear on the homepage switcher after the next save.
  useEffect(() => {
    if (examsLoading || examsError || !activeExams.length) return;
    const activeSlugs = new Set(activeExams.map((e) => String(e.slug).toLowerCase()));
    setForm((prev) => {
      const current = Array.isArray(prev.target_exams) ? prev.target_exams : [];
      const pruned = current.filter((s) => activeSlugs.has(String(s).toLowerCase()));
      let target_exam = String(prev.target_exam || '').toLowerCase();
      const primaryOk = Boolean(target_exam && pruned.includes(target_exam));
      if (pruned.length === current.length && (primaryOk || (!target_exam && !pruned.length))) {
        return prev;
      }
      if (!primaryOk) {
        target_exam = pruned[0] || '';
      }
      try {
        const baseline = JSON.parse(baselineRef.current || '{}');
        baseline.target_exams = pruned;
        baseline.target_exam = target_exam;
        baselineRef.current = JSON.stringify(baseline);
      } catch {
        /* ignore */
      }
      return { ...prev, target_exams: pruned, target_exam };
    });
  }, [activeExams, examsLoading, examsError]);

  useEffect(() => {
    if (!suggested?.first_name && firstNameRef.current) {
      const t = requestAnimationFrame(() => firstNameRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
  }, [suggested?.first_name]);

  const isDirty = useMemo(() => {
    const snapshot = JSON.stringify({
      first_name: form.first_name,
      last_name: form.last_name,
      country: form.country,
      phone_number: form.phone_number,
      city: form.city,
      state: form.state,
      bio: form.bio,
      target_exam: form.target_exam,
      target_exams: form.target_exams,
      avatar_url: form.avatar_url,
    });
    return snapshot !== baselineRef.current || (requireTerms && termsAccepted);
  }, [form, requireTerms, termsAccepted]);

  const set = useCallback(
    (field) => (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      if (submitError) setSubmitError('');
    },
    [submitError]
  );

  const setAvatarUrl = useCallback(
    (value) => {
      setForm((prev) => ({ ...prev, avatar_url: value }));
      setFieldErrors((prev) => {
        if (!prev.avatar_url) return prev;
        const next = { ...prev };
        delete next.avatar_url;
        return next;
      });
      if (submitError) setSubmitError('');
    },
    [submitError]
  );

  const toggleExam = useCallback(
    (slug) => {
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
      if (submitError) setSubmitError('');
    },
    [submitError]
  );

  const setPrimary = useCallback((slug) => {
    const s = String(slug).toLowerCase();
    setForm((prev) => {
      const target_exams = prev.target_exams?.includes(s)
        ? prev.target_exams
        : [...(prev.target_exams || []), s];
      return { ...prev, target_exam: s, target_exams };
    });
    setFieldErrors((prev) => {
      if (!prev.target_exam) return prev;
      const next = { ...prev };
      delete next.target_exam;
      return next;
    });
  }, []);

  const runValidation = useCallback(
    (markAllTouched = false) => {
      const errors = validateProfileFormFields(form, { requireTerms, termsAccepted });
      if (markAllTouched) {
        const allTouched = { terms: requireTerms };
        [
          'first_name',
          'last_name',
          'country',
          'phone_number',
          'target_exams',
          'target_exam',
          'avatar_url',
        ].forEach((k) => {
          allTouched[k] = true;
        });
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
      const errors = validateProfileFormFields(form, { requireTerms, termsAccepted });
      setFieldErrors((prev) => {
        if (!errors[field] && !prev[field]) return prev;
        if (!errors[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return { ...prev, [field]: errors[field] };
      });
    },
    [form, requireTerms, termsAccepted]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errors = runValidation(true);
    if (Object.keys(errors).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      requestAnimationFrame(() => scrollToFirstError(errors));
      return;
    }
    try {
      const { email: _email, legacy_target_exam: _legacy, ...payload } = form;
      await onSave({
        ...payload,
        ...(requireTerms ? { termsAccepted: true, termsVersion: TERMS_VERSION } : {}),
      });
      baselineRef.current = JSON.stringify({
        first_name: form.first_name,
        last_name: form.last_name,
        country: form.country,
        phone_number: form.phone_number,
        city: form.city,
        state: form.state,
        bio: form.bio,
        target_exam: form.target_exam,
        target_exams: form.target_exams,
        avatar_url: form.avatar_url,
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

  const visibleError = (field) => (touched[field] || submitError ? fieldErrors[field] : '');
  const bioLen = form.bio?.length || 0;

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-3">
      {showLegacyBanner && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
          <p>
            Your saved exam &quot;{form.legacy_target_exam}&quot; needs updating. Select exams
            below.
          </p>
        </div>
      )}

      {termsBanner}

      <div className="rounded-xl border border-neutral-200/90 bg-white shadow-sm overflow-hidden">
        {/* Personal */}
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-100">
          <SectionHeading
            number="01"
            title="Personal information"
            description="Name appears on leaderboards. Email and phone stay private."
          />
          <div className="space-y-3">
            <ProfileAvatar
              form={form}
              googleImage={googleImage}
              onAvatarChange={setAvatarUrl}
              avatarError={visibleError('avatar_url')}
              onBlur={handleBlur('avatar_url')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <FormLabel htmlFor="first_name" required>
                  First name
                </FormLabel>
                <input
                  ref={firstNameRef}
                  id="first_name"
                  type="text"
                  value={form.first_name}
                  onChange={set('first_name')}
                  onBlur={handleBlur('first_name')}
                  placeholder="First name"
                  maxLength={50}
                  autoComplete="given-name"
                  aria-invalid={Boolean(visibleError('first_name'))}
                  aria-describedby={visibleError('first_name') ? 'first_name-error' : undefined}
                  className={inputClass('first_name')}
                />
                <FieldError id="first_name-error" message={visibleError('first_name')} />
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
                  aria-invalid={Boolean(visibleError('last_name'))}
                  aria-describedby={visibleError('last_name') ? 'last_name-error' : undefined}
                  className={inputClass('last_name')}
                />
                <FieldError id="last_name-error" message={visibleError('last_name')} />
              </div>
              <div className="sm:col-span-2">
                <FormLabel htmlFor="email">Email address</FormLabel>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  disabled
                  readOnly
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
                  inputMode="tel"
                  aria-invalid={Boolean(visibleError('phone_number'))}
                  aria-describedby={visibleError('phone_number') ? 'phone_number-error' : undefined}
                  className={inputClass('phone_number')}
                />
                <FieldError id="phone_number-error" message={visibleError('phone_number')} />
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
                  aria-invalid={Boolean(visibleError('country'))}
                  aria-describedby={visibleError('country') ? 'country-error' : undefined}
                  className={inputClass('country')}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <FieldError id="country-error" message={visibleError('country')} />
              </div>
            </div>
          </div>
        </div>

        {/* Exams */}
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-100">
          <SectionHeading
            number="02"
            title="Exam preferences"
            description="Primary exam drives your home dashboard."
          />
          <div id="exam-preferences">
            {examsLoading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Loading exams…
              </div>
            ) : examsError || activeExams.length === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {examsError
                  ? 'Could not load exams. Refresh the page and try again.'
                  : 'No active exams right now.'}
              </p>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                role="group"
                aria-label="Target exams"
              >
                {activeExams.map((exam) => {
                  const checked = form.target_exams?.includes(exam.slug);
                  return (
                    <label
                      key={exam.slug}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                        checked
                          ? 'border-emerald-300 bg-emerald-50/80'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => toggleExam(exam.slug)}
                        className="h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="text-sm font-semibold text-neutral-900">{exam.name}</span>
                      {checked ? (
                        <Check
                          className="w-3.5 h-3.5 text-emerald-700 ml-auto shrink-0"
                          aria-hidden
                        />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}
            <FieldError message={visibleError('target_exams')} />
          </div>

          {form.target_exams?.length > 0 && (
            <div className="max-w-sm mt-3">
              <FormLabel htmlFor="target_exam" required>
                Primary exam
              </FormLabel>
              <select
                id="target_exam"
                value={form.target_exam}
                onChange={(e) => setPrimary(e.target.value)}
                onBlur={handleBlur('target_exam')}
                aria-invalid={Boolean(visibleError('target_exam'))}
                aria-describedby={visibleError('target_exam') ? 'target_exam-error' : undefined}
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
              <FieldError id="target_exam-error" message={visibleError('target_exam')} />
            </div>
          )}
        </div>

        {/* Optional */}
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-100">
          <SectionHeading
            number="03"
            title="Additional details"
            description="Optional — city, region, and a short bio."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">
            <div>
              <FormLabel htmlFor="city">City</FormLabel>
              <input
                id="city"
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder="City"
                maxLength={80}
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
                maxLength={80}
                autoComplete="address-level1"
                className={inputClass('state')}
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="bio" className="text-xs font-medium text-neutral-600">
                  Short bio
                </label>
                <span
                  className={`text-[11px] tabular-nums ${
                    bioLen > 280 ? 'text-amber-600' : 'text-neutral-400'
                  }`}
                >
                  {bioLen}/300
                </span>
              </div>
              <textarea
                id="bio"
                value={form.bio}
                onChange={set('bio')}
                onBlur={handleBlur('bio')}
                placeholder="College, year, goals…"
                rows={2}
                maxLength={300}
                aria-invalid={Boolean(visibleError('bio'))}
                className={`${inputClass('bio')} resize-y min-h-[3.25rem]`}
              />
              <FieldError message={visibleError('bio')} />
            </div>
          </div>
        </div>

        {requireTerms && (
          <div className="px-4 sm:px-5 py-4 border-b border-neutral-100">
            <SectionHeading
              number="04"
              title="Terms & policies"
              description="Please review and accept to continue."
            />
            <LegalTermsCheckbox
              id="profile-terms-checkbox"
              checked={termsAccepted}
              onChange={(checked) => {
                setTermsAccepted(checked);
                setTouched((prev) => ({ ...prev, terms: true }));
                if (checked) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.terms;
                    return next;
                  });
                  if (submitError) setSubmitError('');
                }
              }}
              termsVersion={TERMS_VERSION}
              openInNewTab={false}
              returnPath={returnPath}
              className="bg-neutral-50 border-neutral-200 rounded-lg"
            />
            <FieldError message={touched.terms || submitError ? fieldErrors.terms : ''} />
          </div>
        )}

        {showPrivacyNote && !requireTerms && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-neutral-100 flex items-start gap-2 text-xs text-neutral-500 bg-neutral-50/50">
            <User className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" aria-hidden />
            Leaderboards show your name only — never email or phone.
          </div>
        )}

        {submitError && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-neutral-100">
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          </div>
        )}

        {/* Save footer — part of the same card, no floating empty gap */}
        <div
          className={`sticky z-20 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-white/95 backdrop-blur border-t border-neutral-100 ${
            elevateSaveBar ? 'bottom-16 md:bottom-3' : 'bottom-3'
          }`}
        >
          <p className="text-xs text-neutral-500 min-h-[1rem]">
            {isDirty && !saving ? 'Unsaved changes' : '\u00A0'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
              isDirty
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
