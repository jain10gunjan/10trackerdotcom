'use client';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

export default function GuestHomeShell() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <Bone className="h-6 w-40" />
          <Bone className="h-10 w-full max-w-lg" />
          <Bone className="h-4 w-full max-w-xl" />
          <div className="flex gap-3 pt-2">
            <Bone className="h-11 w-36" />
            <Bone className="h-11 w-44" />
          </div>
        </div>

        <div>
          <Bone className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Bone key={i} className="h-20" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Bone className="h-64 rounded-3xl" />
          <Bone className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
