"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { getCreationHealth } from "@/lib/mcqCreationApi";

export default function ApiHealthStatus() {
  const [status, setStatus] = useState("checking");
  const [detail, setDetail] = useState("");

  const check = async () => {
    setStatus("checking");
    setDetail("");
    try {
      const data = await getCreationHealth();
      setStatus("ok");
      setDetail(
        typeof data?.data === "string"
          ? data.data
          : data?.meta?.message || "MCQ Creation API is reachable"
      );
    } catch (err) {
      setStatus("error");
      setDetail(
        err?.message ||
          "Cannot reach MCQ Creation API — start the backend on MCQ_API_URL (default :3001)"
      );
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking MCQ API…
      </div>
    );
  }

  if (status === "ok") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {detail}
        </span>
        <button
          type="button"
          onClick={check}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
        >
          <RefreshCw className="h-3 w-3" />
          Recheck
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <span className="inline-flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {detail}
      </span>
      <button
        type="button"
        onClick={check}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}
