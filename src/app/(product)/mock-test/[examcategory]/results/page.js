"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Results listing is integrated into the main mock-test listing at
 * /mock-test/[examcategory] under the "Results & Analytics" tab.
 * This redirect keeps old /results links working.
 */
export default function MockTestResultsRedirect() {
  const { examcategory } = useParams();
  const router = useRouter();

  useEffect(() => {
    const base = `/mock-test/${examcategory || "gate-cse"}`;
    router.replace(`${base}?tab=progress`);
  }, [examcategory, router]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-neutral-200 rounded-full border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-600">Redirecting to My Progress…</p>
      </div>
    </div>
  );
}
