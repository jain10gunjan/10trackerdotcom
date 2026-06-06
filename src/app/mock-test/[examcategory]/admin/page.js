"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockTestAdminBase } from "@/lib/mockTestAdminPaths";

/** Redirect legacy URL → /admin/mock-tests/[category] */
export default function LegacyMockTestAdminRedirect() {
  const params = useParams();
  const router = useRouter();
  const examcategory = params?.examcategory || "gate-cse";

  useEffect(() => {
    router.replace(mockTestAdminBase(examcategory));
  }, [router, examcategory]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      Redirecting to admin mock tests…
    </div>
  );
}
