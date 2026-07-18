"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MetaDataJobs from "@/components/ui/Seo";
import McqCreationApp from "@/features/admin/components/mcq-creation/McqCreationApp";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminMcqCreationPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/admin/mcq-creation");
    }
  }, [loading, user, router]);

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="MCQ Creation" seoDescription="Admin MCQ creation pipeline" />
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin only</h1>
          <p className="mt-2 text-sm text-neutral-600">
            You don&apos;t have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs
        seoTitle="MCQ Creation"
        seoDescription="PDF to MCQ extraction pipeline"
      />
      <Link
        href="/admin"
        className="mb-2 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 sm:mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Admin
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          MCQ creation
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Create MCQs from PDF upload or web URLs using OpenAI (including web search
          for copyright-free content). Preview, optionally rewrite, export JSON, and
          browse past exports.
        </p>
      </div>
      <McqCreationApp />
    </div>
  );
}
