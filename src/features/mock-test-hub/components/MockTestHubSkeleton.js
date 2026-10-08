export default function MockTestHubSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-neutral-50 to-neutral-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-40 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="h-44 bg-white border border-neutral-200 rounded-[1.75rem] animate-pulse mb-6" />
        <div className="h-12 bg-white border border-neutral-200 rounded-2xl animate-pulse mb-8" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 bg-white border border-neutral-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
