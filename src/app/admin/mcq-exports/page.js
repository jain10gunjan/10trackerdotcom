"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import MetaDataJobs from "@/components/Seo";
import ExportHistoryTable from "@/components/admin/mcq-creation/ExportHistoryTable";
import { McqMathProvider } from "@/components/admin/mcq-creation/MathHtmlRenderer";
import { fetchExportJson, getExportFiles } from "@/lib/mcqCreationApi";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminMcqExportsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMcqs, setPreviewMcqs] = useState([]);
  const [previewFilename, setPreviewFilename] = useState(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?redirect=/admin/mcq-exports");
    }
  }, [authLoading, user, router]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getExportFiles();
      setFiles(result.files || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load exports");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) loadFiles();
  }, [authLoading, isAdmin, loadFiles]);

  const handlePreview = async (filename) => {
    try {
      const data = await fetchExportJson(filename);
      const list = Array.isArray(data) ? data : data?.data || data?.mcqs || [];
      setPreviewMcqs(list);
      setPreviewFilename(filename);
    } catch (err) {
      toast.error(err?.message || "Preview failed");
    }
  };

  if (!authLoading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="MCQ Exports" seoDescription="Export history" />
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
      <MetaDataJobs seoTitle="MCQ Exports" seoDescription="Browse saved MCQ exports" />
      <Link
        href="/admin/mcq-creation"
        className="mb-2 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 sm:mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        MCQ creation
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Export history
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Browse, download, and preview JSON files saved by the creation pipeline.
        </p>
      </div>
      <McqMathProvider>
      <ExportHistoryTable
        files={files}
        loading={loading || authLoading}
        onRefresh={loadFiles}
        onPreview={handlePreview}
        previewMcqs={previewMcqs}
        previewFilename={previewFilename}
        onClosePreview={() => {
          setPreviewFilename(null);
          setPreviewMcqs([]);
        }}
      />
      </McqMathProvider>
    </div>
  );
}
