'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import MetaDataJobs from '@/components/ui/Seo';
import OgTrackersAdmin from '@/features/admin/components/og-trackers/OgTrackersAdmin';

export default function AdminOgTrackersPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in?redirect=/admin/og-trackers');
    }
  }, [loading, user, router]);

  if (!isAdmin && !loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <MetaDataJobs seoTitle="OG Trackers admin" seoDescription="Admin" />
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="font-medium">Admin access only</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="OG Trackers admin" seoDescription="Curate paths" />
      <OgTrackersAdmin />
    </div>
  );
}
