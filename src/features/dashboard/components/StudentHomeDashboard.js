'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  Coins,
  Eye,
  Infinity,
  Layers,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { useCredits } from '@/context/CreditsContext';
import { useHomeDashboard } from '@/features/dashboard/hooks/useHomeDashboard';
import toast from 'react-hot-toast';
import DashboardContinueCard from '@/features/dashboard/components/DashboardContinueCard';
import DashboardSetupBanner from '@/features/dashboard/components/DashboardSetupBanner';
import DashboardSubjectPractice from '@/features/dashboard/components/DashboardSubjectPractice';
import DashboardMyRoadmaps from '@/features/dashboard/components/DashboardMyRoadmaps';
import DashboardAlerts from '@/features/dashboard/components/DashboardAlerts';
import {
  practiceHrefForSlug,
  mockTestHrefForSlug,
  formatExamSlug,
} from '@/lib/platformExams';
import { profileNeedsExamRefresh } from '@/lib/examProfile';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';

const FOCUS_STORAGE_KEY = 'tt_home_focus_exam';

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatShortDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = String(isoDate).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ExamSwitcher({ exams, activeSlug, onChange, disabled }) {
  if (!exams?.length) return null;

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-neutral-200/80 bg-white/90 p-1 shadow-sm backdrop-blur"
      role="tablist"
      aria-label="Focus exam"
    >
      {exams.map((exam) => {
        const active = exam.slug === activeSlug;
        return (
          <button
            key={exam.slug}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled || active}
            onClick={() => onChange(exam.slug)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              active
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50'
            }`}
          >
            {exam.name || formatExamSlug(exam.slug)}
          </button>
        );
      })}
    </div>
  );
}

function PlanStatusCard({ unlimited, subscription, credits, walletReady }) {
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
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
          Your plan
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Infinity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold text-neutral-900 truncate">Paid · {planName}</p>
            {expires ? (
              <p className="text-xs text-neutral-500">Unlimited until {expires}</p>
            ) : (
              <p className="text-xs text-neutral-500">Unlimited access active</p>
            )}
          </div>
        </div>
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
        >
          Manage plan
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/35 blur-2xl pointer-events-none" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
        Your plan
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Coins className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-neutral-900">Free</p>
          <p className="text-xs text-neutral-500 tabular-nums">
            {(credits ?? 0).toLocaleString()} credits left
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
      >
        <Zap className="h-3.5 w-3.5 text-amber-300" />
        Upgrade
      </Link>
    </div>
  );
}

function CountdownCard({ countdown, examName }) {
  if (!countdown?.visible) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Days to exam
        </p>
        <p className="mt-2 text-lg font-bold text-neutral-800">Not set yet</p>
        <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
          Your admin can set the official {examName || 'exam'} date from Platform exams.
        </p>
      </div>
    );
  }

  if (countdown.status === 'unset') {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Days to exam
        </p>
        <p className="mt-2 text-lg font-bold text-neutral-800">Date coming soon</p>
        <p className="mt-1 text-xs text-neutral-500">
          {countdown.label || `We’ll show a countdown once ${examName || 'your exam'} is scheduled.`}
        </p>
      </div>
    );
  }

  const days = countdown.daysLeft;
  const dateLabel = countdown.label || formatShortDate(countdown.examDate);
  let headline = `${Math.abs(days)}`;
  let sub =
    days === 1 || days === -1
      ? 'day'
      : 'days';

  if (countdown.status === 'today') {
    headline = '0';
    sub = 'Today is exam day';
  } else if (countdown.status === 'past') {
    sub = `days since${dateLabel ? ` · ${dateLabel}` : ''}`;
  } else {
    sub = `days left${dateLabel ? ` · ${dateLabel}` : ''}`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-5 shadow-sm">
      <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-violet-200/35 blur-2xl pointer-events-none" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700">
        Days to {examName || 'exam'}
      </p>
      <div className="mt-1 flex items-end gap-2">
        <p className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-neutral-900 leading-none">
          {headline}
        </p>
        <Calendar className="mb-1.5 h-5 w-5 text-violet-500" />
      </div>
      <p className="mt-2 text-xs text-neutral-600">{sub}</p>
    </div>
  );
}

function NumberedPathway({ number, href, icon: Icon, title, description, accent }) {
  const accents = {
    emerald: {
      num: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      hover: 'hover:border-emerald-300 hover:shadow-emerald-100/50',
      icon: 'text-emerald-700',
    },
    violet: {
      num: 'text-violet-700 bg-violet-50 border-violet-100',
      hover: 'hover:border-violet-300 hover:shadow-violet-100/50',
      icon: 'text-violet-700',
    },
    amber: {
      num: 'text-amber-800 bg-amber-50 border-amber-100',
      hover: 'hover:border-amber-300 hover:shadow-amber-100/50',
      icon: 'text-amber-800',
    },
  };
  const style = accents[accent] || accents.emerald;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${style.hover}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold tabular-nums ${style.num}`}
        >
          {number}
        </span>
        <Icon className={`h-5 w-5 ${style.icon}`} />
      </div>
      <h3 className="mt-4 text-base font-bold text-neutral-900">{title}</h3>
      <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed flex-1">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
        Open
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SectionShell({ number, eyebrow, title, description, href, linkLabel, children }) {
  return (
    <section className="scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-5">
        <div className="min-w-0 flex gap-3">
          {number ? (
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold tabular-nums text-emerald-800">
              {number}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-sm text-neutral-600 max-w-xl">{description}</p>
            ) : null}
          </div>
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            {linkLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MotdFeatureCard({ motd }) {
  const mock = motd?.mock;
  if (!mock?.href) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-5 sm:p-6 shadow-sm">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-200/40 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
              <Sparkles className="h-3.5 w-3.5" />
              Today{motd.date ? ` · ${motd.date} IST` : ''}
            </span>
          </div>
          <h3 className="mt-3 text-lg sm:text-xl font-bold text-neutral-900 line-clamp-2">
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
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800 transition-colors shadow-sm"
        >
          Start mock
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ComingSoonCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/80 p-6 sm:p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100">
        <Clock className="h-5 w-5 text-neutral-500" />
      </div>
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1.5 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        {description || 'Coming soon — stay tuned.'}
      </p>
    </div>
  );
}

function MockCard({ mock }) {
  return (
    <Link
      href={mock.href}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 transition-all hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/40"
    >
      <p className="text-sm font-semibold text-neutral-900 line-clamp-2 group-hover:text-violet-900">
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
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-800">
        Start mock
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function UpdateCard({ item }) {
  return (
    <Link
      href={item.href}
      className="group block rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 transition-all hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/40"
    >
      {item.category ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
          {item.category}
        </p>
      ) : null}
      <p className="mt-1 text-sm font-semibold text-neutral-900 line-clamp-2 group-hover:text-emerald-900">
        {item.title}
      </p>
      {item.excerpt ? (
        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">{item.excerpt}</p>
      ) : null}
      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-neutral-500">
        <Eye className="h-3 w-3" />
        {Number(item.viewCount || 0).toLocaleString()}{' '}
        {Number(item.viewCount || 0) === 1 ? 'view' : 'views'}
      </p>
    </Link>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-3 backdrop-blur">
      <p className="text-lg sm:text-xl font-bold tabular-nums text-neutral-900">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm animate-pulse">
      <div className="p-6 sm:p-8 lg:p-10 space-y-4">
        <div className="h-6 w-40 bg-neutral-200 rounded-full" />
        <div className="h-9 w-72 max-w-full bg-neutral-200 rounded" />
        <div className="h-4 w-96 max-w-full bg-neutral-200 rounded" />
        <div className="h-28 w-full bg-neutral-100 rounded-2xl mt-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-neutral-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentHomeDashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const subscribed = searchParams.get('subscribed') === '1';
  const examFromUrl = String(searchParams.get('exam') || '').trim().toLowerCase();
  const { user } = useAuth();
  const { profile: gateProfile, needsProfileCompletion } = useProfileGate();
  const {
    credits,
    unlimited,
    subscription,
    walletError,
    walletReady,
  } = useCredits();

  const [focusExam, setFocusExam] = useState(examFromUrl);

  useEffect(() => {
    if (examFromUrl) {
      setFocusExam(examFromUrl);
      try {
        localStorage.setItem(FOCUS_STORAGE_KEY, examFromUrl);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const saved = String(localStorage.getItem(FOCUS_STORAGE_KEY) || '')
        .trim()
        .toLowerCase();
      if (saved) setFocusExam(saved);
    } catch {
      /* ignore */
    }
  }, [examFromUrl]);

  const {
    dashboard,
    initialLoading,
    switchingExam,
    error,
    partialError,
    reload,
  } = useHomeDashboard({ enabled: Boolean(user), focusExam });

  const profile = dashboard?.profile;
  const primaryExam = dashboard?.primaryExam;
  const focusedExam = dashboard?.focusedExam || primaryExam;
  // Only exams the user selected (API already intersects with active catalog).
  const examsPreparing = useMemo(() => {
    const list = dashboard?.examsPreparing ?? [];
    const selected = new Set(
      Array.isArray(profile?.target_exams)
        ? profile.target_exams.map((s) => String(s).trim().toLowerCase())
        : []
    );
    if (!selected.size) return list;
    return list.filter((e) => selected.has(String(e.slug || '').toLowerCase()));
  }, [dashboard?.examsPreparing, profile?.target_exams]);
  const examFeed = dashboard?.examFeed;
  const streak = dashboard?.streak ?? {};
  const practiceAreas = dashboard?.practice ?? [];
  const limitedMode = needsProfileCompletion;

  useEffect(() => {
    const resolved = focusedExam?.slug;
    if (!resolved || initialLoading) return;
    if (resolved === focusExam) return;
    const allowed = new Set(examsPreparing.map((e) => e.slug));
    if (focusExam && allowed.has(focusExam)) return;
    setFocusExam(resolved);
  }, [focusedExam?.slug, examsPreparing, focusExam, initialLoading]);

  const handleExamChange = useCallback(
    (slug) => {
      const next = String(slug || '').trim().toLowerCase();
      if (!next || next === focusExam) return;
      // Optimistic toast while URL/state update triggers the dashboard refetch.
      toast.loading(`Switching to ${formatExamSlug(next)}…`, {
        id: 'home-dashboard-load',
      });
      setFocusExam(next);
      try {
        localStorage.setItem(FOCUS_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set('exam', next);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [focusExam, pathname, router, searchParams]
  );

  const displayName =
    profile?.displayName ||
    gateProfile?.display_name ||
    user?.name ||
    user?.fullName ||
    user?.email?.split('@')[0] ||
    'Student';

  const firstName = String(displayName || 'there').split(/\s+/)[0];

  const needsExamUpdate = useMemo(
    () =>
      !initialLoading &&
      !limitedMode &&
      profileNeedsExamRefresh(gateProfile, examsPreparing.map((e) => e.slug)),
    [gateProfile, examsPreparing, initialLoading, limitedMode]
  );

  const examSlug = focusedExam?.slug || examFeed?.exam?.slug;
  const examName =
    focusedExam?.name ||
    examFeed?.exam?.name ||
    (examSlug ? formatExamSlug(examSlug) : null);
  const practiceHref =
    examFeed?.links?.practiceHref ||
    (examSlug ? practiceHrefForSlug(examSlug) : '/exams');
  const mockHref =
    examFeed?.links?.mockHref || (examSlug ? mockTestHrefForSlug(examSlug) : '/exams');
  const topicMocksHref = examSlug
    ? `${mockTestHrefForSlug(examSlug)}?type=topic`
    : mockHref;
  const articlesHref = examName
    ? `/articles?q=${encodeURIComponent(examName)}`
    : '/articles';
  const topicMockCount = (examFeed?.topicMocks ?? []).length;

  const continueOptions = dashboard?.continueOptions;
  const hasContinue =
    Boolean(continueOptions?.practice?.href) ||
    Boolean(continueOptions?.mock?.href) ||
    Boolean(continueOptions?.fallback?.href);

  const showFullDashboard = !error || partialError;
  const showExamSwitcher = !limitedMode && examsPreparing.length > 1;
  const fullMocks = examFeed?.fullMocks ?? [];
  const topicMocks = examFeed?.topicMocks ?? [];
  const updates = examFeed?.updates ?? [];
  const mockOfTheDay = examFeed?.mockOfTheDay;
  const countdown = examFeed?.countdown;
  const catalogStats = examFeed?.catalogStats ?? {};
  const bankQuestions = catalogStats.questionCount ?? 0;
  const publishedMocks = catalogStats.mockCount ?? 0;
  const syllabusTopics =
    (catalogStats.topicCount ?? 0) || (catalogStats.chapterCount ?? 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-neutral-50 to-neutral-100 text-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14 sm:pb-20">
        {error && !dashboard ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-900">Could not load your home</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        ) : null}

        {showFullDashboard ? (
          <div className="space-y-8 sm:space-y-10">
            {limitedMode ? <DashboardSetupBanner /> : null}

            <DashboardAlerts
              subscribed={subscribed}
              walletError={walletError}
              partialError={partialError}
              partialErrors={dashboard?.partialErrors ?? []}
              needsExamUpdate={needsExamUpdate}
              onRetry={reload}
            />

            {/* Top controls: switcher */}
            {showExamSwitcher ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Focus exam
                  </p>
                  <p className="text-sm text-neutral-600 mt-0.5">
                    Switch to personalize mocks, updates, and countdown.
                  </p>
                </div>
                <ExamSwitcher
                  exams={examsPreparing}
                  activeSlug={examSlug}
                  onChange={handleExamChange}
                  disabled={switchingExam}
                />
              </div>
            ) : null}

            {/* Hero */}
            {initialLoading ? (
              <HeroSkeleton />
            ) : (
              <section
                className={`relative overflow-hidden rounded-[1.75rem] border border-neutral-200/90 bg-white/95 shadow-[0_20px_50px_-28px_rgba(16,24,40,0.28)] ${
                  switchingExam ? 'opacity-70 transition-opacity' : ''
                }`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),transparent_42%,rgba(139,92,246,0.06))] pointer-events-none" />
                <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl pointer-events-none" />

                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-800">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      {examName ? `Preparing for ${examName}` : '10Tracker · Your study home'}
                    </span>
                  </div>

                  <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-neutral-900 leading-[1.1] max-w-3xl">
                    {greetingForHour()}, {firstName}
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
                    {hasContinue
                      ? 'One clear next step — continue practice or a mock, then explore what’s new for your exam.'
                      : examName
                        ? `Your ${examName} home: practice, mocks, updates, and a countdown to exam day.`
                        : 'Choose an exam to practice. Your personalized home will build around it.'}
                  </p>

                  {/* 01 Continue */}
                  <div className="mt-7 sm:mt-8">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[11px] font-bold text-emerald-800">
                        01
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        Continue
                      </p>
                    </div>
                    <DashboardContinueCard
                      continueOptions={continueOptions}
                      loading={false}
                      primaryExam={focusedExam || primaryExam}
                      emptyHref={practiceHref}
                      emptyLabel={examName ? `Start ${examName} practice` : 'Browse exams'}
                    />
                  </div>

                  {!limitedMode ? (
                    <div className="mt-7 sm:mt-8">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-700">
                          02
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                          Start a session
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <NumberedPathway
                          number="A"
                          href={practiceHref}
                          icon={BookOpen}
                          title="Practice"
                          description={
                            examName
                              ? `Chapter-wise MCQs for ${examName}.`
                              : 'Topic-wise MCQs across your exams.'
                          }
                          accent="emerald"
                        />
                        <NumberedPathway
                          number="B"
                          href={mockHref}
                          icon={ClipboardList}
                          title="Mock tests"
                          description={
                            examName
                              ? `Timed mocks for ${examName}.`
                              : 'Full-length timed tests when you are ready.'
                          }
                          accent="violet"
                        />
                        <NumberedPathway
                          number="C"
                          href={topicMocksHref}
                          icon={Layers}
                          title="Topic mocks"
                          description={
                            topicMockCount > 0
                              ? `${topicMockCount} topic-wise mock${topicMockCount === 1 ? '' : 's'} ready to attempt.`
                              : examName
                                ? `Shorter topic-scoped mocks for ${examName}.`
                                : 'Shorter mocks scoped to a chapter or topic.'
                          }
                          accent="amber"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <Link
                        href="/exams"
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        Browse exams
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 03 Plan + countdown */}
            {!limitedMode && !initialLoading ? (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[11px] font-bold text-emerald-800">
                    03
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Plan & exam clock
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <PlanStatusCard
                    unlimited={unlimited}
                    subscription={subscription}
                    credits={credits}
                    walletReady={walletReady || Boolean(dashboard?.wallet)}
                  />
                  <CountdownCard countdown={countdown} examName={examName} />
                </div>
              </section>
            ) : null}

            {/* Compact progress strip */}
            {!limitedMode ? (
              <section>
                {initialLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 rounded-2xl border border-neutral-200 bg-white" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatChip
                      label="Day streak"
                      value={(streak.currentStreak ?? 0).toLocaleString()}
                    />
                    <StatChip
                      label="Questions"
                      value={bankQuestions.toLocaleString()}
                    />
                    <StatChip
                      label="Mocks"
                      value={publishedMocks.toLocaleString()}
                    />
                    <StatChip
                      label="Topics"
                      value={syllabusTopics.toLocaleString()}
                    />
                  </div>
                )}
              </section>
            ) : null}

            {!limitedMode && !initialLoading ? (
              <div className="space-y-9 sm:space-y-11">
                <SectionShell
                  number="04"
                  eyebrow="Today"
                  title="Mock of the day"
                  description={
                    examName
                      ? `A curated daily mock for ${examName}.`
                      : 'A curated daily mock for your exam.'
                  }
                >
                  {mockOfTheDay?.status === 'ready' && mockOfTheDay?.mock?.href ? (
                    <MotdFeatureCard motd={mockOfTheDay} />
                  ) : (
                    <ComingSoonCard
                      title={mockOfTheDay?.title || 'Mock of the day'}
                      description={
                        mockOfTheDay?.description ||
                        'Coming soon — stay tuned. We’ll add a fresh daily mock here later.'
                      }
                    />
                  )}
                </SectionShell>

                <SectionShell
                  number="05"
                  eyebrow="Full length"
                  title="Full mocks"
                  description={
                    examName
                      ? `Complete timed mocks for ${examName}.`
                      : 'Complete timed mocks for your exam.'
                  }
                  href={mockHref}
                  linkLabel="All mocks"
                >
                  {fullMocks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {fullMocks.map((m) => (
                        <MockCard key={m.id} mock={m} />
                      ))}
                    </div>
                  ) : (
                    <ComingSoonCard
                      title="Full mocks coming soon"
                      description="Coming soon — stay tuned. Full-length mocks for this exam are on the way."
                    />
                  )}
                </SectionShell>

                <SectionShell
                  number="06"
                  eyebrow="By topic"
                  title="Topic-wise mocks"
                  description="Shorter mocks scoped to a chapter or topic."
                  href={mockHref}
                  linkLabel="Browse mocks"
                >
                  {topicMocks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {topicMocks.map((m) => (
                        <MockCard key={m.id} mock={m} />
                      ))}
                    </div>
                  ) : (
                    <ComingSoonCard
                      title="Topic mocks coming soon"
                      description="Coming soon — stay tuned. Topic-wise mocks will appear here."
                    />
                  )}
                </SectionShell>

                <SectionShell
                  number="07"
                  eyebrow="Stay current"
                  title={examName ? `${examName} updates` : 'Exam updates'}
                  description="Articles matched to your exam via free search."
                  href={articlesHref}
                  linkLabel="All articles"
                >
                  {updates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {updates.slice(0, 5).map((item) => (
                        <UpdateCard key={item.id || item.slug} item={item} />
                      ))}
                    </div>
                  ) : (
                    <ComingSoonCard
                      title="No updates yet"
                      description="Coming soon — stay tuned. Fresh exam articles will show up here."
                    />
                  )}
                </SectionShell>

                <SectionShell
                  number="08"
                  eyebrow="Your progress"
                  title={examName ? `${examName} practice` : 'Subject practice'}
                  description="Topics you’ve already practiced — tap one to continue."
                  href={practiceHref}
                  linkLabel="All topics"
                >
                  <DashboardSubjectPractice
                    practice={practiceAreas}
                    primaryExam={focusedExam || primaryExam}
                    loading={false}
                    embedded
                  />
                </SectionShell>

                {SHOW_OG_TRACKERS && (dashboard?.myRoadmaps?.length ?? 0) > 0 ? (
                  <SectionShell
                    number="09"
                    eyebrow="Study plans"
                    title="Your roadmaps"
                    description="Continue a plan you’ve started."
                    href="/og-trackers"
                    linkLabel="Browse plans"
                  >
                    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5">
                      <DashboardMyRoadmaps roadmaps={dashboard?.myRoadmaps} />
                    </div>
                  </SectionShell>
                ) : null}
              </div>
            ) : null}

            {!limitedMode && initialLoading ? (
              <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
                  <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-3 w-20 bg-emerald-100 rounded" />
                    <div className="h-7 w-48 bg-neutral-200 rounded" />
                    <div className="h-32 rounded-2xl border border-neutral-200 bg-white" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function StudentHomeDashboard() {
  return (
    <Suspense fallback={null}>
      <StudentHomeDashboardInner />
    </Suspense>
  );
}
