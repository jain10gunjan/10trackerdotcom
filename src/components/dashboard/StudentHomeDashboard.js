'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { useCredits } from '@/context/CreditsContext';
import WalletBar from '@/components/credits/WalletBar';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import { parseJsonResponse } from '@/lib/toastAsync';
import { profileNeedsExamRefresh } from '@/lib/examProfile';
import { practiceHrefForSlug, mockTestHrefForSlug, formatExamSlug } from '@/lib/platformExams';
import {
  BookOpen,
  Target,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Trophy,
  Clock,
  ClipboardList,
  Coins,
  Star,
  AlertCircle,
  Settings,
} from 'lucide-react';

function formatExamName(area) {
  return formatExamSlug(area);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentHomeDashboard() {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed') === '1';
  const { user } = useAuth();
  const { displayName, profile } = useProfileGate();
  const { credits, unlimited, subscription, walletError, walletReady } = useCredits();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [heatmapRange, setHeatmapRange] = useState('90d');

  const loadDashboard = async (range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/dashboard?heatmapRange=${range}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await parseJsonResponse(res);
      if (data.success) setDashboard(data);
    } catch (e) {
      console.error('dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(heatmapRange);
  }, [heatmapRange]);

  const practice = dashboard?.practice ?? [];
  const mockAttempts = dashboard?.mockTests?.attempts ?? [];
  const mockStats = dashboard?.mockTests?.stats;
  const summary = dashboard?.summary ?? {};
  const primaryExam = dashboard?.primaryExam;
  const examsPreparing = dashboard?.examsPreparing ?? [];
  const leaderboard = dashboard?.leaderboard;

  const needsExamUpdate = useMemo(
    () => profileNeedsExamRefresh(profile, examsPreparing.map((e) => e.slug)),
    [profile, examsPreparing]
  );

  if (loading && !dashboard) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'practice', label: 'Practice' },
    { id: 'mock', label: 'Mock tests' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {needsExamUpdate && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">Update your exam selection</p>
            <p className="text-sm text-amber-800 mt-1">
              Please choose your exam(s) from the current active list so your dashboard stays accurate.
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

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="p-5 sm:p-6 border-b border-neutral-100">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Your dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1">
                Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}
              </h1>
              {primaryExam && (
                <p className="text-sm text-neutral-600 mt-2 flex items-center gap-2 flex-wrap">
                  <Star className="w-4 h-4 text-amber-500" />
                  Primary: <span className="font-medium text-neutral-900">{primaryExam.name}</span>
                </p>
              )}
              {examsPreparing.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {examsPreparing.map((e) => (
                    <span
                      key={e.slug}
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        e.isPrimary
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {e.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <WalletBar />
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Settings className="w-4 h-4" />
                Profile
              </Link>
            </div>
          </div>

          {!unlimited && walletReady && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-neutral-600">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="font-semibold tabular-nums">{credits}</span> credits
              </span>
              <Link href="/pricing" className="font-medium text-neutral-900 underline underline-offset-2">
                Plans →
              </Link>
            </div>
          )}
          {unlimited && subscription?.expiresAt && (
            <p className="mt-3 text-xs text-emerald-700">
              Unlimited until {formatDate(subscription.expiresAt)}
            </p>
          )}
          {subscribed && (
            <p className="mt-4 text-sm text-emerald-700 font-medium rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
              Subscription active — enjoy unlimited practice and mock tests.
            </p>
          )}
          {walletError && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {walletError}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-neutral-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-100">
          {[
            { label: 'Practice Qs', value: (summary.practiceQuestions ?? 0).toLocaleString(), icon: BookOpen },
            { label: 'Accuracy', value: `${summary.practiceAccuracy ?? 0}%`, icon: Target },
            { label: 'Mocks done', value: summary.mockTestsCompleted ?? 0, icon: Trophy },
            { label: 'Mock avg %', value: `${summary.mockAverageScore ?? 0}%`, icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 sm:p-5">
              <stat.icon className="w-4 h-4 text-neutral-400 mb-2" />
              <p className="text-xl sm:text-2xl font-semibold text-neutral-900 tabular-nums">{stat.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {primaryExam && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href={practiceHrefForSlug(primaryExam.slug)}
            className="rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-900">Continue practice</p>
              <p className="text-xs text-neutral-500 mt-1">{primaryExam.name}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400" />
          </Link>
          <Link
            href={mockTestHrefForSlug(primaryExam.slug)}
            className="rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-900">Mock tests</p>
              <p className="text-xs text-neutral-500 mt-1">Hub & leaderboard</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400" />
          </Link>
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          {leaderboard?.entries?.length > 0 && (
            <LeaderboardSection leaderboard={leaderboard} primarySlug={primaryExam?.slug} />
          )}
          {practice.length > 0 && (
            <Section title="Practice by exam" icon={BookOpen}>
              <div className="grid gap-3 sm:grid-cols-2">
                {practice.slice(0, 4).map((exam) => (
                  <PracticeCard key={exam.area} exam={exam} isPrimary={exam.area === primaryExam?.slug} />
                ))}
              </div>
            </Section>
          )}
          {mockAttempts.length > 0 && (
            <Section title="Recent mock tests" icon={ClipboardList}>
              <MockList attempts={mockAttempts.slice(0, 5)} />
            </Section>
          )}
          {practice.length === 0 && mockAttempts.length === 0 && <EmptyState primarySlug={primaryExam?.slug} />}
        </div>
      )}

      {tab === 'practice' && (
        <Section title="All practice progress" icon={BookOpen}>
          {practice.length === 0 ? (
            <EmptyState primarySlug={primaryExam?.slug} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {practice.map((exam) => (
                <PracticeCard key={exam.area} exam={exam} detailed isPrimary={exam.area === primaryExam?.slug} />
              ))}
            </div>
          )}
        </Section>
      )}

      {tab === 'mock' && (
        <Section title="All mock test attempts" icon={ClipboardList}>
          {mockStats && (
            <p className="text-sm text-neutral-600 mb-4">
              {mockStats.completedCount} completed
              {mockStats.inProgressCount > 0 && ` · ${mockStats.inProgressCount} in progress`}
              {' · '}Across all exams you have attempted
            </p>
          )}
          {mockAttempts.length === 0 ? (
            <EmptyState type="mock" primarySlug={primaryExam?.slug} />
          ) : (
            <MockList attempts={mockAttempts} />
          )}
        </Section>
      )}

      {tab === 'activity' && (
        <Section title="Study activity" icon={BarChart3}>
          <ActivityHeatmap
            heatmap={dashboard?.heatmap}
            range={heatmapRange}
            onRangeChange={setHeatmapRange}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
        <Icon className="w-5 h-5 text-neutral-500" />
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function LeaderboardSection({ leaderboard, primarySlug }) {
  const { entries, yourRank } = leaderboard;
  return (
    <Section title={`Leaderboard · ${formatExamSlug(primarySlug)}`} icon={Trophy}>
      {yourRank && (
        <p className="text-sm text-neutral-700 mb-4 rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2">
          Your rank: <strong>#{yourRank.rank}</strong>
          {yourRank.outsideTop ? ' (outside top 10)' : ''} · {yourRank.score}% avg
        </p>
      )}
      <ol className="space-y-2 mb-4">
        {entries.map((e) => (
          <li
            key={e.userEmail}
            className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-neutral-50"
          >
            <span className="font-medium text-neutral-800">
              #{e.rank} {e.displayName}
            </span>
            <span className="tabular-nums text-neutral-600">{e.score}%</span>
          </li>
        ))}
      </ol>
      {primarySlug && (
        <Link
          href={`/mock-test/${primarySlug}?tab=leaderboard`}
          className="text-sm font-medium text-neutral-900 inline-flex items-center gap-1 hover:underline"
        >
          Full leaderboard <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </Section>
  );
}

function PracticeCard({ exam, detailed, isPrimary }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isPrimary ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 bg-neutral-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            {formatExamName(exam.area)}
            {isPrimary && (
              <span className="text-[10px] uppercase tracking-wide bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                Primary
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-500">{exam.topicsCount} topics</p>
        </div>
        <Link href={practiceHrefForSlug(exam.area)} className="p-2 rounded-lg hover:bg-white">
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-lg bg-white border py-2">
          <p className="font-bold tabular-nums">{exam.totalCompleted}</p>
          <p className="text-[10px] text-neutral-500">Questions</p>
        </div>
        <div className="rounded-lg bg-white border py-2">
          <p className="font-bold tabular-nums">{exam.overallAccuracy}%</p>
          <p className="text-[10px] text-neutral-500">Accuracy</p>
        </div>
      </div>
      {detailed && exam.topics?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {exam.topics.slice(0, 5).map((t) => (
            <li key={t.topic} className="text-xs flex justify-between text-neutral-600">
              <span className="truncate capitalize">{t.topic.replace(/-/g, ' ')}</span>
              <span>{t.completedQuestions} q</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MockList({ attempts }) {
  return (
    <ul className="space-y-2">
      {attempts.map((a) => (
        <li
          key={a.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl border border-neutral-100"
        >
          <div>
            <p className="font-medium text-neutral-900">{a.testName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {formatExamName(a.category)} · {formatDate(a.startedAt)}
              {a.isCompleted ? (
                <span className="text-emerald-700 ml-1">· Done</span>
              ) : (
                <span className="text-amber-700 ml-1">· In progress</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {a.isCompleted && a.percentage != null && (
              <span className="font-semibold tabular-nums">{Math.round(a.percentage)}%</span>
            )}
            {a.category && (
              <Link
                href={mockTestHrefForSlug(String(a.category).toLowerCase())}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200"
              >
                Hub
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ type, primarySlug }) {
  const isMock = type === 'mock';
  const href = isMock
    ? primarySlug
      ? mockTestHrefForSlug(primarySlug)
      : '/exams'
    : primarySlug
      ? practiceHrefForSlug(primarySlug)
      : '/exams';
  return (
    <div className="text-center py-12">
      <p className="text-neutral-600 mb-4">
        {isMock ? 'No mock tests yet.' : 'No practice progress yet.'}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold"
      >
        Get started <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
