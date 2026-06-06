'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { useCredits } from '@/context/CreditsContext';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import DashboardProfileSidebar from '@/components/dashboard/DashboardProfileSidebar';
import DashboardProgressRing from '@/components/dashboard/DashboardProgressRing';
import DashboardRecentActivity from '@/components/dashboard/DashboardRecentActivity';
import DashboardMyRoadmaps from '@/components/dashboard/DashboardMyRoadmaps';
import {
  SidebarSkeleton,
  ProgressCardSkeleton,
  QuickActionsSkeleton,
  HeatmapSkeleton,
  RecentActivitySkeleton,
} from '@/components/dashboard/DashboardSkeletons';
import { parseJsonResponse } from '@/lib/toastAsync';
import { profileNeedsExamRefresh } from '@/lib/examProfile';
import { practiceHrefForSlug, mockTestHrefForSlug, formatExamSlug } from '@/lib/platformExams';

function DashboardCard({ title, children, action, loading = false }) {
  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
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

export default function StudentHomeDashboard() {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed') === '1';
  const { user } = useAuth();
  const { profile: gateProfile } = useProfileGate();
  const { credits, unlimited, subscription, walletError, walletReady } = useCredits();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heatmapRange, setHeatmapRange] = useState('12mo');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/dashboard?heatmapRange=${heatmapRange}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await parseJsonResponse(res);
        if (!cancelled && data.success) setDashboard(data);
      } catch (e) {
        console.error('dashboard', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heatmapRange]);

  const initialLoading = loading && !dashboard;
  const heatmapLoading = loading && Boolean(dashboard);

  const profile = dashboard?.profile;
  const summary = dashboard?.summary ?? {};
  const primaryExam = dashboard?.primaryExam;
  const examsPreparing = dashboard?.examsPreparing ?? [];
  const streak = dashboard?.streak ?? {};
  const leaderboard = dashboard?.leaderboard;

  const needsExamUpdate = useMemo(
    () =>
      !initialLoading &&
      profileNeedsExamRefresh(gateProfile, examsPreparing.map((e) => e.slug)),
    [gateProfile, examsPreparing, initialLoading]
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

  const showLeaderboard =
    !initialLoading && leaderboard?.entries?.length > 0 && primaryExam;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {needsExamUpdate && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
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

      {subscribed && (
        <p className="mb-6 text-sm text-emerald-700 font-medium rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
          Subscription active — enjoy unlimited practice and mock tests.
        </p>
      )}

      {walletError && (
        <p className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {walletError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
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

        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
            <DashboardCard title="Progress" loading={initialLoading}>
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

            {initialLoading ? (
              <QuickActionsSkeleton />
            ) : (
              primaryExam && (
                <div className="flex flex-col gap-3 xl:w-56">
                  <Link
                    href={practiceHrefForSlug(primaryExam.slug)}
                    className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center"
                  >
                    <p className="text-sm font-semibold text-neutral-900">Continue practice</p>
                    <p className="text-xs text-neutral-500 mt-1">{primaryExam.name}</p>
                    <ArrowRight className="w-4 h-4 text-neutral-400 mt-3" />
                  </Link>
                  <Link
                    href={mockTestHrefForSlug(primaryExam.slug)}
                    className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center"
                  >
                    <p className="text-sm font-semibold text-neutral-900">Mock tests</p>
                    <p className="text-xs text-neutral-500 mt-1">Hub & leaderboard</p>
                    <ArrowRight className="w-4 h-4 text-neutral-400 mt-3" />
                  </Link>
                </div>
              )
            )}
          </div>

          <DashboardCard
            title="Submission activity"
            loading={initialLoading || heatmapLoading}
            action={
              !initialLoading && !heatmapLoading && streak.activeDays > 0 ? (
                <span className="text-xs text-neutral-500 tabular-nums">
                  {streak.activeDays} active days · max streak {streak.maxStreak}
                </span>
              ) : null
            }
          >
            {initialLoading || heatmapLoading ? (
              <HeatmapSkeleton />
            ) : (
              <ActivityHeatmap
                heatmap={dashboard?.heatmap}
                range={heatmapRange}
                onRangeChange={setHeatmapRange}
              />
            )}
          </DashboardCard>

          <DashboardCard
            title="My roadmaps"
            action={
              <Link href="/roadmaps" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
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

          <DashboardCard title="Recent activity" loading={initialLoading}>
            {initialLoading ? (
              <RecentActivitySkeleton />
            ) : (
              <DashboardRecentActivity
                recentActivity={dashboard?.recentActivity}
                primarySlug={primaryExam?.slug}
              />
            )}
          </DashboardCard>

          {showLeaderboard ? (
            <DashboardCard
              title={`Leaderboard · ${formatExamSlug(primaryExam.slug)}`}
              action={
                <Link
                  href={`/mock-test/${primaryExam.slug}?tab=leaderboard`}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  View all
                </Link>
              }
            >
              {leaderboard.yourRank && (
                <p className="text-sm text-neutral-700 mb-3 rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2">
                  Your rank: <strong>#{leaderboard.yourRank.rank}</strong>
                  {leaderboard.yourRank.outsideTop ? ' (outside top 10)' : ''} ·{' '}
                  {leaderboard.yourRank.score}% avg
                </p>
              )}
              <ol className="space-y-1">
                {leaderboard.entries.map((e) => (
                  <li
                    key={e.userEmail}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-800 truncate">
                      #{e.rank} {e.displayName}
                    </span>
                    <span className="tabular-nums text-neutral-600 shrink-0 ml-2">{e.score}%</span>
                  </li>
                ))}
              </ol>
            </DashboardCard>
          ) : null}

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
        </div>
      </div>
    </div>
  );
}
