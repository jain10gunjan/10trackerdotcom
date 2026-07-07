"use client";

import { useState } from "react";
import { Download, Eye, FileJson, Loader2, RefreshCw } from "lucide-react";
import { proxiedDownloadUrl } from "@/lib/mcqCreationApi";
import McqPreviewTable from "./McqPreviewTable";
import MethodBadge from "./MethodBadge";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ExportHistoryTable({
  files = [],
  loading = false,
  onRefresh,
  onPreview,
  previewMcqs = [],
  previewFilename = null,
  onClosePreview,
}) {
  const [previewLoading, setPreviewLoading] = useState(null);

  const handlePreview = async (filename) => {
    setPreviewLoading(filename);
    try {
      await onPreview?.(filename);
    } finally {
      setPreviewLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-16 text-sm text-neutral-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading exports…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{files.length}</span> saved export
          {files.length === 1 ? "" : "s"}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      {!files.length ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
          <FileJson className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">No exports yet.</p>
          <p className="mt-1 text-xs text-neutral-400">
            Run the pipeline or export from the creation workspace.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Filename</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">MCQs</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {files.map((file) => (
                <tr key={file.filename} className="hover:bg-neutral-50/80">
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-900">
                    {file.filename}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{file.size_kb} KB</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {file.total_mcqs ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {file.source_type || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <MethodBadge method={file.method} sourceType={file.source_type} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(file.filename)}
                        disabled={previewLoading === file.filename}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {previewLoading === file.filename ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        Preview
                      </button>
                      <a
                        href={proxiedDownloadUrl(file.filename)}
                        download={file.filename}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewFilename && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-neutral-900">
              Preview: {previewFilename}
            </h3>
            <button
              type="button"
              onClick={onClosePreview}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Close
            </button>
          </div>
          <McqPreviewTable mcqs={previewMcqs} />
        </div>
      )}
    </div>
  );
}
