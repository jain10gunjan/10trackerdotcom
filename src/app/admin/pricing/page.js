"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PricingAdmin from "@/features/admin/components/pricing/PricingAdmin";

export default function AdminPricingPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?redirect=/admin/pricing");
    }
  }, [authLoading, user, router]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin only</h1>
        </div>
      </div>
    );
  }

  return <PricingAdmin />;
}
