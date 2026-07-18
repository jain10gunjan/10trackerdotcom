"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MetaDataJobs from "@/components/ui/Seo";
import { parseJsonResponse } from "@/lib/toastAsync";
import { mockTestAdminBase } from "@/features/mock-test/lib/mockTestAdminPaths";
import { formatExamSlug } from "@/lib/platformExams";
import { AlertCircle, ChevronRight, ClipboardList, Loader2 } from "lucide-react";

export default function AdminMockTestsHubPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?redirect=/admin/mock-tests");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/platform-exams", { credentials: "include" });
        const data = await parseJsonResponse(res);
        if (!cancelled && data.success) {
          const list = (data.exams || []).filter((e) => e.is_active !== false);
          setExams(list.length ? list : data.exams || []);
        }
      } catch {
        if (!cancelled) setExams([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="Mock tests" seoDescription="Admin mock tests" />
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin only</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="Mock tests admin" seoDescription="Manage mock tests" />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Mock tests</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Choose an exam category to create, edit, or deactivate mock tests. Create tools also
          remain at <code className="rounded bg-neutral-100 px-1 text-xs">/mock-test/…/admin/create</code>.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-sm text-neutral-600">No platform exams found.</p>
          <Link
            href="/admin/platform-exams"
            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline"
          >
            Manage platform exams
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exams.map((exam) => (
            <li key={exam.slug}>
              <Link
                href={mockTestAdminBase(exam.slug)}
                className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-sm font-bold text-white">
                  {(exam.slug || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900 group-hover:text-neutral-800">
                    {exam.name || formatExamSlug(exam.slug)}
                  </p>
                  <p className="truncate text-xs text-neutral-500">{exam.slug}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
