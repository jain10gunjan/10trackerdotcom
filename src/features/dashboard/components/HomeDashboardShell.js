'use client';

import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

function Bone({ className = '' }) {
  return <div className={`rounded-xl bg-[#E8EDF8] ${className}`} aria-hidden />;
}

/** Loading shell aligned with the signed-in home: neutral page, white cards, brand soft. */
export default function HomeDashboardShell() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <section
        className="relative overflow-hidden pb-8 sm:pb-10"
        style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%)',
          }}
          aria-hidden
        />
        <div className={`relative mx-auto max-w-7xl space-y-4 pt-5 sm:pt-7 ${APP_GUTTER}`}>
          <Bone className="h-4 w-28 rounded-full bg-[#E8EDF8]" />
          <Bone className="h-10 w-64 max-w-full" />
          <Bone className="h-4 w-full max-w-md" />
          <Bone className="h-28 w-full rounded-2xl border border-neutral-200 bg-white" />
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            <Bone className="h-32 rounded-2xl border border-neutral-200 bg-white" />
            <Bone className="hidden h-32 rounded-2xl border border-neutral-200 bg-white sm:block" />
            <Bone className="hidden h-32 rounded-2xl border border-neutral-200 bg-white sm:block" />
          </div>
        </div>
      </section>

      <div className={`mx-auto max-w-7xl space-y-8 pb-12 sm:pb-16 ${APP_GUTTER}`}>
        <Bone className="h-[5.5rem] w-full rounded-2xl border border-neutral-200 bg-white" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Bone className="h-36 rounded-2xl border border-neutral-200 bg-white" />
          <Bone className="h-36 rounded-2xl border border-neutral-200 bg-white" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Bone className="h-3 w-24 bg-[#E8EDF8]" />
            <Bone className="h-7 w-48 max-w-full" />
            <Bone className="h-32 rounded-2xl border border-neutral-200 bg-white" />
          </div>
        ))}
      </div>
    </div>
  );
}
