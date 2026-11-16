'use client';

import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

/** Loading shell aligned with guest homepage + student hero chrome. */
export default function HomeDashboardShell() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <section
        className="relative overflow-hidden pb-8 sm:pb-10"
        style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%), linear-gradient(180deg, #F8FAFC 0%, #F5F5F5 100%)',
          }}
        />
        <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-5 sm:pt-7 space-y-4`}>
          <Bone className="h-5 w-40 rounded-full" />
          <Bone className="h-12 w-72 max-w-full" />
          <Bone className="h-4 w-full max-w-md" />
          <Bone className="h-28 w-full rounded-2xl bg-white border border-neutral-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Bone className="h-36 rounded-2xl bg-white border border-neutral-200" />
            <Bone className="h-36 rounded-2xl bg-white border border-neutral-200 hidden sm:block" />
            <Bone className="h-36 rounded-2xl bg-white border border-neutral-200 hidden sm:block" />
          </div>
        </div>
      </section>

      <div className={`max-w-7xl mx-auto ${APP_GUTTER} space-y-8 pb-16`}>
        <Bone className="h-[5.5rem] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Bone className="h-36 rounded-2xl" />
          <Bone className="h-36 rounded-2xl" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Bone className="h-3 w-24 bg-[#E8EDF8]" />
            <Bone className="h-7 w-48" />
            <Bone className="h-32 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
