'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MetaDataJobs from '@/components/ui/Seo';
import GateCseBlueprintWizard from '@/features/admin/components/mock-tests/GateCseBlueprintWizard';
import { AlertCircle } from 'lucide-react';
import { isGateCseExamSlug } from '@/features/mock-test/lib/gateCseBlueprint';

export default function GateBlueprintAdminPage() {
  const router = useRouter();
  const params = useParams();
  const examcategory = params?.examcategory || 'gate-cse';
  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/sign-in?redirect=/admin/mock-tests/${examcategory}/gate-blueprint`);
    }
  }, [authLoading, user, router, examcategory]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin only</h1>
        </div>
      </div>
    );
  }

  if (!isGateCseExamSlug(examcategory)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Blueprint wizard is only available for <strong>gate-cse</strong>.
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="GATE CSE blueprint mock" seoDescription="Generate GATE CSE full mock" />
      <GateCseBlueprintWizard examcategory={examcategory} />
    </div>
  );
}
