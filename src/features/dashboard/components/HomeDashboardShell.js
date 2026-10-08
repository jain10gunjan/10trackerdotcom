'use client';

export default function HomeDashboardShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14 sm:pb-20">
        <div className="mb-6 flex justify-end animate-pulse">
          <div className="h-9 w-52 rounded-2xl border border-neutral-200 bg-white" />
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm animate-pulse">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
          <div className="p-6 sm:p-8 lg:p-10 space-y-4">
            <div className="h-6 w-44 bg-neutral-200 rounded-full" />
            <div className="h-10 w-64 max-w-full bg-neutral-200 rounded" />
            <div className="h-4 w-80 max-w-full bg-neutral-100 rounded" />
            <div className="h-28 w-full bg-neutral-100 rounded-2xl mt-2" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-neutral-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
          <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
          <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
        </div>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-neutral-200 bg-white" />
          ))}
        </div>

        <div className="mt-10 space-y-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-20 bg-emerald-100 rounded" />
              <div className="h-7 w-48 bg-neutral-200 rounded" />
              <div className="h-32 rounded-2xl border border-neutral-200 bg-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
