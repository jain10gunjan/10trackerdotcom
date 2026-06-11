'use client';

import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardContinueCard from '@/components/dashboard/DashboardContinueCard';
import { HeatmapSkeleton, RecentActivitySkeleton } from '@/components/dashboard/DashboardSkeletons';

function CardShell({ title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {title ? (
        <div className="px-5 py-4 border-b border-neutral-100">
          <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function HomeDashboardShell() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pb-12 space-y-6">
        <div className="lg:hidden h-[76px] rounded-2xl bg-neutral-200/80 animate-pulse" />
        <DashboardHero loading />
        <DashboardContinueCard loading />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CardShell title>
            <HeatmapSkeleton />
          </CardShell>
          <CardShell title>
            <RecentActivitySkeleton />
          </CardShell>
        </div>
      </div>
    </div>
  );
}
