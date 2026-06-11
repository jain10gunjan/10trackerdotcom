function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

export default function RoadmapsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Bone className="h-48 rounded-3xl" />
            <Bone className="h-20 rounded-2xl" />
          </div>
          <Bone className="lg:col-span-5 h-64 rounded-3xl" />
        </div>
        <Bone className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Bone key={i} className="h-52 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
