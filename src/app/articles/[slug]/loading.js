export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20 animate-pulse">
      <div className="border-b border-neutral-200 bg-white h-11" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="rounded-3xl bg-white ring-1 ring-neutral-200 overflow-hidden">
            <div className="aspect-[16/9] bg-neutral-200" />
            <div className="p-6 sm:p-8 space-y-4">
              <div className="h-5 w-24 rounded-full bg-neutral-200" />
              <div className="h-9 w-full max-w-xl rounded-lg bg-neutral-200" />
              <div className="h-4 w-full max-w-lg rounded bg-neutral-100" />
              <div className="h-4 w-48 rounded bg-neutral-100" />
            </div>
            <div className="px-6 sm:px-8 pb-8 space-y-3 max-w-3xl mx-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-neutral-100" />
              ))}
            </div>
          </div>
          <div className="hidden lg:block rounded-2xl bg-white ring-1 ring-neutral-200 h-96" />
        </div>
      </div>
    </div>
  );
}
