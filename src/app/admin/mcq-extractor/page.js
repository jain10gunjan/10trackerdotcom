"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import MetaDataJobs from "@/components/Seo";
import McqExtractorApp from "@/components/admin/mcq-extractor/McqExtractorApp";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminMcqExtractorPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [viewingQuestions, setViewingQuestions] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/admin/mcq-extractor");
    }
  }, [loading, user, router]);

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="MCQ Extractor" seoDescription="Admin PDF MCQ extraction" />
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
        seoTitle="MCQ Extractor"
        seoDescription="Extract and review MCQs from PDF"
      />
      {!viewingQuestions && (
        <Link
          href="/admin"
          className="mb-2 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 sm:mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
      )}
      <div
        className={`sm:mb-4 ${viewingQuestions ? "mb-1 hidden sm:block" : "mb-3"}`}
      >
        <h1 className="hidden text-2xl font-semibold tracking-tight text-neutral-900 sm:block">
          MCQ extractor
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 sm:mt-1">
          <span className="sm:hidden">
            Extract PDFs, review questions, rewrite with AI, and save to the database.
          </span>
          <span className="hidden sm:inline">
            Extract from PDF, review and edit examtracker questions, rewrite with AI,
            and save to Supabase.
          </span>
        </p>
      </div>
      <McqExtractorApp onViewingQuestionsChange={setViewingQuestions} />
    </div>
  );
}
