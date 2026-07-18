'use client';

import { BookOpen, BarChart3, Trophy } from 'lucide-react';

const ITEMS = [
  { icon: BookOpen, label: 'Topic-wise MCQs', desc: 'Practice by subject & chapter' },
  { icon: Trophy, label: 'Mock tests', desc: 'Timed tests with ranks' },
  { icon: BarChart3, label: 'Progress tracking', desc: 'Scores & analytics saved' },
];

export default function AuthBenefitStrip({ compact = false }) {
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <span className="text-xs font-semibold text-neutral-800 whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      {ITEMS.map(({ icon: Icon, label, desc }) => (
        <div
          key={label}
          className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-2xl border border-neutral-200 bg-white shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">{label}</p>
            <p className="text-xs text-neutral-500 hidden sm:block">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
