'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
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
import { APP_GUTTER } from '@/lib/appChrome';
import {
  useStudentMotion,
  staggerContainer,
  staggerItem,
} from '@/features/dashboard/lib/studentHomeBrand';

const FOCUS_STORAGE_KEY = 'tt_home_focus_exam';

function StudentHomeDashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const subscribed = searchParams.get('subscribed') === '1';
  const examFromUrl = String(searchParams.get('exam') || '').trim().toLowerCase();
  const { user } = useAuth();
  const { profile: gateProfile, needsProfileCompletion } = useProfileGate();
  const { credits, unlimited, subscription, walletError, walletReady } = useCredits();
  const { animate } = useStudentMotion();

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
  const catalogStats = examFeed?.catalogStats ?? {};
  const bankQuestions = catalogStats.questionCount ?? 0;
  const publishedMocks = catalogStats.mockCount ?? 0;
  const syllabusTopics =
    (catalogStats.topicCount ?? 0) ||
    (catalogStats.chapterCount ?? 0) ||
    practiceAreas[0]?.topicsCount ||
    topicMocks.length;
  const topicMockCount = topicMocks.length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {error && !dashboard ? (
        <div className={`max-w-7xl mx-auto ${APP_GUTTER} pt-24 pb-14`}>
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
        </div>
      ) : null}

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
            topicMocksHref={topicMocksHref}
            topicMockCount={topicMockCount}
            hasContinue={hasContinue}
            topSlot={
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
            }
          />

          {!limitedMode ? (
            <StudentHomePulse
              streak={streak.currentStreak ?? 0}
              questions={bankQuestions}
              mocks={publishedMocks}
              topics={syllabusTopics}
              loading={initialLoading}
            />
          ) : null}

          {!limitedMode && !initialLoading ? (
            <div className={`max-w-7xl mx-auto ${APP_GUTTER} space-y-9 sm:space-y-11 pb-16 sm:pb-20`}>
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
                eyebrow="Plan"
                title="Access & exam date"
                description={
                  examName
                    ? `Credits and countdown for ${examName}.`
                    : 'Credits and countdown for your exam.'
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <PlanStatusCard
                    unlimited={unlimited}
                    subscription={subscription}
                    credits={credits}
                    walletReady={walletReady || Boolean(dashboard?.wallet)}
                  />
                  <CountdownCard countdown={countdown} examName={examName} />
                </div>
              </StudentHomeSection>

              <StudentHomeSection
                eyebrow="Mocks"
                title={examName ? `${examName} mocks` : 'Mocks'}
                description="Daily, full-length, and topic-wise — this exam only."
                href={mockHref}
                linkLabel="All mocks"
              >
                <div className="space-y-4">
                  {mockOfTheDay?.status === 'ready' && mockOfTheDay?.mock?.href ? (
                    <MotdFeatureCard motd={mockOfTheDay} />
                  ) : (
                    <ComingSoonCard
                      title={mockOfTheDay?.title || 'Mock of the day'}
                      description={
                        mockOfTheDay?.description ||
                        'A fresh daily mock for this exam is coming soon.'
                      }
                    />
                  )}

                  {fullMocks.length > 0 ? (
                    <motion.div
                      variants={staggerContainer(true, animate)}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                    >
                      {fullMocks.map((m, i) => (
                        <motion.div key={m.id} custom={i} variants={staggerItem}>
                          <MockCard mock={m} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : null}

                  {topicMocks.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-800">Topic mocks</p>
                        <a
                          href={topicMocksHref}
                          className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
                        >
                          Browse all
                        </a>
                      </div>
                      <motion.div
                        variants={staggerContainer(true, animate)}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                      >
                        {topicMocks.map((m, i) => (
                          <motion.div key={m.id} custom={i} variants={staggerItem}>
                            <MockCard mock={m} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  ) : null}

                  {!fullMocks.length && !topicMocks.length ? (
                    <ComingSoonCard
                      title="Mocks coming soon"
                      description="Full-length and topic mocks for this exam will appear here."
                    />
                  ) : null}
                </div>
              </StudentHomeSection>

              <StudentHomeSection
                eyebrow="Practice"
                title={examName ? `${examName} topics` : 'Your topics'}
                description="Topics you’ve practiced on this exam."
                href={practiceHref}
                linkLabel="All topics"
              >
                <div className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden">
                  <DashboardSubjectPractice
                    practice={practiceAreas}
                    primaryExam={focusedExam || (examSlug ? { slug: examSlug, name: examName } : primaryExam)}
                    loading={false}
                    embedded
                  />
                </div>
              </StudentHomeSection>

              {updates.length > 0 ? (
                <StudentHomeSection
                  eyebrow="Updates"
                  title={examName ? `${examName} news` : 'Exam updates'}
                  description="Articles for this exam."
                  href={articlesHref}
                  linkLabel="All articles"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {updates.slice(0, 3).map((item) => (
                      <UpdateCard key={item.id || item.slug} item={item} />
                    ))}
                  </div>
                </StudentHomeSection>
              ) : null}

              {SHOW_OG_TRACKERS && (dashboard?.myRoadmaps?.length ?? 0) > 0 ? (
                <StudentHomeSection
                  eyebrow="Study plans"
                  title="Roadmaps"
                  description={`Plans for ${examName || 'this exam'}.`}
                  href="/og-trackers"
                  linkLabel="Browse plans"
                >
                  <div className="rounded-2xl border border-neutral-200/90 bg-white p-5">
                    <DashboardMyRoadmaps roadmaps={dashboard?.myRoadmaps} />
                  </div>
                </StudentHomeSection>
              ) : null}
            </div>
          ) : null}

          {!limitedMode && initialLoading ? (
            <div className={`max-w-7xl mx-auto ${APP_GUTTER} space-y-8 pb-16 animate-pulse`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
                <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-3 w-20 rounded" style={{ backgroundColor: '#E8EDF8' }} />
                  <div className="h-7 w-48 bg-neutral-200 rounded" />
                  <div className="h-32 rounded-2xl border border-neutral-200 bg-white" />
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
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
