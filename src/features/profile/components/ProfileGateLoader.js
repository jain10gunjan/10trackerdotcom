'use client';

export default function ProfileGateLoader() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-48 bg-neutral-200 rounded-lg animate-pulse mb-3" />
        <div className="h-4 w-72 max-w-full bg-neutral-100 rounded animate-pulse mb-8" />
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm px-6 sm:px-8 py-8 space-y-6 animate-pulse">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 bg-neutral-100 rounded" />
              <div className="h-9 w-full max-w-sm bg-neutral-100 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 bg-neutral-100 rounded-lg" />
            <div className="h-10 bg-neutral-100 rounded-lg" />
            <div className="h-10 bg-neutral-100 rounded-lg sm:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
