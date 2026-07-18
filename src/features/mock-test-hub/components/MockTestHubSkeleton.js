export default function MockTestHubSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="h-36 bg-white border border-neutral-200 rounded-3xl animate-pulse mb-6" />
        <div className="h-12 bg-white border border-neutral-200 rounded-2xl animate-pulse mb-6" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 bg-white border border-neutral-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
