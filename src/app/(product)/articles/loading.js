export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20 animate-pulse">
      <div className="border-b border-neutral-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-3 w-20 rounded bg-neutral-200" />
          <div className="h-10 w-48 rounded-lg bg-neutral-200" />
          <div className="h-4 w-full max-w-lg rounded bg-neutral-100" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-12 rounded-2xl bg-white ring-1 ring-neutral-200" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-neutral-200 shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white ring-1 ring-neutral-200 overflow-hidden">
              <div className="aspect-[16/10] bg-neutral-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-28 rounded bg-neutral-100" />
                <div className="h-5 w-full rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
