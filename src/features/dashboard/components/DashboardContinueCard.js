'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardList, Flame, Play } from 'lucide-react';
import HomeBone from '@/features/dashboard/components/studentHome/HomeBone';
import {
  STUDENT_BRAND,
  homePrimaryBtn,
  homeQuietBtn,
} from '@/features/dashboard/lib/studentHomeBrand';

function humanize(value) {
  const text = String(value || '').trim();
  if (!text || !text.includes('-')) return text;
  return text
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function pickNext(continueOptions) {
  const practice = continueOptions?.practice;
  const mock = continueOptions?.mock;
  const fallback = continueOptions?.fallback;

  if (mock?.href) {
    return {
      kind: 'mock',
      item: mock,
      title: humanize(mock.subject) || 'Mock in progress',
      detail: humanize(mock.topic) || null,
      description: mock.description || 'Resume the mock you already started.',
      cta: 'Resume mock',
      Icon: ClipboardList,
    };
  }

  if (practice?.href) {
    const hasTopic = Boolean(practice.topic);
    return {
      kind: 'practice',
      item: practice,
      title: humanize(practice.topic || practice.subject) || 'Practice',
      detail: hasTopic ? humanize(practice.subject) : null,
      description: practice.description || 'Continue your last practice session.',
      cta: hasTopic ? 'Continue practice' : 'Start practice',
      Icon: BookOpen,
    };
  }

  if (fallback?.href) {
    return {
      kind: 'start',
      item: fallback,
      title: humanize(fallback.subject) || 'Start practice',
      detail: humanize(fallback.topic) || null,
      description: fallback.description || 'Pick a topic and begin.',
      cta: 'Start practice',
      Icon: Play,
    };
  }

  return null;
}

function linkIcon(label) {
  const key = String(label || '').toLowerCase();
  if (key.startsWith('practice')) return BookOpen;
  if (key.startsWith('daily')) return Flame;
  if (key.includes('mock')) return ClipboardList;
  return BookOpen;
}

function ContinueSkeleton() {
  return (
    <div
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:p-5"
      aria-hidden
    >
      <HomeBone className="h-3 w-16" />
      <HomeBone className="mt-4 h-6 w-2/3 max-w-xs" />
      <HomeBone className="mt-2 h-4 w-full max-w-md" />
      <HomeBone className="mt-4 h-11 w-full rounded-xl sm:w-40" />
    </div>
  );
}

function LinkRow({ links }) {
  return (
    <nav
      aria-label="Practice, daily, and mocks"
      className="grid grid-cols-2 border-t border-black/[0.06] sm:grid-cols-4"
    >
      {links.map((link) => {
        const Icon = linkIcon(link.label);
        return (
          <Link
            key={link.label}
            href={link.href}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 px-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#E8EDF8]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: STUDENT_BRAND.blue }} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardContinueCard({
  continueOptions,
  loading = false,
  primaryExam,
  emptyHref,
  emptyLabel,
  links = [],
  emphasis = 'primary',
}) {
  if (loading) return <ContinueSkeleton />;

  const next = pickNext(continueOptions);
  const buttonClass = emphasis === 'quiet' ? homeQuietBtn : homePrimaryBtn;
  const visibleLinks = (links || []).filter((link) => link?.href && link?.label);

  const shell =
    'relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]';

  if (!next) {
    const label =
      emptyLabel ||
      (primaryExam?.name ? `Start ${primaryExam.name} practice` : 'Browse exams');

    return (
      <section className={shell} aria-label="Get started">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${STUDENT_BRAND.blue}, ${STUDENT_BRAND.blueBright})`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl opacity-70"
          style={{ backgroundColor: STUDENT_BRAND.soft }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: STUDENT_BRAND.soft, color: STUDENT_BRAND.blue }}
            >
              <Play className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: STUDENT_BRAND.blue }}
              >
                Start here
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
                Start a topic
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Open practice for this exam — your first clears show up on the heatmap.
              </p>
            </div>
          </div>
          <Link href={emptyHref || '/exams'} className={`${buttonClass} w-full shrink-0 sm:w-auto`}>
            {label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {visibleLinks.length ? <LinkRow links={visibleLinks} /> : null}
      </section>
    );
  }

  const Icon = next.Icon || Play;

  return (
    <section className={shell} aria-label="Next action">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${STUDENT_BRAND.blue}, ${STUDENT_BRAND.blueBright})`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl opacity-70"
        style={{ backgroundColor: STUDENT_BRAND.soft }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: STUDENT_BRAND.blue }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: STUDENT_BRAND.blue }}
            >
              Continue
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
              {next.title}
            </h2>
            {next.detail ? (
              <p className="mt-0.5 text-sm text-neutral-500">{next.detail}</p>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-600">{next.description}</p>
            )}
          </div>
        </div>
        <Link href={next.item.href} className={`${buttonClass} w-full shrink-0 sm:w-auto`}>
          {next.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {visibleLinks.length ? <LinkRow links={visibleLinks} /> : null}
    </section>
  );
}
