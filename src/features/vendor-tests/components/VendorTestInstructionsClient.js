'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Clock, ListOrdered, Shield } from 'lucide-react';
import VendorPortalShell from './VendorPortalShell';
import VendorPageHeader, {
  VendorCard,
  VendorPrimaryButton,
  VendorSecondaryButton,
  VendorStatTile,
} from './VendorUi';
import {
  DEFAULT_ENROLLMENT_RULES,
  enrollmentHelpText,
  validateRollNo,
} from '@/features/vendor-tests/lib/vendorEnrollment';

function inWindow(test, now = new Date()) {
  if (test?.starts_at && now < new Date(test.starts_at)) return false;
  if (test?.ends_at && now > new Date(test.ends_at)) return false;
  return true;
}

export default function VendorTestInstructionsClient({
  slug,
  test,
  questionCount,
  priorAttempts = [],
  initialProfile = null,
  enrollmentRules = DEFAULT_ENROLLMENT_RULES,
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState(initialProfile || {});
  const [rollInput, setRollInput] = useState(initialProfile?.roll_no || '');
  const [nameInput, setNameInput] = useState(initialProfile?.display_name || '');
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  const open = inWindow(test);
  const savedRoll = String(profile?.roll_no || '').trim();
  const savedRollCheck = savedRoll ? validateRollNo(savedRoll, enrollmentRules) : { ok: false };
  const enrollmentOk = savedRollCheck.ok;
  const enrollmentHelp = enrollmentHelpText(enrollmentRules);
  const inProgress = priorAttempts.find((a) => a.status === 'in_progress');
  const finished = priorAttempts.filter((a) =>
    ['submitted', 'auto_submitted'].includes(a.status)
  );
  const maxAttempts = Math.max(1, Number(test.max_attempts) || 1);
  const attemptsLeft = Math.max(0, maxAttempts - finished.length - (inProgress ? 1 : 0));

  const saveEnrollment = async (e) => {
    e?.preventDefault?.();
    setSavingEnrollment(true);
    try {
      const format = validateRollNo(rollInput, enrollmentRules);
      if (!format.ok) throw new Error(format.error);
      const res = await fetch(`/api/practice-tests/${slug}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll_no: rollInput,
          display_name: nameInput || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not save enrollment');
      setProfile(data.profile);
      toast.success('Enrollment saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingEnrollment(false);
    }
  };

  const startOrResume = async () => {
    if (!enrollmentOk) {
      toast.error(savedRollCheck.error || 'Enter your enrollment / roll number first');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-tests/${slug}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.code === 'enrollment_required' || data.code === 'enrollment_invalid') {
          setProfile((p) => ({ ...p, roll_no: null }));
        }
        throw new Error(data.error || 'Could not start attempt');
      }
      const id = data.attempt?.id;
      if (!id) throw new Error('No attempt id returned');
      toast.success(data.resumed ? 'Resuming attempt' : 'Attempt started');
      router.push(`/practice-tests/${slug}/attempt/${id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <VendorPortalShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <VendorPageHeader
          backHref={`/practice-tests/${slug}/tests`}
          backLabel="All tests"
          title={test.title}
          description={test.description || 'Read the instructions, confirm enrollment, then start.'}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <VendorStatTile
            label="Duration"
            value={`${test.duration_minutes}m`}
            tone="teal"
            hint={<Clock className="inline h-3 w-3" />}
          />
          <VendorStatTile
            label="Questions"
            value={questionCount || test.total_questions || 0}
            tone="neutral"
            hint={<ListOrdered className="inline h-3 w-3" />}
          />
          <VendorStatTile
            label="Negative marking"
            value={
              Number(test.negative_marking) > 0 ? `−${test.negative_marking}×` : 'None'
            }
            tone="amber"
            hint={<Shield className="inline h-3 w-3" />}
          />
        </div>

        <VendorCard className="mt-5 p-5 sm:p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
            Enrollment
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Required before every test. Shown on institute results. {enrollmentHelp}
          </p>
          {savedRoll && !savedRollCheck.ok ? (
            <p className="mt-2 text-sm text-rose-700">{savedRollCheck.error} Update it below.</p>
          ) : null}
          {enrollmentOk ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
              <p className="text-sm text-emerald-900">
                <span className="font-semibold">{profile.roll_no}</span>
                {profile.display_name ? (
                  <span className="text-emerald-700"> · {profile.display_name}</span>
                ) : null}
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-teal-700 hover:underline"
                onClick={() => setProfile((p) => ({ ...p, roll_no: '' }))}
              >
                Change
              </button>
            </div>
          ) : (
            <form onSubmit={saveEnrollment} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="font-medium text-neutral-800">Enrollment / roll no *</span>
                <input
                  required
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder={
                    enrollmentRules.prefix
                      ? `${enrollmentRules.prefix}…`
                      : 'Enrollment / roll number'
                  }
                  minLength={enrollmentRules.minLength}
                  maxLength={enrollmentRules.maxLength}
                  inputMode={enrollmentRules.digitsOnly ? 'numeric' : 'text'}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-neutral-800">Display name</span>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="Your name"
                />
              </label>
              <VendorPrimaryButton type="submit" disabled={savingEnrollment}>
                {savingEnrollment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save enrollment
              </VendorPrimaryButton>
            </form>
          )}
        </VendorCard>

        {test.instructions ? (
          <VendorCard className="mt-5 p-5 sm:p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Instructions
            </h2>
            <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-neutral-800">
              {test.instructions}
            </div>
          </VendorCard>
        ) : (
          <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-neutral-600">
            <li>Answers autosave. You can resume if you leave mid-test.</li>
            <li>Scoring is server-side — answer keys are never sent during the test.</li>
            {test.anti_cheat_enabled !== false ? (
              <li>
                The test must stay in fullscreen. Leaving fullscreen or switching away counts
                as one switch. More than {test.max_focus_violations || 4} switches auto-submits
                the test and marks it as cheated. Your answers are still scored.
              </li>
            ) : null}
          </ul>
        )}

        {!open ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This test is outside its schedule window.
          </p>
        ) : null}

        {finished.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Previous attempts
            </p>
            {finished.map((a) => (
              <Link
                key={a.id}
                href={`/practice-tests/${slug}/results/${a.id}`}
                className="flex items-center justify-between rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-teal-300"
              >
                <span className="text-neutral-700">
                  {String(a.status).replace(/_/g, ' ')} ·{' '}
                  {a.submitted_at
                    ? new Date(a.submitted_at).toLocaleString()
                    : '—'}
                </span>
                <span className="font-semibold text-teal-700">View →</span>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <VendorPrimaryButton
            type="button"
            disabled={
              busy || !open || !enrollmentOk || (!inProgress && attemptsLeft <= 0)
            }
            onClick={startOrResume}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {inProgress ? 'Resume test' : 'Start test'}
          </VendorPrimaryButton>
          <p className="text-xs text-neutral-500">
            {!enrollmentOk
              ? 'Save your enrollment / roll number to continue.'
              : inProgress
                ? 'You have an in-progress attempt.'
                : `${attemptsLeft} of ${maxAttempts} attempt(s) remaining.`}
          </p>
        </div>
      </div>
    </VendorPortalShell>
  );
}
