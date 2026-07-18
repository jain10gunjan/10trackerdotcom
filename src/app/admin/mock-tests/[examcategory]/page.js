"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MetaDataJobs from "@/components/ui/Seo";
import MockTestCategoryAdmin from "@/features/admin/components/mock-tests/MockTestCategoryAdmin";
import { categoryLabelFromSlug } from "@/features/mock-test/lib/mockTestAdminPaths";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminMockTestCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const examcategory = params?.examcategory || "gate-cse";
  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/sign-in?redirect=/admin/mock-tests/${examcategory}`);
    }
  }, [authLoading, user, router, examcategory]);

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
      <MetaDataJobs
        seoTitle={`${categoryLabelFromSlug(examcategory)} mock tests`}
        seoDescription="Manage mock tests"
      />
      <Link
        href="/admin/mock-tests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All exam categories
      </Link>
      <MockTestCategoryAdmin examcategory={examcategory} />
    </div>
  );
}
