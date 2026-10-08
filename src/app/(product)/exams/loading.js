function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/80 ${className}`} aria-hidden />;
}

export default function ExamsLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-neutral-50 to-neutral-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Bone className="lg:col-span-7 h-40 rounded-2xl" />
          <Bone className="lg:col-span-5 h-40 rounded-2xl" />
        </div>
        <Bone className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Bone key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
