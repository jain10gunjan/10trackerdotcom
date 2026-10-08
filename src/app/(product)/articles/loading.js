export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8 lg:p-10 space-y-4">
            <div className="h-6 w-40 rounded-full bg-emerald-100" />
            <div className="h-10 w-3/4 max-w-xl rounded-lg bg-neutral-200" />
            <div className="h-4 w-full max-w-lg rounded bg-neutral-100" />
            <div className="h-12 w-full max-w-2xl rounded-xl bg-neutral-100 mt-4" />
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 shrink-0 rounded-xl bg-neutral-200" />
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 aspect-[16/10] lg:min-h-[280px] bg-neutral-200" />
            <div className="lg:col-span-7 p-8 space-y-4">
              <div className="h-3 w-32 rounded bg-neutral-100" />
              <div className="h-8 w-4/5 rounded bg-neutral-200" />
              <div className="h-4 w-full rounded bg-neutral-100" />
              <div className="h-4 w-2/3 rounded bg-neutral-100" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200 bg-white overflow-hidden"
            >
              <div className="aspect-[16/10] bg-neutral-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-28 rounded bg-neutral-100" />
                <div className="h-5 w-full rounded bg-neutral-200" />
                <div className="h-4 w-3/4 rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
