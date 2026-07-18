"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MetaDataJobs from "@/components/ui/Seo";
import GkTodayAdmin from "@/features/admin/components/gktoday/GkTodayAdmin";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminGkTodayPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/admin/gktoday");
    }
  }, [loading, user, router]);

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="GKToday" seoDescription="Admin GKToday article pipeline" />
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
        seoTitle="GKToday"
        seoDescription="Fetch, AI-rewrite, and publish GKToday current affairs"
      />
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Admin
      </Link>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">GKToday pipeline</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Browse GKToday current affairs, rewrite with AI, edit the draft, and publish articles.
        </p>
      </div>
      <GkTodayAdmin />
    </div>
  );
}
