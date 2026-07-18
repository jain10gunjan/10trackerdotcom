'use client';

import Link from 'next/link';
import { ArrowRight, UserCircle2 } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Add your details' },
  { n: 2, label: 'Select your exam(s)' },
  { n: 3, label: 'Start practicing' },
];

export default function DashboardSetupBanner() {
  return (
    <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
          <UserCircle2 className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
            Complete your profile to unlock your full dashboard
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Tell us which exams you are preparing for so we can personalize practice,
            streaks, and leaderboard rankings.
          </p>
          <ol className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                  {step.n}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
        </div>
        <Link
          href="/profile?redirect=%2F"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0 shadow-sm"
        >
          Set up profile
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
