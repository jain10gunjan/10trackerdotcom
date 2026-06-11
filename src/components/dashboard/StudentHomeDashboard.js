'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { useCredits } from '@/context/CreditsContext';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import DashboardProfileSidebar from '@/components/dashboard/DashboardProfileSidebar';
import DashboardProgressRing from '@/components/dashboard/DashboardProgressRing';
import DashboardRecentActivity from '@/components/dashboard/DashboardRecentActivity';
import DashboardMyRoadmaps from '@/components/dashboard/DashboardMyRoadmaps';
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardMobileHeader from '@/components/dashboard/DashboardMobileHeader';
import DashboardContinueCard from '@/components/dashboard/DashboardContinueCard';
import DashboardSetupBanner from '@/components/dashboard/DashboardSetupBanner';
import DashboardLeaderboard from '@/components/dashboard/DashboardLeaderboard';
import DashboardSubjectPractice from '@/components/dashboard/DashboardSubjectPractice';
import {
  SidebarSkeleton,
  ProgressCardSkeleton,
  HeatmapSkeleton,
  RecentActivitySkeleton,
} from '@/components/dashboard/DashboardSkeletons';
import { profileNeedsExamRefresh } from '@/lib/examProfile';

function DashboardCard({ title, children, action, loading = false, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden ${className}`}
      aria-busy={loading || undefined}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-neutral-900">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function StudentHomeDashboardInner() {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed') === '1';
  const { user } = useAuth();
  const { profile: gateProfile, needsProfileCompletion } = useProfileGate();
  const { credits, unlimited, subscription, walletError, walletReady } = useCredits();

  const {
    dashboard,
    initialLoading,
    error,
    partialError,
    heatmapRange,
    changeHeatmapRange,
    reload,
  } = useHomeDashboard({ enabled: Boolean(user) });

  const profile = dashboard?.profile;
  const summary = dashboard?.summary ?? {};
  const primaryExam = dashboard?.primaryExam;
  const examsPreparing = dashboard?.examsPreparing ?? [];
  const streak = dashboard?.streak ?? {};
  const leaderboard = dashboard?.leaderboard;
  const leaderboards = dashboard?.leaderboards ?? {};
  const practiceAreas = dashboard?.practice ?? [];
  const limitedMode = needsProfileCompletion;

  const displayName =
    profile?.displayName ||
    gateProfile?.display_name ||
    user?.name ||
    user?.fullName ||
    user?.email?.split('@')[0] ||
    'Student';

  const needsExamUpdate = useMemo(
    () =>
      !initialLoading &&
      !limitedMode &&
      profileNeedsExamRefresh(gateProfile, examsPreparing.map((e) => e.slug)),
    [gateProfile, examsPreparing, initialLoading, limitedMode]
  );

  const sidebarStats = useMemo(
    () => ({
      credits: walletReady ? credits : dashboard?.wallet?.credits,
      rank: leaderboard?.yourRank,
      rankExam: primaryExam?.name ? `${primaryExam.name} · overall` : null,
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
      activeDays: streak.activeDays,
      topicsPracticed: summary.topicsPracticed ?? 0,
      mockAverageScore: summary.mockAverageScore,
      mockTestsCompleted: summary.mockTestsCompleted,
    }),
    [credits, walletReady, dashboard, leaderboard, primaryExam, streak, summary]
  );

  const showFullDashboard = !error || partialError;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pb-12 space-y-6">
        {error && !dashboard ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-900">Could not load your dashboard</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        ) : null}

        {showFullDashboard ? (
          <>
            {limitedMode ? <DashboardSetupBanner /> : null}

            <DashboardMobileHeader
              user={user}
              profile={profile}
              streak={streak}
              credits={sidebarStats.credits}
              unlimited={unlimited}
              loading={initialLoading}
            />

            {dashboard?.partialErrors?.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Some sections could not load: {dashboard.partialErrors.join(', ')}. Other data is
                still shown below.
              </div>
            )}

            {partialError ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>Some dashboard data could not be refreshed.</span>
                <button
                  type="button"
                  onClick={reload}
                  className="inline-flex items-center gap-1.5 font-semibold underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : null}

            {subscribed && (
              <p className="text-sm text-emerald-700 font-medium rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                Subscription active — enjoy unlimited practice and mock tests.
              </p>
            )}

            {walletError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {walletError}
              </p>
            )}

            {needsExamUpdate && (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900">Update your exam selection</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Choose your exam(s) from the active list so your dashboard stays accurate.
                  </p>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-amber-900 underline"
                  >
                    Edit profile <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
              <div className="hidden lg:block">
                {initialLoading ? (
                  <SidebarSkeleton />
                ) : (
                  <DashboardProfileSidebar
                    user={user}
                    profile={profile}
                    examsPreparing={examsPreparing}
                    stats={sidebarStats}
                    unlimited={unlimited}
                  />
                )}
              </div>

              <div className="space-y-6 min-w-0">
                <DashboardHero
                  displayName={displayName}
                  streak={streak}
                  summary={summary}
                  loading={initialLoading}
                />

                {!limitedMode ? (
                  <DashboardLeaderboard
                    leaderboards={leaderboards}
                    examsPreparing={examsPreparing}
                    primaryExam={primaryExam}
                    loading={initialLoading}
                  />
                ) : null}

                <DashboardContinueCard
                  recentActivity={dashboard?.recentActivity}
                  mockTests={dashboard?.mockTests}
                  primaryExam={limitedMode ? null : primaryExam}
                  loading={initialLoading}
                />

                {!limitedMode ? (
                  <>
                    <DashboardSubjectPractice
                      practice={practiceAreas}
                      primaryExam={primaryExam}
                      loading={initialLoading}
                    />

                    <DashboardCard title="Progress overview" loading={initialLoading}>
                      {initialLoading ? (
                        <ProgressCardSkeleton />
                      ) : (
                        <DashboardProgressRing
                          practiceQuestions={summary.practiceQuestions ?? 0}
                          mocksCompleted={summary.mockTestsCompleted ?? 0}
                          practiceAccuracy={summary.practiceAccuracy ?? 0}
                        />
                      )}
                    </DashboardCard>

                    <DashboardCard
                      title="Submission activity"
                      loading={initialLoading}
                      action={
                        !initialLoading && streak.activeDays > 0 ? (
                          <span className="text-xs text-neutral-500 tabular-nums">
                            {streak.activeDays} active days · max {streak.maxStreak}
                          </span>
                        ) : null
                      }
                    >
                      {initialLoading ? (
                        <HeatmapSkeleton />
                      ) : (
                        <ActivityHeatmap
                          heatmap={dashboard?.heatmap}
                          range={heatmapRange}
                          onRangeChange={changeHeatmapRange}
                        />
                      )}
                    </DashboardCard>

                    <DashboardCard title="Recent activity" loading={initialLoading} className="!overflow-visible">
                      {initialLoading ? (
                        <RecentActivitySkeleton />
                      ) : (
                        <DashboardRecentActivity
                          recentActivity={dashboard?.recentActivity}
                          practiceAreas={practiceAreas}
                          primarySlug={primaryExam?.slug}
                        />
                      )}
                    </DashboardCard>

                    <DashboardCard
                      title="My roadmaps"
                      action={
                        <Link
                          href="/roadmaps"
                          className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                        >
                          Browse all
                        </Link>
                      }
                      loading={initialLoading}
                    >
                      {initialLoading ? (
                        <RecentActivitySkeleton />
                      ) : (
                        <DashboardMyRoadmaps roadmaps={dashboard?.myRoadmaps} />
                      )}
                    </DashboardCard>

                    {!initialLoading && !unlimited && walletReady && subscription?.expiresAt && (
                      <p className="text-xs text-neutral-500 text-center">
                        Plan expires{' '}
                        {new Date(subscription.expiresAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </>
                ) : (
                  <DashboardCard title="While you set up">
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-600">
                        You can still browse exams and explore practice material. Complete your
                        profile to unlock streaks, progress tracking, and personalized rankings.
                      </p>
                      <Link
                        href="/exams"
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        Browse exams
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </DashboardCard>
                )}
              </div>
            </div>
          </>
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
