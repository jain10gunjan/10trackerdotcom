'use client';

import Link from 'next/link';
import { ChevronLeft, Building2 } from 'lucide-react';

/**
 * Page header aligned with MockTestSubpageHeader — institute teal accent.
 */
export default function VendorPageHeader({
  backHref,
  backLabel = 'Back',
  eyebrow = 'Institute portal',
  title,
  description,
  actions = null,
}) {
  return (
    <header className="mb-5 sm:mb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      ) : null}
      {title ? (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),transparent_45%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                <Building2 className="h-3 w-3 text-teal-600" />
                {eyebrow}
              </span>
              <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-sm leading-snug text-neutral-500">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function VendorPrimaryButton({
  as: Comp = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function VendorSecondaryButton({
  as: Comp = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function VendorCard({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function VendorStatTile({ label, value, hint, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-900',
    teal: 'bg-teal-50 border-teal-100 text-teal-900',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose: 'bg-rose-50 border-rose-100 text-rose-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
  };
  const labelTone = {
    neutral: 'text-neutral-600',
    teal: 'text-teal-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    amber: 'text-amber-700',
  };
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${tones[tone] || tones.neutral}`}>
      <p className={`text-xs font-medium ${labelTone[tone] || labelTone.neutral}`}>{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-neutral-500">{hint}</p> : null}
    </div>
  );
}
