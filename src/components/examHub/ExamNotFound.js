import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';
import { categoryDisplayName } from '@/lib/examHub/categoryKey';

export default function ExamNotFound({ slug }) {
  const label = categoryDisplayName(slug);

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-5">
          <SearchX className="w-7 h-7 text-neutral-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Exam not found</h1>
        <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
          <span className="font-medium text-neutral-700">{label}</span> isn&apos;t available on
          10Tracker yet, or it may have been deactivated.
        </p>
        <Link
          href="/exams"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
        >
          Browse exam catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
