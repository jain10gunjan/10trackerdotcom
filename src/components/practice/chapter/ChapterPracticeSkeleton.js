'use client';

export function QuestionCardSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-4 animate-pulse">
      <div className="h-5 bg-neutral-100 rounded-lg w-2/3" />
      <div className="h-4 bg-neutral-100 rounded-lg w-full" />
      <div className="h-4 bg-neutral-100 rounded-lg w-4/5" />
      <div className="pt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-neutral-50 border border-neutral-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function ChapterPracticeSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-32 bg-white border border-neutral-200 rounded-3xl animate-pulse mb-6" />
        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          <div className="hidden lg:block space-y-4">
            <div className="h-40 bg-white border border-neutral-200 rounded-3xl animate-pulse" />
            <div className="h-56 bg-white border border-neutral-200 rounded-3xl animate-pulse" />
          </div>
          <div className="min-h-[420px] bg-white border border-neutral-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
