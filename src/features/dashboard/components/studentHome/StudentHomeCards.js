'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  Clock,
  Coins,
  Infinity,
  Sparkles,
  Zap,
} from 'lucide-react';
import { STUDENT_BRAND, staggerItem } from '@/features/dashboard/lib/studentHomeBrand';

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

export function PlanStatusCard({ unlimited, subscription, credits, walletReady }) {
  if (!walletReady) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 animate-pulse">
        <div className="h-3 w-16 bg-neutral-200 rounded" />
        <div className="mt-3 h-8 w-28 bg-neutral-100 rounded" />
      </div>
    );
  }

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
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_16px_40px_-28px_rgba(63,94,185,0.35)]">
        <div
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl pointer-events-none opacity-70"
          style={{ backgroundColor: STUDENT_BRAND.soft }}
        />
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: STUDENT_BRAND.blue }}
        >
          Your plan
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: STUDENT_BRAND.blue }}
          >
            <Infinity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold text-neutral-950 truncate">Paid · {planName}</p>
            <p className="text-xs text-neutral-500">
              {expires ? `Unlimited until ${expires}` : 'Unlimited access active'}
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80"
          style={{ color: STUDENT_BRAND.blue }}
        >
          Manage plan
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_16px_40px_-28px_rgba(63,94,185,0.35)]">
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl pointer-events-none opacity-60"
        style={{ backgroundColor: STUDENT_BRAND.soft }}
      />
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: STUDENT_BRAND.blue }}
      >
        Your plan
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#3F5EB9]/20"
          style={{ backgroundColor: STUDENT_BRAND.soft, color: STUDENT_BRAND.blue }}
        >
          <Coins className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-neutral-950">Free</p>
          <p className="text-xs text-neutral-500 tabular-nums">
            {(credits ?? 0).toLocaleString()} credits left
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
        style={{
          backgroundColor: STUDENT_BRAND.blue,
          boxShadow: `0 10px 24px -12px ${STUDENT_BRAND.blue}99`,
        }}
      >
        <Zap className="h-3.5 w-3.5 text-amber-200" />
        Upgrade
      </Link>
    </div>
  );
}

export function CountdownCard({ countdown, examName }) {
  if (!countdown?.visible || countdown.status === 'unset') {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/80 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Days to exam
        </p>
        <p className="mt-2 text-lg font-bold text-neutral-800">
          {countdown?.status === 'unset' ? 'Date coming soon' : 'Not set yet'}
        </p>
        <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
          {countdown?.label ||
            `Your admin can set the official ${examName || 'exam'} date from Platform exams.`}
        </p>
      </div>
    );
  }

  const days = countdown.daysLeft;
  const dateLabel = countdown.label || formatShortDate(countdown.examDate);
  let headline = `${Math.abs(days)}`;
  let sub = days === 1 || days === -1 ? 'day' : 'days';

  if (countdown.status === 'today') {
    headline = '0';
    sub = 'Today is exam day';
  } else if (countdown.status === 'past') {
    sub = `days since${dateLabel ? ` · ${dateLabel}` : ''}`;
  } else {
    sub = `days left${dateLabel ? ` · ${dateLabel}` : ''}`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_16px_40px_-28px_rgba(63,94,185,0.35)]">
      <div
        className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full blur-2xl pointer-events-none opacity-70"
        style={{ backgroundColor: STUDENT_BRAND.soft }}
      />
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: STUDENT_BRAND.blue }}
      >
        Days to {examName || 'exam'}
      </p>
      <div className="mt-1 flex items-end gap-2">
        <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-neutral-950 leading-none">
          {headline}
        </p>
        <Calendar className="mb-1.5 h-5 w-5" style={{ color: STUDENT_BRAND.blue }} />
      </div>
      <p className="mt-2 text-xs text-neutral-600">{sub}</p>
    </div>
  );
}

export function PathwayCard({ href, icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div custom={index} variants={staggerItem}>
      <Link
        href={href}
        className="group relative flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#3F5EB9]/35 hover:shadow-[0_16px_40px_-24px_rgba(63,94,185,0.45)]"
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: STUDENT_BRAND.blue }}
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </span>
          <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#3F5EB9]" />
        </div>
        <h3 className="mt-4 text-base font-bold text-neutral-950">{title}</h3>
        <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed flex-1">{description}</p>
        <span
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: STUDENT_BRAND.blue }}
        >
          Open
        </span>
      </Link>
    </motion.div>
  );
}

export function MotdFeatureCard({ motd }) {
  const mock = motd?.mock;
  if (!mock?.href) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-[1.5rem] border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)]">
      <div
        className="absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl pointer-events-none opacity-70"
        style={{ backgroundColor: STUDENT_BRAND.soft }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[#3F5EB9]/25 px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: `${STUDENT_BRAND.soft}cc`, color: '#1e2f6b' }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: STUDENT_BRAND.blue }} />
            Today{motd.date ? ` · ${motd.date} IST` : ''}
          </span>
          <h3 className="mt-3 text-lg sm:text-xl font-bold text-neutral-950 line-clamp-2">
            {mock.name || 'Mock of the day'}
          </h3>
          {mock.description ? (
            <p className="mt-1.5 text-sm text-neutral-600 line-clamp-2">{mock.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            {mock.totalQuestions != null ? <span>{mock.totalQuestions} questions</span> : null}
            {mock.duration != null ? <span>{mock.duration} min</span> : null}
            {mock.difficulty ? <span className="capitalize">{mock.difficulty}</span> : null}
          </div>
        </div>
        <Link
          href={mock.href}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: STUDENT_BRAND.blue,
            boxShadow: `0 12px 28px -12px ${STUDENT_BRAND.blue}99`,
          }}
        >
          Start mock
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function ComingSoonCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/80 p-6 sm:p-8 text-center">
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#3F5EB9]/15"
        style={{ backgroundColor: STUDENT_BRAND.soft }}
      >
        <Clock className="h-5 w-5" style={{ color: STUDENT_BRAND.blue }} />
      </div>
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-1.5 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        {description || 'Coming soon — stay tuned.'}
      </p>
    </div>
  );
}

export function MockCard({ mock }) {
  return (
    <Link
      href={mock.href}
      className="group flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 transition-all hover:border-[#3F5EB9]/35 hover:shadow-[0_16px_40px_-24px_rgba(63,94,185,0.4)]"
    >
      <p className="text-sm font-semibold text-neutral-950 line-clamp-2 group-hover:text-[#1e2f6b]">
        {mock.name}
      </p>
      {mock.description ? (
        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 flex-1">{mock.description}</p>
      ) : (
        <span className="flex-1" />
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
        {mock.totalQuestions != null ? <span>{mock.totalQuestions} Qs</span> : null}
        {mock.duration != null ? <span>{mock.duration} min</span> : null}
        {mock.difficulty ? <span className="capitalize">{mock.difficulty}</span> : null}
      </div>
      <span
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: STUDENT_BRAND.blue }}
      >
        Start mock
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function UpdateCard({ item }) {
  return (
    <Link
      href={item.href}
      className="group block rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 transition-all hover:border-[#3F5EB9]/35 hover:shadow-[0_16px_40px_-24px_rgba(63,94,185,0.4)]"
    >
      {item.category ? (
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: STUDENT_BRAND.blue }}
        >
          {item.category}
        </p>
      ) : null}
      <p className="mt-1 text-sm font-semibold text-neutral-950 line-clamp-2 group-hover:text-[#1e2f6b]">
        {item.title}
      </p>
      {item.excerpt ? (
        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">{item.excerpt}</p>
      ) : null}
    </Link>
  );
}
