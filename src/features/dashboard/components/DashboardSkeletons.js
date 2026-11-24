'use client';

function Bone({ className = '' }) {
  return <div className={`rounded-lg bg-[#E8EDF8] ${className}`} aria-hidden />;
}

function Card({ className = '', children, ...rest }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-neutral-200 bg-white ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-busy="true" aria-label="Loading profile">
      <Card className="overflow-hidden p-5 shadow-sm">
        <div className="flex flex-col items-center">
          <Bone className="mb-3 h-20 w-20 rounded-2xl bg-[#E8EDF8]" />
          <Bone className="mb-2 h-5 w-36" />
          <Bone className="mb-4 h-3 w-44 max-w-full" />
          <Bone className="h-12 w-full rounded-xl" />
        </div>
        <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
          <Bone className="h-4 w-32 bg-[#E8EDF8]" />
          <div className="flex gap-2">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Bone className="mt-4 h-11 w-full rounded-xl" />
      </Card>
      <Card className="space-y-3 p-4 shadow-sm">
        <Bone className="h-3 w-20 bg-[#E8EDF8]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 py-1">
            <Bone className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bone className="h-3 w-24" />
              <Bone className="h-4 w-16" />
            </div>
          </div>
        ))}
      </Card>
    </aside>
  );
}

export function ProgressCardSkeleton() {
  return (
    <Card className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:gap-8" aria-hidden>
      <Bone className="h-[140px] w-[140px] shrink-0 rounded-full bg-[#E8EDF8]" />
      <div className="w-full min-w-0 flex-1 space-y-3">
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-full max-w-sm" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </Card>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-3 xl:w-56" aria-hidden>
      <Bone className="h-28 rounded-2xl border border-neutral-200 bg-white" />
      <Bone className="h-28 rounded-2xl border border-neutral-200 bg-white" />
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <Card className="space-y-4 p-4" aria-hidden>
      <div className="flex justify-between gap-3">
        <div className="flex min-w-0 gap-2">
          <Bone className="h-8 w-20 rounded-lg" />
          <Bone className="h-8 w-24 rounded-lg" />
        </div>
        <Bone className="h-4 w-32 max-w-[40%] bg-[#E8EDF8]" />
      </div>
      <Bone className="h-24 w-full rounded-xl" />
      <Bone className="h-3 w-64 max-w-full" />
    </Card>
  );
}

export function RecentActivitySkeleton() {
  return (
    <Card className="px-4" aria-hidden>
      <div className="flex gap-1.5 border-b border-neutral-200 py-3">
        <Bone className="h-8 w-16 rounded-lg bg-[#E8EDF8]" />
        <Bone className="h-8 w-20 rounded-lg" />
        <Bone className="h-8 w-16 rounded-lg" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 border-b border-neutral-100 py-3.5 last:border-0">
          <Bone className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Bone className="h-4 w-3/4 max-w-xs" />
            <Bone className="h-3 w-1/2 max-w-[180px]" />
          </div>
          <Bone className="hidden h-3 w-12 shrink-0 sm:block" />
        </div>
      ))}
    </Card>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="min-w-0 space-y-2" aria-hidden>
      <Bone className="mb-3 h-10 w-full rounded-xl bg-[#E8EDF8]" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Bone key={i} className="h-11 w-full rounded-lg border border-neutral-200 bg-white" />
      ))}
    </div>
  );
}
