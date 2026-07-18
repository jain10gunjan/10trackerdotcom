'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, ClipboardCheck, Grid3X3 } from 'lucide-react';
import { buildPathCards } from '@/features/exam-hub/lib/examHubUtils';

const ICONS = {
  practice: BookOpen,
  'mock-tests': ClipboardCheck,
  daily: Calendar,
  'topic-tests': Grid3X3,
};

export default function ExamHubPathCards({ categorySlug, mockTestCount, dailyPracticeCount }) {
  const cards = buildPathCards(categorySlug, { mockTestCount, dailyPracticeCount });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = ICONS[card.id] || BookOpen;
        const className = [
          'group flex flex-col sm:flex-row sm:items-start gap-3 rounded-3xl border p-4 sm:p-5 min-h-[7.5rem] transition-all duration-200',
          card.live
            ? 'bg-white border-neutral-200 hover:border-emerald-200 hover:shadow-md'
            : 'bg-neutral-50/90 border-neutral-200/90',
        ].join(' ');

        const inner = (
          <>
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                card.live
                  ? 'bg-emerald-50 border border-emerald-100 group-hover:bg-emerald-600'
                  : 'bg-neutral-100 border border-neutral-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  card.live ? 'text-emerald-700 group-hover:text-white' : 'text-neutral-400'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-1.5">
                <span className="font-semibold text-neutral-900 text-sm sm:text-[0.9375rem] leading-snug">
                  {card.title}
                </span>
                {card.badge ? (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none whitespace-nowrap ${
                      card.live
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                    }`}
                  >
                    {card.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed flex-1">
                {card.description}
              </p>
              {card.live ? (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity sm:mt-auto sm:pt-2">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </span>
              ) : null}
            </div>
          </>
        );

        if (card.scroll) {
          return (
            <Link
              key={card.id}
              href={card.href}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('practice-content')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
              className={className}
            >
              {inner}
            </Link>
          );
        }

        if (!card.live) {
          return (
            <div key={card.id} className={className} aria-disabled>
              {inner}
            </div>
          );
        }

        return (
          <Link key={card.id} href={card.href} className={className}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
