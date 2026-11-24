'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Coins, Infinity } from 'lucide-react';
import {
  STUDENT_BRAND,
  homeCard,
  homeFeaturedCard,
  homeEyebrow,
  homePrimaryBtn,
} from '@/features/dashboard/lib/studentHomeBrand';

export function formatShortDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = String(isoDate).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SoftFill({ className = '' }) {
  return (
    <div className={`${homeCard} p-5 ${className}`} aria-hidden>
      <div className="h-3 w-16 rounded-md bg-[#E8EDF8]" />
      <div className="mt-4 h-8 w-28 rounded-md bg-[#E8EDF8]" />
    </div>
  );
}

export function PlanStatusCard({ unlimited, subscription, credits, walletReady }) {
  if (!walletReady) return <SoftFill />;

  if (unlimited) {
    const expires = subscription?.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;
    const planName = subscription?.planName || 'Unlimited';

    return (
      <div className={`${homeCard} flex h-full flex-col p-4 sm:p-5`}>
        <p className={homeEyebrow}>Credits</p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: STUDENT_BRAND.blue }}
          >
            <Infinity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[#0a0a0a]">Unlimited</p>
            <p className="truncate text-sm text-neutral-600">{planName}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          {expires ? `Until ${expires}` : 'Unlimited access is on'}
        </p>
        <Link
          href="/pricing"
          className="mt-auto inline-flex min-h-11 items-center gap-1.5 pt-4 text-sm font-semibold text-[#3F5EB9]"
        >
          Manage plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`${homeCard} flex h-full flex-col p-4 sm:p-5`}>
      <p className={homeEyebrow}>Credits</p>
      <div className="mt-3 flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: STUDENT_BRAND.soft, color: STUDENT_BRAND.blue }}
        >
          <Coins className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold tabular-nums text-[#0a0a0a]">
            {(credits ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-neutral-600">credits left · Free</p>
        </div>
      </div>
      <Link href="/pricing" className={`${homePrimaryBtn} mt-auto w-full pt-4 sm:w-auto`}>
        Upgrade
      </Link>
    </div>
  );
}

export function CountdownCard({ countdown, examName }) {
  const name = examName || 'exam';

  if (!countdown?.visible || countdown.status === 'unset') {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-dashed border-black/[0.12] bg-[#E8EDF8]/40 p-4 sm:p-5">
        <p className={homeEyebrow}>Exam date</p>
        <p className="mt-3 text-lg font-semibold text-[#0a0a0a]">Date not set</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">
          {countdown?.label || `The official ${name} date will show here once it is set.`}
        </p>
      </div>
    );
  }

  const days = countdown.daysLeft;
  const dateLabel = countdown.label || formatShortDate(countdown.examDate);
  let headline = `${Math.abs(days)}`;
  let sub = days === 1 || days === -1 ? 'day' : 'days';

  if (countdown.status === 'today') {
    headline = 'Today';
    sub = dateLabel ? `Exam day · ${dateLabel}` : 'Exam day';
  } else if (countdown.status === 'past') {
    const unit = Math.abs(days) === 1 ? 'day' : 'days';
    sub = `${unit} since${dateLabel ? ` · ${dateLabel}` : ''}`;
  } else {
    const unit = Math.abs(days) === 1 ? 'day' : 'days';
    sub = `${unit} left${dateLabel ? ` · ${dateLabel}` : ''}`;
  }

  return (
    <div className={`${homeCard} flex h-full flex-col p-4 sm:p-5`}>
      <p className={homeEyebrow}>Exam date</p>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-4xl font-semibold tabular-nums leading-none tracking-tight text-[#0a0a0a] sm:text-5xl">
          {headline}
        </p>
        {countdown.status !== 'today' ? (
          <Calendar className="mb-1 h-5 w-5" style={{ color: STUDENT_BRAND.blue }} />
        ) : null}
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        {name}
        {sub ? ` · ${sub}` : ''}
      </p>
    </div>
  );
}

export function PathwayCard({ href, icon: Icon, title, description, index = 0 }) {
  return (
    <div className="h-full">
      <Link
        href={href}
        className={`${homeCard} group flex h-full min-h-11 flex-col p-4 transition-colors hover:bg-[#E8EDF8]/60 sm:p-5`}
      >
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: STUDENT_BRAND.blue }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-[#0a0a0a]">{title}</h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-neutral-600">{description}</p>
        <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#3F5EB9]">
          Open
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}

export function MotdFeatureCard({ motd }) {
  const mock = motd?.mock;
  if (!mock?.href) return null;
  const blurb =
    mock.description && mock.description.trim() !== String(mock.name || '').trim()
      ? mock.description
      : null;

  return (
    <div className={`${homeFeaturedCard} p-4 sm:p-5`}>
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${STUDENT_BRAND.blue}, ${STUDENT_BRAND.blueBright})`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: STUDENT_BRAND.soft }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={homeEyebrow}>
            Daily{motd.date ? ` · ${motd.date} IST` : ''}
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-[#0a0a0a] sm:text-xl">
            {mock.name || 'Mock of the day'}
          </h3>
          {blurb ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-600">
              {blurb}
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">
              Rotating daily mock — one timed attempt to stay sharp.
            </p>
          )}
          <MockMeta mock={mock} />
        </div>
        <Link href={mock.href} className={`${homePrimaryBtn} w-full shrink-0 sm:w-auto`}>
          Start mock
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function ComingSoonCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.12] bg-[#E8EDF8]/40 px-4 py-6 text-center sm:px-6">
      <span
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: STUDENT_BRAND.soft, color: STUDENT_BRAND.blue }}
      >
        <Clock className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-[#0a0a0a]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-neutral-600">
        {description || 'Coming soon.'}
      </p>
    </div>
  );
}

function MockMeta({ mock }) {
  const bits = [
    mock.totalQuestions != null ? `${mock.totalQuestions} questions` : null,
    mock.duration != null ? `${mock.duration} min` : null,
  ].filter(Boolean);

  if (!bits.length && !mock.difficulty) return null;

  return (
    <p className="mt-2 text-xs text-neutral-500">
      {bits.join(' · ')}
      {mock.difficulty ? (
        <span className="capitalize">
          {bits.length ? ' · ' : ''}
          {mock.difficulty}
        </span>
      ) : null}
    </p>
  );
}

export function MockCard({ mock }) {
  const blurb =
    mock.description && mock.description.trim() !== String(mock.name || '').trim()
      ? mock.description
      : null;

  return (
    <Link
      href={mock.href}
      className={`${homeCard} group flex h-full min-h-11 flex-col p-4 transition-all duration-200 hover:border-[#3F5EB9]/35 hover:bg-[#E8EDF8]/50 hover:shadow-md`}
    >
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#0a0a0a]">
        {mock.name}
      </p>
      {blurb ? (
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-600">
          {blurb}
        </p>
      ) : (
        <span className="flex-1" />
      )}
      <MockMeta mock={mock} />
      <span className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#3F5EB9]">
        Start mock
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function UpdateCard({ item }) {
  return (
    <Link
      href={item.href}
      className={`${homeCard} group flex h-full min-h-11 flex-col p-4 transition-colors hover:bg-[#E8EDF8]/60`}
    >
      {item.category ? (
        <p className={homeEyebrow}>
          {String(item.category)
            .split('-')
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </p>
      ) : null}
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-[#0a0a0a]">
        {item.title}
      </p>
      {item.excerpt ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-600">
          {item.excerpt}
        </p>
      ) : null}
    </Link>
  );
}
