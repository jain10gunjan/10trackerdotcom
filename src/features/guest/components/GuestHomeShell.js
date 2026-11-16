'use client';

import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

export default function GuestHomeShell() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <section
        className="relative overflow-hidden pb-10 sm:pb-14 bg-[#F8FAFC]"
        style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 85% 15%, #E8EDF8 0%, transparent 55%)',
          }}
        />
        <div className={`relative max-w-7xl mx-auto ${APP_GUTTER} pt-5 sm:pt-8 md:pt-9`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 sm:gap-8 md:items-center">
            <div className="md:col-span-5 space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
              <Bone className="h-5 w-40" />
              <Bone className="h-12 sm:h-14 w-52 sm:w-72" />
              <Bone className="h-8 w-full max-w-md" />
              <Bone className="h-4 w-full max-w-sm" />
              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-2 w-full sm:w-auto justify-center md:justify-start">
                <Bone className="h-11 w-full sm:w-40 bg-[#3F5EB9]/30" />
                <Bone className="h-11 w-full sm:w-36" />
                <Bone className="h-11 w-full sm:w-44" />
              </div>
            </div>
            <div className="md:col-span-7 w-full max-w-lg sm:max-w-xl mx-auto md:max-w-none">
              <Bone className="h-[320px] sm:h-[400px] lg:h-[440px] rounded-2xl sm:rounded-[1.75rem] bg-white border border-neutral-200" />
            </div>
          </div>
        </div>
      </section>

      <div className={`max-w-7xl mx-auto ${APP_GUTTER} space-y-10 pb-16 pt-1`}>
        <Bone className="h-[5.5rem] w-full rounded-2xl" />

        <div className="space-y-4">
          <Bone className="h-6 w-28" />
          <Bone className="h-9 w-72 max-w-full" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
            <Bone className="md:col-span-5 h-72 rounded-2xl" />
            <div className="md:col-span-7 space-y-3">
              <Bone className="h-24 rounded-xl" />
              <Bone className="h-24 rounded-xl" />
              <Bone className="h-24 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Bone className="h-6 w-28" />
          <Bone className="h-9 w-80 max-w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Bone className="h-56 rounded-2xl" />
            <Bone className="h-56 rounded-2xl hidden sm:block" />
            <Bone className="h-56 rounded-2xl hidden sm:block" />
          </div>
        </div>

        <div className="space-y-4">
          <Bone className="h-6 w-28" />
          <Bone className="h-9 w-80 max-w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
            <Bone className="lg:col-span-7 h-72 rounded-2xl" />
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <Bone className="h-36 rounded-2xl" />
              <Bone className="h-36 rounded-2xl" />
              <Bone className="h-36 rounded-2xl" />
              <Bone className="h-36 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mx-auto max-w-md space-y-3 text-center">
            <Bone className="mx-auto h-4 w-24" />
            <Bone className="mx-auto h-8 w-64 max-w-full" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Bone className="h-40 rounded-2xl" />
            <Bone className="h-40 rounded-2xl" />
            <Bone className="h-40 rounded-2xl hidden lg:block" />
            <Bone className="h-40 rounded-2xl hidden lg:block" />
          </div>
        </div>

        <Bone className="h-48 sm:h-56 w-full rounded-3xl" />
      </div>
    </div>
  );
}
