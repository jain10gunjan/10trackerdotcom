function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

export default function CategoryHubLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          <Bone className="lg:col-span-7 h-72 rounded-3xl" />
          <Bone className="lg:col-span-5 h-72 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Bone className="h-14 rounded-2xl max-w-3xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Bone key={i} className="h-20 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
