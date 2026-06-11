function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/80 ${className}`} aria-hidden />;
}

export default function RoadmapViewerSkeleton({ title = null }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-neutral-200/80 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <Bone className="h-4 w-24 mb-4" />
          <div className="flex items-center gap-4">
            <Bone className="w-16 h-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              {title ? (
                <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">
                  {title}
                </h1>
              ) : (
                <Bone className="h-6 w-3/4 max-w-sm" />
              )}
              <Bone className="h-4 w-40" />
            </div>
          </div>
          <Bone className="h-20 w-full mt-5 rounded-2xl" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        <Bone className="h-11 w-full rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
