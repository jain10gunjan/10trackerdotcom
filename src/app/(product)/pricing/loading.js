function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Bone className="h-48 rounded-3xl" />
        <Bone className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Bone key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
