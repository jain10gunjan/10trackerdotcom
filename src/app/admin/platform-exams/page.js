'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MetaDataJobs from '@/components/ui/Seo';
import { ArrowLeft, AlertCircle, GraduationCap, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  const exam = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86400000);
}

function ExamRow({ exam, onSave, onToggleActive }) {
  const [examDate, setExamDate] = useState(exam.exam_date || '');
  const [label, setLabel] = useState(exam.exam_date_label || '');
  const [visible, setVisible] = useState(exam.exam_date_visible !== false);
  const [imageUrl, setImageUrl] = useState(exam.image_url || '');
  const [icon, setIcon] = useState(exam.icon || '');
  const [imageFailed, setImageFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setExamDate(exam.exam_date || '');
    setLabel(exam.exam_date_label || '');
    setVisible(exam.exam_date_visible !== false);
    setImageUrl(exam.image_url || '');
    setIcon(exam.icon || '');
    setImageFailed(false);
  }, [
    exam.exam_date,
    exam.exam_date_label,
    exam.exam_date_visible,
    exam.image_url,
    exam.icon,
  ]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const previewDays = daysUntil(examDate);
  const dirty =
    (examDate || '') !== (exam.exam_date || '') ||
    (label || '') !== (exam.exam_date_label || '') ||
    visible !== (exam.exam_date_visible !== false) ||
    (imageUrl || '') !== (exam.image_url || '') ||
    (icon || '') !== (exam.icon || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(exam.slug, {
        exam_date: examDate || null,
        exam_date_label: label,
        exam_date_visible: visible,
        image_url: imageUrl.trim() || null,
        icon: icon.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = imageUrl.trim();

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl border border-neutral-200 bg-emerald-50 overflow-hidden shrink-0 flex items-center justify-center">
            {previewSrc && !imageFailed ? (
              <Image
                src={previewSrc}
                alt=""
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="text-lg">{icon || exam.icon || '📚'}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900">{exam.name}</p>
            <p className="text-xs text-neutral-500 font-mono">{exam.slug}</p>
            {exam.category ? (
              <p className="text-xs text-neutral-500 mt-1">{exam.category}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleActive(exam.slug, !exam.is_active)}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
            exam.is_active ? 'bg-emerald-600' : 'bg-neutral-300'
          }`}
          aria-pressed={exam.is_active}
          title={exam.is_active ? 'Active in onboarding' : 'Hidden from onboarding'}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              exam.is_active ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <label className="block min-w-0">
          <span className="text-xs font-semibold text-neutral-600">Catalog image URL</span>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… (shown on /exams cards)"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            Use a public https image. Clear the field to fall back to the icon.
          </p>
        </label>
        <label className="block sm:w-28">
          <span className="text-xs font-semibold text-neutral-600">Icon</span>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📚"
            maxLength={8}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 text-center"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Exam date</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-neutral-600">
            Label override (optional)
          </span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. May 2026 attempt"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Show days-left on student homepage
        </label>
        <div className="flex items-center gap-3">
          {previewDays != null ? (
            <p className="text-xs text-neutral-500 tabular-nums">
              Preview:{' '}
              {previewDays === 0
                ? 'Today'
                : `${previewDays} day${Math.abs(previewDays) === 1 ? '' : 's'}`}
            </p>
          ) : (
            <p className="text-xs text-neutral-400">No date set</p>
          )}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </li>
  );
}

export default function AdminPlatformExamsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupHint, setSetupHint] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/platform-exams', { credentials: 'include' });
      const data = await parseJsonResponse(res);
      if (!data.success) throw new Error(data.error || 'Failed to load');
      setExams(data.exams || []);
      setSetupHint(data.dbSetupRequired ? data.setupHint : null);
    } catch (e) {
      toast.error(e.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/sign-in?redirect=/admin/platform-exams');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const toggleActive = async (slug, is_active) => {
    try {
      await toastPromise(
        async () => {
          const res = await fetch('/api/admin/platform-exams', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ slug, is_active }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error);
          setExams((prev) =>
            prev.map((e) => (e.slug === slug ? { ...e, is_active: data.exam.is_active } : e))
          );
          return `${data.exam.name} ${data.exam.is_active ? 'enabled' : 'disabled'}`;
        },
        {
          loading: 'Updating exam…',
          success: (msg) => msg,
          error: (e) => e.message || 'Update failed',
        }
      );
    } catch {
      /* toast.promise surfaces the error */
    }
  };

  const saveExam = async (slug, patch) => {
    await toastPromise(
      async () => {
        const res = await fetch('/api/admin/platform-exams', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ slug, ...patch }),
        });
        const data = await parseJsonResponse(res);
        if (!data.success) throw new Error(data.error);
        setExams((prev) => prev.map((e) => (e.slug === slug ? { ...e, ...data.exam } : e)));
        if (data.dbSetupRequired) {
          setSetupHint(
            'Run supabase/migrations/add_platform_exam_dates.sql in Supabase SQL Editor'
          );
        }
        return 'Exam saved';
      },
      {
        loading: 'Saving exam…',
        success: (msg) => msg,
        error: (e) => e.message || 'Save failed',
      }
    );
  };

  if (!authLoading && !isAdmin) {
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <MetaDataJobs seoTitle="Platform exams" seoDescription="Admin exam catalog" />
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Admin
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
        <GraduationCap className="w-7 h-7" />
        Platform exams
      </h1>
      <p className="text-sm text-neutral-600 mt-2 mb-6">
        Toggle exams for onboarding, set catalog images, and configure the exam-date countdown
        on the signed-in homepage.
      </p>

      {setupHint && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Run <code className="text-xs bg-white px-1 rounded">{setupHint}</code> in Supabase
          SQL Editor. For countdown fields also run{' '}
          <code className="text-xs bg-white px-1 rounded">
            supabase/migrations/add_platform_exam_dates.sql
          </code>
          .
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : (
        <ul className="space-y-4">
          {exams.map((exam) => (
            <ExamRow
              key={exam.slug}
              exam={exam}
              onSave={saveExam}
              onToggleActive={toggleActive}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
