"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

const MAX_BYTES = 50 * 1024 * 1024;

function validatePdf(file) {
  if (!file) return "Select a PDF file";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files are allowed";
  }
  if (file.size > MAX_BYTES) return "PDF must be 50 MB or smaller";
  return null;
}

export default function PdfUploadForm({
  pdf,
  onPdfChange,
  rewrite = false,
  onRewriteChange,
  includeRaw = false,
  onIncludeRawChange,
  showRewrite = false,
  showRaw = false,
  disabled = false,
  children,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);

  const pickFile = useCallback(
    (file) => {
      const err = validatePdf(file);
      setFileError(err);
      if (!err) onPdfChange(file);
      else onPdfChange(null);
    },
    [onPdfChange]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-neutral-200 bg-white hover:border-neutral-300"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pickFile(file);
          }}
        />
        {pdf ? (
          <>
            <FileText className="mb-3 h-10 w-10 text-indigo-600" />
            <p className="text-sm font-medium text-neutral-900">{pdf.name}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {(pdf.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPdfChange(null);
                setFileError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-900">
              Drop PDF here or click to browse
            </p>
            <p className="mt-1 text-xs text-neutral-500">PDF only, max 50 MB</p>
          </>
        )}
      </div>

      {fileError && (
        <p className="text-sm text-red-600" role="alert">
          {fileError}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
        {showRewrite && (
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={rewrite}
              disabled={disabled}
              onChange={(e) => onRewriteChange?.(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Rewrite after extract
          </label>
        )}
        {showRaw && (
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={includeRaw}
              disabled={disabled}
              onChange={(e) => onIncludeRawChange?.(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Include raw text (debug)
          </label>
        )}
      </div>

      {children}
    </div>
  );
}

export { validatePdf, MAX_BYTES };
