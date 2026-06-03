'use client';

import { Suspense } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import HomePage from '@/components/HomePage';
import StudentHomeDashboard from '@/components/dashboard/StudentHomeDashboard';

function DashboardLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-neutral-600">Loading your dashboard…</p>
      </div>
    </div>
  );
}

export default function HomePageRouter({ categorySections = [] }) {
  const { user, loading: authLoading } = useAuth();
  const { needsProfile, loading: profileLoading, gateActive } = useProfileGate();

  if (authLoading || (user && profileLoading)) {
    return <DashboardLoader />;
  }

  if (user && !needsProfile && !gateActive) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-20">
        <Suspense fallback={<DashboardLoader />}>
          <StudentHomeDashboard />
        </Suspense>
      </div>
    );
  }

  return <HomePage categorySections={categorySections} />;
}
