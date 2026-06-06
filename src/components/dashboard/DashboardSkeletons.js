'use client';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-200/90 ${className}`} aria-hidden />;
}

export function SidebarSkeleton() {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-busy="true" aria-label="Loading profile">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden p-5">
        <div className="flex flex-col items-center">
          <Bone className="w-20 h-20 rounded-2xl mb-3" />
          <Bone className="h-5 w-36 mb-2" />
          <Bone className="h-3 w-44 mb-4" />
          <Bone className="h-12 w-full rounded-xl" />
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
          <Bone className="h-4 w-32" />
          <div className="flex gap-2">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Bone className="h-10 w-full rounded-xl mt-4" />
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 space-y-3">
        <Bone className="h-3 w-20" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 py-1">
            <Bone className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-24" />
              <Bone className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ProgressCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8" aria-hidden>
      <Bone className="w-[140px] h-[140px] rounded-full shrink-0" />
      <div className="flex-1 w-full space-y-3">
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-full max-w-sm" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="flex flex-col gap-3 xl:w-56" aria-hidden>
      <Bone className="h-28 rounded-2xl" />
      <Bone className="h-28 rounded-2xl" />
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex justify-between gap-3">
        <div className="flex gap-2">
          <Bone className="h-8 w-20 rounded-lg" />
          <Bone className="h-8 w-24 rounded-lg" />
        </div>
        <Bone className="h-4 w-32" />
      </div>
      <Bone className="h-24 w-full rounded-xl" />
      <Bone className="h-3 w-64" />
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="flex gap-2 border-b border-neutral-100 pb-3 mb-2">
        <Bone className="h-8 w-28 rounded-lg" />
        <Bone className="h-8 w-24 rounded-lg" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between py-2">
          <div className="space-y-1.5 flex-1 mr-4">
            <Bone className="h-4 w-3/4 max-w-xs" />
            <Bone className="h-3 w-1/2 max-w-[180px]" />
          </div>
          <Bone className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Bone className="h-10 w-full rounded-xl mb-3" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Bone key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}
