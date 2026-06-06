'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import MetaDataJobs from '@/components/Seo';
import { ArrowLeft, AlertCircle, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

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
        Active exams appear in profile onboarding (multi-select). Inactive exams are hidden from new signups.
      </p>

      {setupHint && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Run <code className="text-xs bg-white px-1 rounded">scripts/setup_platform_exams.sql</code> in Supabase
          SQL Editor.
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li
              key={exam.slug}
              className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900">{exam.name}</p>
                <p className="text-xs text-neutral-500 font-mono">{exam.slug}</p>
                {exam.category && (
                  <p className="text-xs text-neutral-500 mt-1">{exam.category}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleActive(exam.slug, !exam.is_active)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  exam.is_active ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
                aria-pressed={exam.is_active}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    exam.is_active ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
