'use client';

import DashboardPageHeader from '@/features/dashboard/components/DashboardPageHeader';
import DashboardContinueCard from '@/features/dashboard/components/DashboardContinueCard';
import DashboardQuickStats from '@/features/dashboard/components/DashboardQuickStats';
import { HeatmapSkeleton, RecentActivitySkeleton } from '@/features/dashboard/components/DashboardSkeletons';

function CardShell({ children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-100">
        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function HomeDashboardShell() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
          <div className="hidden lg:block space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-neutral-200 rounded" />
                  <div className="h-3 w-36 bg-neutral-200 rounded" />
                </div>
              </div>
              <div className="h-9 w-full bg-neutral-200 rounded-xl mt-4" />
            </div>
          </div>

          <div className="space-y-5 min-w-0">
            <DashboardPageHeader loading />
            <DashboardContinueCard loading />
            <DashboardQuickStats loading />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <CardShell>
                <HeatmapSkeleton />
              </CardShell>
              <CardShell>
                <RecentActivitySkeleton />
              </CardShell>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
