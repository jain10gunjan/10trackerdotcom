'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { useCredits } from '@/context/CreditsContext';
import { useHomeDashboard } from '@/features/dashboard/hooks/useHomeDashboard';
import DashboardSetupBanner from '@/features/dashboard/components/DashboardSetupBanner';
import DashboardSubjectPractice from '@/features/dashboard/components/DashboardSubjectPractice';
import DashboardMyRoadmaps from '@/features/dashboard/components/DashboardMyRoadmaps';
import DashboardAlerts from '@/features/dashboard/components/DashboardAlerts';
import StudentHomeHero from '@/features/dashboard/components/studentHome/StudentHomeHero';
import StudentHomePulse from '@/features/dashboard/components/studentHome/StudentHomePulse';
import StudentHomeSection from '@/features/dashboard/components/studentHome/StudentHomeSection';
import StudentHomeActivity from '@/features/dashboard/components/studentHome/StudentHomeActivity';
import HomeBone from '@/features/dashboard/components/studentHome/HomeBone';
import {
  PlanStatusCard,
  CountdownCard,
  MotdFeatureCard,
  ComingSoonCard,
  MockCard,
  UpdateCard,
} from '@/features/dashboard/components/studentHome/StudentHomeCards';
import {
  practiceHrefForSlug,
  mockTestHrefForSlug,
  formatExamSlug,
} from '@/lib/platformExams';
import { profileNeedsExamRefresh, practiceAreaMatchesSlug } from '@/lib/examProfile';
import { SHOW_OG_TRACKERS } from '@/lib/siteNav';
import { APP_GUTTER, APP_NAV_CONTENT_OFFSET } from '@/lib/appChrome';
import {
  STUDENT_BRAND,
  easeOut,
  useStudentMotion,
  homeCard,
  homePrimaryBtn,
} from '@/features/dashboard/lib/studentHomeBrand';

const FOCUS_STORAGE_KEY = 'tt_home_focus_exam';

function HomeError({ message, onRetry }) {
  return (
    <div className={`${homeCard} px-5 py-8 text-center`} role="alert">
      <AlertCircle className="mx-auto h-6 w-6 text-red-600" />
      <p className="mt-3 text-base font-semibold text-[#0a0a0a]">Could not load your home</p>
      <p className="mt-1 text-sm text-neutral-600">{message}</p>
      <button type="button" onClick={onRetry} className={`${homePrimaryBtn} mt-5`}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function HomeLoadingBody() {
  return (
    <div className="space-y-10 sm:space-y-12" aria-hidden>
      <div className="space-y-3">
        <HomeBone className="h-3 w-16" />
        <HomeBone className="h-6 w-44" />
        <HomeBone className="h-48 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <HomeBone className="h-32 rounded-2xl" />
        <HomeBone className="h-32 rounded-2xl" />
      </div>
      <HomeBone className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function Atmosphere({ animate }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 85% 12%, #E8EDF8 0%, transparent 55%), radial-gradient(ellipse 55% 40% at 8% 25%, #F0F4FF 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 50%, #F5F5F5 100%)',
        }}
      />
      {animate ? (
        <>
          <motion.div
            className="absolute right-[10%] top-[6%] h-72 w-72 rounded-full blur-[100px] will-change-transform"
            style={{ backgroundColor: `${STUDENT_BRAND.blue}24` }}
            animate={{ x: [0, 18, 0], y: [0, 12, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-[3%] top-[22%] h-56 w-56 rounded-full bg-sky-200/35 blur-[90px] will-change-transform"
            animate={{ x: [0, -14, 0], y: [0, 16, 0], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
        </>
      ) : (
        <div
          className="absolute right-[12%] top-[8%] h-64 w-64 rounded-full opacity-40 blur-[100px]"
          style={{ backgroundColor: STUDENT_BRAND.soft }}
        />
      )}
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
  const { credits, unlimited, subscription, walletError, walletReady } = useCredits();
  const [focusExam, setFocusExam] = useState(examFromUrl);
  const { animate } = useStudentMotion();

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
    heatmapRange,
    changeHeatmapRange,
    reload,
  } = useHomeDashboard({ enabled: Boolean(user), focusExam });

  const profile = dashboard?.profile;
  const primaryExam = dashboard?.primaryExam;
  const focusedExam = dashboard?.focusedExam || primaryExam;

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
      profileNeedsExamRefresh(
        gateProfile,
        examsPreparing.map((e) => e.slug)
      ),
    [gateProfile, examsPreparing, initialLoading, limitedMode]
  );

  const examSlug = focusedExam?.slug || examFeed?.exam?.slug || focusExam;
  const examName =
    focusedExam?.name ||
    examFeed?.exam?.name ||
    (examSlug ? formatExamSlug(examSlug) : null);

  const practiceAreas = useMemo(() => {
    const list = dashboard?.practice ?? [];
    if (!examSlug) return list;
    return list.filter((exam) => practiceAreaMatchesSlug(exam.area, examSlug));
  }, [dashboard?.practice, examSlug]);

  const practiceHref =
    examFeed?.links?.practiceHref ||
    (examSlug ? practiceHrefForSlug(examSlug) : '/exams');
  const dailyHref =
    examFeed?.links?.dailyHref || (examSlug ? `/${examSlug}/daily-practice` : '/exams');
  const mockHref =
    examFeed?.links?.mockHref || (examSlug ? mockTestHrefForSlug(examSlug) : '/exams');
  const topicMocksHref = examSlug
    ? `${mockTestHrefForSlug(examSlug)}?type=topic`
    : mockHref;
  const articlesHref =
    examFeed?.updatesHref || (examSlug ? `/article/${examSlug}` : '/articles');

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
  const topicMockCount = topicMocks.length;
  const motdReady = mockOfTheDay?.status === 'ready' && Boolean(mockOfTheDay?.mock?.href);
  const showAlerts =
    subscribed ||
    Boolean(walletError) ||
    Boolean(partialError) ||
    (dashboard?.partialErrors?.length ?? 0) > 0 ||
    needsExamUpdate;
  const hasMockLists = fullMocks.length > 0 || topicMocks.length > 0;

  const bodyEnter = animate
    ? {
        initial: { opacity: 0.96, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: easeOut },
      }
    : { initial: false, animate: { opacity: 1, y: 0 } };

  return (
    <div className="relative min-h-screen min-w-0 overflow-x-hidden text-neutral-950">
      <Atmosphere animate={animate} />

      <div
        className={`relative mx-auto min-w-0 max-w-7xl ${APP_GUTTER} pb-16 sm:pb-20`}
        style={{ paddingTop: APP_NAV_CONTENT_OFFSET }}
      >
        <div className="space-y-8 pt-5 sm:space-y-10 sm:pt-8">
          {error && !dashboard ? <HomeError message={error} onRetry={reload} /> : null}

          {showFullDashboard ? (
            <>
              <StudentHomeHero
                firstName={firstName}
                examName={examName}
                examSlug={examSlug}
                examsPreparing={examsPreparing}
                showExamSwitcher={showExamSwitcher}
                onExamChange={handleExamChange}
                switchingExam={switchingExam}
                limitedMode={limitedMode}
                loading={initialLoading}
                continueOptions={continueOptions}
                practiceHref={practiceHref}
                mockHref={mockHref}
                dailyHref={dailyHref}
                topicMocksHref={topicMocksHref}
                topicMockCount={topicMockCount}
                hasContinue={hasContinue}
                streakDays={streak.currentStreak ?? 0}
                topSlot={
                  limitedMode || showAlerts ? (
                    <>
                      {limitedMode ? <DashboardSetupBanner /> : null}
                      <DashboardAlerts
                        subscribed={subscribed}
                        walletError={walletError}
                        partialError={partialError}
                        partialErrors={dashboard?.partialErrors ?? []}
                        needsExamUpdate={needsExamUpdate}
                        onRetry={reload}
                      />
                    </>
                  ) : null
                }
              />

              {!limitedMode ? (
                <div className={switchingExam ? 'opacity-70 transition-opacity duration-200' : undefined}>
                  <StudentHomePulse
                    streak={streak.currentStreak ?? 0}
                    questions={dashboard?.summary?.practiceQuestions ?? 0}
                    mocks={dashboard?.summary?.mockTestsCompleted ?? 0}
                    topics={dashboard?.summary?.topicsPracticed ?? 0}
                    loading={initialLoading}
                  />
                </div>
              ) : null}

              {!limitedMode && initialLoading ? <HomeLoadingBody /> : null}

              {!limitedMode && !initialLoading ? (
                <motion.div
                  {...bodyEnter}
                  className={`space-y-12 sm:space-y-14 ${
                    switchingExam ? 'opacity-70 transition-opacity duration-200' : ''
                  }`}
                >
                  <StudentHomeActivity
                    summary={dashboard?.summary}
                    streak={streak}
                    examName={examName}
                    examSlug={examSlug}
                    practiceHref={practiceHref}
                    dailyHref={dailyHref}
                    practice={practiceAreas}
                    recentActivity={dashboard?.recentActivity}
                    heatmap={dashboard?.heatmap}
                    heatmapRange={heatmapRange}
                    onHeatmapRangeChange={changeHeatmapRange}
                  />

                  <StudentHomeSection
                    eyebrow="Simulate"
                    title="Timed mock tests"
                    description="Mock of the day, full mocks, and topic mocks for this exam."
                    href={mockHref}
                    linkLabel="View all mocks"
                  >
                    <div className="space-y-5">
                      {motdReady ? <MotdFeatureCard motd={mockOfTheDay} /> : null}

                      {fullMocks.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3F5EB9]">
                            Full mocks
                          </p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {fullMocks.map((m) => (
                              <MockCard key={m.id} mock={m} />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {topicMocks.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3F5EB9]">
                              Topic mocks
                            </p>
                            <Link
                              href={topicMocksHref}
                              className="inline-flex min-h-11 items-center text-sm font-semibold text-[#3F5EB9]"
                            >
                              Browse all
                            </Link>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {topicMocks.map((m) => (
                              <MockCard key={m.id} mock={m} />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {!motdReady && !hasMockLists ? (
                        <ComingSoonCard
                          title={mockOfTheDay?.title || 'Mocks coming soon'}
                          description={
                            mockOfTheDay?.description ||
                            'Full-length and topic mocks for this exam will show up here.'
                          }
                        />
                      ) : null}

                      {!motdReady && hasMockLists ? (
                        <ComingSoonCard
                          title={mockOfTheDay?.title || 'Mock of the day'}
                          description={
                            mockOfTheDay?.description ||
                            'A fresh daily mock is not up yet — full and topic mocks below still work.'
                          }
                        />
                      ) : null}
                    </div>
                  </StudentHomeSection>

                  <StudentHomeSection
                    eyebrow="Practice"
                    title="Topics you've practiced"
                    description={
                      examName
                        ? `Topics you've answered for ${examName}.`
                        : "Topics you've answered."
                    }
                    href={practiceHref}
                    linkLabel="View all topics"
                  >
                    <DashboardSubjectPractice
                      practice={practiceAreas}
                      primaryExam={
                        focusedExam || (examSlug ? { slug: examSlug, name: examName } : primaryExam)
                      }
                      loading={false}
                      embedded
                    />
                  </StudentHomeSection>

                  <StudentHomeSection
                    eyebrow="Account"
                    title="Credits and exam date"
                    description="Your plan, credits left, and the countdown for this exam."
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <PlanStatusCard
                        unlimited={unlimited}
                        subscription={subscription}
                        credits={credits}
                        walletReady={walletReady || Boolean(dashboard?.wallet)}
                      />
                      <CountdownCard countdown={countdown} examName={examName} />
                    </div>
                  </StudentHomeSection>

                  {updates.length > 0 ? (
                    <StudentHomeSection
                      eyebrow="Updates"
                      title="Exam updates"
                      description="Articles written for this exam."
                      href={articlesHref}
                      linkLabel="View all articles"
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {updates.slice(0, 3).map((item) => (
                          <UpdateCard key={item.id || item.slug} item={item} />
                        ))}
                      </div>
                    </StudentHomeSection>
                  ) : null}

                  {SHOW_OG_TRACKERS ? (
                    <StudentHomeSection
                      eyebrow="OG Trackers"
                      title="Exam track and User track"
                      description="Shared chapter paths for everyone, plus private playlist trackers when you build from a playlist."
                      href="/og-trackers"
                      linkLabel="Open OG Trackers"
                    >
                      <DashboardMyRoadmaps />
                    </StudentHomeSection>
                  ) : null}
                </motion.div>
              ) : null}
            </>
          ) : null}
        </div>
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
