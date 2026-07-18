'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

const VARIANT_STYLES = {
  practice: {
    shell: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white',
    label: 'text-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  mock: {
    shell: 'border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white',
    label: 'text-indigo-800',
    button: 'bg-indigo-600 hover:bg-indigo-700',
  },
  default: {
    shell: 'border-neutral-200 bg-gradient-to-br from-neutral-50/80 to-white',
    label: 'text-neutral-700',
    button: 'bg-neutral-900 hover:bg-neutral-800',
  },
};

function ContinueSkeleton({ variant = 'practice' }) {
  const shell = VARIANT_STYLES[variant]?.shell || VARIANT_STYLES.practice.shell;
  return (
    <div className={`rounded-3xl border p-5 animate-pulse ${shell}`} aria-hidden>
      <div className="h-4 w-32 bg-neutral-100 rounded mb-3" />
      <div className="h-6 w-2/3 bg-neutral-100 rounded" />
    </div>
  );
}

export default function ExamHubContinueCard({
  continueItem,
  loading = false,
  show = true,
  variant = 'practice',
  eyebrow = 'Pick up where you left off',
  description,
  ctaLabel = 'Continue',
}) {
  if (!show) return null;
  if (loading) return <ContinueSkeleton variant={variant} />;
  if (!continueItem?.href) return null;

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.practice;
  const subject = continueItem.subject || continueItem.title;
  const topic = continueItem.topic;

  return (
    <section aria-label={eyebrow}>
      <div className={`rounded-3xl border p-5 sm:p-6 shadow-sm ${styles.shell}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${styles.label}`}>
          {eyebrow}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900 truncate">
              {subject}
              {topic ? (
                <span className="text-neutral-500 font-medium"> · {topic}</span>
              ) : null}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {description || continueItem.description || 'Continue your last session.'}
            </p>
          </div>
          <Link
            href={continueItem.href}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shrink-0 ${styles.button}`}
          >
            <Play className="w-4 h-4" />
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
