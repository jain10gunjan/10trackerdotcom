'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { homeCard, homeEyebrow, homePrimaryBtn } from '@/features/dashboard/lib/studentHomeBrand';

const STEPS = [
  { n: '1', label: 'Your details' },
  { n: '2', label: 'Your exams' },
  { n: '3', label: 'Start practice' },
];

export default function DashboardSetupBanner() {
  return (
    <section className={`${homeCard} p-4 sm:p-5`}>
      <p className={homeEyebrow}>Profile</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#0a0a0a]">
        Finish setup to open your exam home
      </h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-600">
        Add your details and the exams you are studying. Streaks, mocks, and topics follow that choice.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#E8EDF8] px-3 text-sm font-medium text-[#0a0a0a]"
          >
            <span className="text-xs font-semibold text-[#3F5EB9]">{step.n}</span>
            {step.label}
          </li>
        ))}
      </ol>
      <Link href="/profile?redirect=%2F" className={`${homePrimaryBtn} mt-4 w-full sm:w-auto`}>
        Set up profile
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
