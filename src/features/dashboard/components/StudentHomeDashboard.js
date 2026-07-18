'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { useCredits } from '@/context/CreditsContext';
import { useHomeDashboard } from '@/features/dashboard/hooks/useHomeDashboard';
import ActivityHeatmap from '@/features/dashboard/components/ActivityHeatmap';
import DashboardProfileSidebar from '@/features/dashboard/components/DashboardProfileSidebar';
import DashboardProgressRing from '@/features/dashboard/components/DashboardProgressRing';
import DashboardRecentActivity from '@/features/dashboard/components/DashboardRecentActivity';
import DashboardMyRoadmaps from '@/features/dashboard/components/DashboardMyRoadmaps';
import DashboardPageHeader from '@/features/dashboard/components/DashboardPageHeader';
import DashboardQuickStats from '@/features/dashboard/components/DashboardQuickStats';
import DashboardContinueCard from '@/features/dashboard/components/DashboardContinueCard';
import DashboardSetupBanner from '@/features/dashboard/components/DashboardSetupBanner';
import DashboardLeaderboard from '@/features/dashboard/components/DashboardLeaderboard';
import DashboardSubjectPractice from '@/features/dashboard/components/DashboardSubjectPractice';
import DashboardAlerts from '@/features/dashboard/components/DashboardAlerts';
import {
  SidebarSkeleton,
  ProgressCardSkeleton,
  HeatmapSkeleton,
  RecentActivitySkeleton,
} from '@/features/dashboard/components/DashboardSkeletons';
import { profileNeedsExamRefresh } from '@/lib/examProfile';

function DashboardCard({ title, children, action, loading = false, className = '', flush = false }) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden ${className}`}
      aria-busy={loading || undefined}
    >
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-3">
          {title ? <h2 className="text-sm font-semibold text-neutral-900">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pb-12">
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
          <div className="space-y-6">
            {limitedMode ? <DashboardSetupBanner /> : null}

            <DashboardAlerts
              subscribed={subscribed}
              walletError={walletError}
              partialError={partialError}
              partialErrors={dashboard?.partialErrors ?? []}
              needsExamUpdate={needsExamUpdate}
              onRetry={reload}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
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

              <div className="space-y-5 min-w-0">
                <DashboardPageHeader
                  displayName={displayName}
                  user={user}
                  profile={profile}
                  streak={streak}
                  credits={sidebarStats.credits}
                  unlimited={unlimited}
                  loading={initialLoading}
                />

                <DashboardContinueCard
                  continueOptions={dashboard?.continueOptions}
                  loading={initialLoading}
                />

                {!limitedMode ? (
                  <DashboardQuickStats summary={summary} loading={initialLoading} />
                ) : null}

                {!limitedMode ? (
                  <>
                    <DashboardLeaderboard
                      leaderboards={leaderboards}
                      examsPreparing={examsPreparing}
                      primaryExam={primaryExam}
                      loading={initialLoading}
                    />

                    <DashboardSubjectPractice
                      practice={practiceAreas}
                      primaryExam={primaryExam}
                      loading={initialLoading}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
                              {streak.activeDays} active days
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
                    </div>

                    <DashboardCard title="Recent activity" loading={initialLoading} flush>
                      {initialLoading ? (
                        <div className="p-5">
                          <RecentActivitySkeleton />
                        </div>
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
