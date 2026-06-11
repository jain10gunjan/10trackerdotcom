function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/90 ${className}`} aria-hidden />;
}

export default function DailyPracticeLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <Bone className="h-32 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Bone className="md:col-span-2 h-40 rounded-3xl" />
          <Bone className="h-40 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
