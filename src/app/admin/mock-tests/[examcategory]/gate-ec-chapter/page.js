'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MetaDataJobs from '@/components/ui/Seo';
import GateEcChapterMockPanel from '@/features/admin/components/mock-tests/GateEcChapterMockPanel';
import { AlertCircle } from 'lucide-react';
import { isGateEcExamSlug } from '@/features/mock-test/lib/gateEcBlueprint';

export default function GateEcChapterAdminPage() {
  const router = useRouter();
  const params = useParams();
  const examcategory = params?.examcategory || 'gate-ec';
  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/sign-in?redirect=/admin/mock-tests/${examcategory}/gate-ec-chapter`);
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

  if (!isGateEcExamSlug(examcategory)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Chapter mock generator is only for <strong>gate-ec</strong>.
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="GATE EC chapter mock" seoDescription="Generate GATE EC chapter mock" />
      <GateEcChapterMockPanel examcategory={examcategory} />
    </div>
  );
}
