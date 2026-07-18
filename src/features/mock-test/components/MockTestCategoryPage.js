"use client";
import React, { useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import {
  BookOpen, Clock, Users, Play, Target, CheckCircle, Filter, Search, ChevronRight,
  Star, Trophy, ArrowRight, TrendingUp, Award, TrendingDown, ChevronLeft, Grid,
  History, FileText, PieChart, Lock, BarChart, BarChart3, TrendingUp as TrendingUpIcon,
  Gauge, Activity, Zap, Brain, RefreshCw, Eye, Calendar, Hexagon, Layers, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  getCategoryVariants,
  computeConsecutiveDayStreak,
  durationTakenToSeconds,
  categoryMatches,
  formatDurationShort,
  fetchActiveMockTests,
} from '@/features/mock-test/lib/mockTestUtils';
import MockTestHubHeader from '@/features/mock-test-hub/components/MockTestHubHeader';
import MockTestHubTabs from '@/features/mock-test-hub/components/MockTestHubTabs';
import MockTestCard from '@/features/mock-test-hub/components/MockTestCard';
import MockTestStatsStrip from '@/features/mock-test-hub/components/MockTestStatsStrip';
import MockTestGuestHero from '@/features/mock-test-hub/components/MockTestGuestHero';
import MockTestTypeSegment from '@/features/mock-test-hub/components/MockTestTypeSegment';
import MockTestHubSkeleton from '@/features/mock-test-hub/components/MockTestHubSkeleton';
import ResumeTestBanner from '@/features/mock-test/components/ResumeTestBanner';
import PreflightModal from '@/features/mock-test/components/PreflightModal';
import TestListToolbar from '@/features/mock-test/components/TestListToolbar';
import LeaderboardPanel from '@/features/mock-test/components/LeaderboardPanel';
import TestLeaderboardInline from '@/features/mock-test/components/TestLeaderboardInline';
import { useMockTestProfile } from '@/features/mock-test/components/useMockTestProfile';

// Supabase configuration with connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
);

// Optimized utility functions
const sanitizeData = (value, type = 'string', defaultValue = null) => {
  if (value === null || value === undefined) return defaultValue;
  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? (defaultValue || 0) : num;
    case 'array':
      return Array.isArray(value) ? value : (defaultValue || []);
    case 'object':
      return typeof value === 'object' && value !== null ? value : (defaultValue || {});
    default:
      return String(value).trim();
  }
};

const debounce = (func, wait) => {
  let timeout;
  const executedFunction = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  executedFunction.cancel = () => clearTimeout(timeout);
  return executedFunction;
};

function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-neutral-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="text-center max-w-xs w-full">
        <div className="relative mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-3 sm:border-4 border-neutral-200 rounded-full animate-pulse mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-3 sm:border-4 border-neutral-700 rounded-full border-t-transparent animate-spin mx-auto"></div>
        </div>
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-800 mb-1">Loading</h3>
        <p className="text-xs sm:text-sm text-neutral-600">Preparing...</p>
      </div>
    </div>
  );
}

const isTopicWiseTest = (test) => {
  const desc = String(test?.description || '').trim().toLowerCase();
  if (desc.startsWith('topic-wise test')) return true;
  const mode = String(test?.creation_mode || '').trim().toLowerCase();
  if (mode === 'topic_auto' || mode === 'topic_wise') return true;
  const name = String(test?.name || '').trim().toLowerCase();
  if (name.includes('topic test')) return true;
  return false;
};

const MOCK_TEST_TABS = [
  { id: 'tests', label: 'Tests', icon: BookOpen, requiresAuth: false },
  { id: 'rank', label: 'Rank', icon: Trophy, requiresAuth: false },
  { id: 'progress', label: 'My Progress', icon: BarChart3, requiresAuth: true },
];

function mapLegacyTab(tabParam) {
  if (!tabParam) return 'tests';
  if (tabParam === 'results' || tabParam === 'sessions' || tabParam === 'subjects') return 'progress';
  if (tabParam === 'dashboard' || tabParam === 'topic-tests' || tabParam === 'tests') return 'tests';
  if (tabParam === 'leaderboard') return 'rank';
  if (['tests', 'rank', 'progress'].includes(tabParam)) return tabParam;
  return 'tests';
}

function mapLegacyTestType(tabParam, typeParam) {
  if (typeParam === 'topic' || tabParam === 'topic-tests') return 'topic';
  if (typeParam === 'full') return 'full';
  return 'all';
}

// Public Dashboard Component for Non-Authenticated Users
// signInHref: use Link so navigation works even if extensions break onClick
const PublicDashboard = memo(function PublicDashboard({ tests, examcategory, signInHref }) {
  const categoryLabel = (examcategory?.toUpperCase?.() || 'GATE CSE').replace(/-/g, ' ');
  const href = signInHref || `/sign-in?redirect=${encodeURIComponent(`/mock-test/${examcategory || 'gate-cse'}`)}`;
  const totalQuestions = tests.reduce((sum, t) => sum + (t.total_questions || 0), 0);
  const avgDurationMin =
    tests.length > 0
      ? Math.round(tests.reduce((sum, t) => sum + (t.duration || 0), 0) / tests.length)
      : 0;
  return (
    <div className="space-y-6">
      {/* Welcome Section - neutral */}
      <div className="bg-neutral-900 rounded-xl p-6 text-white">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Welcome to {categoryLabel} Mock Tests</h2>
        <p className="text-neutral-300 mb-4 text-sm sm:text-base">Practice with full-length tests and track your progress.</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-300">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {tests.length} tests
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Join thousands of students
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="bg-neutral-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{tests.length}</p>
              <p className="text-xs sm:text-sm text-neutral-600">Available Tests</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="bg-neutral-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{totalQuestions.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-neutral-600">Questions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="bg-neutral-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{avgDurationMin > 0 ? `${avgDurationMin}m` : '—'}</p>
              <p className="text-xs sm:text-sm text-neutral-600">Avg Duration</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="bg-neutral-100 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">
                {tests.length > 0 ? Math.round(totalQuestions / tests.length) : '—'}
              </p>
              <p className="text-xs sm:text-sm text-neutral-600">Avg Q / test</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Tests */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <Star className="h-5 w-5 mr-2 text-neutral-600" />
            Featured Mock Tests
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.slice(0, 6).map((test) => (
              <div key={test.id} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 mb-1 truncate">{test.name}</h4>
                    <p className="text-sm text-neutral-600">{test.total_questions} Questions</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                    test.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {test.difficulty || 'Mixed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {test.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {test.attemptCount} attempts
                  </span>
                </div>
                <Link
                  href={href}
                  className="block w-full text-center bg-neutral-900 text-white py-2.5 rounded-lg font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2"
                >
                  Sign in to start
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-neutral-100 rounded-xl p-6 border border-neutral-200">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">Ready to start?</h3>
          <p className="text-neutral-600 mb-4 text-sm sm:text-base">Sign in to access analytics and track your progress.</p>
          <Link
            href={href}
            className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    </div>
  );
});

// Rich Dashboard for authenticated users: stats, quick start, recent activity, insights
const AuthenticatedDashboard = memo(function AuthenticatedDashboard({
  tests,
  userStats,
  examTrackerStats,
  examcategory,
  categoryLabel,
  onStartTest,
  onViewResults,
  onRetakeTest,
  onOpenProgress,
}) {
  const suggestedTests = useMemo(() => {
    const notDone = tests.filter((t) => !t.userCompleted);
    const done = tests.filter((t) => t.userCompleted);
    return [...notDone.slice(0, 2), ...done.slice(0, 1)].filter(Boolean).slice(0, 3);
  }, [tests]);
  const recentForDashboard = (examTrackerStats.recentAttempts || []).slice(0, 3);
  const strongest = examTrackerStats.strongestSubject || (examTrackerStats.subjectWisePerformance?.[0]?.subject);
  const weakest = examTrackerStats.weakestSubject || (examTrackerStats.subjectWisePerformance?.length ? examTrackerStats.subjectWisePerformance[examTrackerStats.subjectWisePerformance.length - 1]?.subject : null);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome + key stats */}
      <div className="bg-neutral-900 rounded-xl p-4 sm:p-6 text-white">
        <h2 className="text-lg sm:text-xl font-semibold mb-1">Welcome back</h2>
        <p className="text-neutral-300 text-sm mb-4">Here’s your {categoryLabel} mock test overview.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold">{tests.length}</p>
            <p className="text-neutral-300 text-xs sm:text-sm">Tests available</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold">{userStats.completedTests}</p>
            <p className="text-neutral-300 text-xs sm:text-sm">Completed</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold">{userStats.completedTests > 0 ? `${userStats.bestScore}%` : '—'}</p>
            <p className="text-neutral-300 text-xs sm:text-sm">Best score</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold">{userStats.totalStudyTime}h</p>
            <p className="text-neutral-300 text-xs sm:text-sm">Study time</p>
          </div>
        </div>
      </div>

      {/* Quick start: suggested tests */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-amber-500" />
            Quick start
          </h3>
          <button
            type="button"
            onClick={onOpenProgress}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
          >
            My Progress <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {suggestedTests.length === 0 ? (
            <p className="text-neutral-500 text-sm">No tests in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestedTests.map((test) => (
                <div key={test.id} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 hover:border-neutral-300 transition-colors">
                  <h4 className="font-semibold text-neutral-900 text-sm sm:text-base truncate mb-1">{test.name}</h4>
                  <p className="text-xs text-neutral-600 mb-3">{test.total_questions} Q · {test.duration} min</p>
                  {test.userCompleted ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onViewResults(test)}
                        className="py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" /> Results
                      </button>
                      <button
                        type="button"
                        onClick={() => onRetakeTest(test)}
                        className="py-2 rounded-lg text-sm font-medium border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" /> Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartTest(test)}
                      className="w-full py-2 rounded-lg text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" /> Start test
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recentForDashboard.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center">
              <History className="h-5 w-5 mr-2 text-neutral-600" />
              Recent activity
            </h3>
            <button
              type="button"
              onClick={onOpenProgress}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              View all
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <ul className="space-y-3">
              {recentForDashboard.map((attempt) => (
                <li key={attempt.id}>
                  <Link
                    href={`/mock-test/${examcategory}/results/${attempt.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate text-sm sm:text-base">{attempt.test_name || 'Test'}</p>
                      <p className="text-xs text-neutral-500">
                        {attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-bold text-neutral-900">{Math.round(attempt.percentage ?? attempt.score ?? 0)}%</span>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Insights one-liner */}
      {(strongest || weakest) && (
        <div className="bg-neutral-100 rounded-xl p-4 sm:p-5 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center">
            <Brain className="h-4 w-4 mr-2 text-neutral-600" />
            Insights
          </h3>
          <p className="text-sm text-neutral-700">
            {strongest && <span>Strongest: <strong>{strongest}</strong></span>}
            {strongest && weakest && ' · '}
            {weakest && <span>Focus more: <strong>{weakest}</strong></span>}
          </p>
        </div>
      )}

      {/* CTA to Mock Tests tab */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onOpenProgress}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-100"
        >
          <BarChart3 className="h-4 w-4" />
          Full progress & analytics
        </button>
      </div>
    </div>
  );
});

// My Progress tab: stats + recent sessions + subject analysis in one scroll
const MyProgressTab = memo(function MyProgressTab({ examTrackerStats, userStats, examcategory }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <AnimatedStatsCard icon={CheckCircle} title="Tests completed" value={userStats.completedTests} color="green" delay={0} />
        <AnimatedStatsCard icon={Trophy} title="Best score" value={userStats.completedTests > 0 ? `${userStats.bestScore}%` : '—'} color="yellow" delay={50} />
        <AnimatedStatsCard icon={TrendingUpIcon} title="Accuracy" value={`${examTrackerStats.averageAccuracy}%`} color="blue" delay={100} />
        <AnimatedStatsCard icon={Clock} title="Study time" value={`${userStats.totalStudyTime}h`} color="orange" delay={150} />
      </div>
      <RecentSessionsTab examTrackerStats={examTrackerStats} examcategory={examcategory} />
      <AnalyticsTab examTrackerStats={examTrackerStats} userStats={userStats} />
    </div>
  );
});

// Enhanced Analytics Tab Component
const AnalyticsTab = memo(function AnalyticsTab({ examTrackerStats, userStats }) {
  if (!examTrackerStats.subjectWisePerformance.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <BarChart className="h-10 w-10 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-600 mb-2">No analytics yet</h3>
        <p className="text-neutral-500">Complete mock tests to see detailed analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <TrendingUpIcon className="h-5 w-5 mr-2 text-neutral-600" />
            Overall Performance
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{examTrackerStats.overallStats?.totalQuestions || 0}</p>
              <p className="text-xs sm:text-sm text-neutral-600">Total Questions</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{examTrackerStats.overallStats?.overallAccuracy || 0}%</p>
              <p className="text-xs sm:text-sm text-neutral-600">Accuracy</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{examTrackerStats.overallStats?.overallAttemptRate || 0}%</p>
              <p className="text-xs sm:text-sm text-neutral-600">Attempt Rate</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{examTrackerStats.overallStats?.totalSubjects || 0}</p>
              <p className="text-xs sm:text-sm text-neutral-600">Subjects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-neutral-600" />
            Subject-wise Performance
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examTrackerStats.subjectWisePerformance.map((subject, index) => (
              <SubjectPerformanceCard key={`${subject.subject}-${index}`} subject={subject} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced Recent Sessions Tab Component
const RecentSessionsTab = memo(function RecentSessionsTab({ examTrackerStats, examcategory }) {
  if (!examTrackerStats.recentAttempts.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <History className="h-10 w-10 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-600 mb-2">No recent sessions</h3>
        <p className="text-neutral-500">Start mock tests to see session history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <History className="h-5 w-5 mr-2 text-neutral-600" />
            Recent Test Sessions
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examTrackerStats.recentAttempts.map((attempt) => (
              <RecentTestSession key={attempt.id} attempt={attempt} examcategory={examcategory} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const StatsCardSkeleton = (() => (
  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-4 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-2.5 sm:h-3 bg-neutral-200 rounded w-16 mb-2"></div>
        <div className="h-4 sm:h-5 bg-neutral-200 rounded w-12"></div>
      </div>
    </div>
  </div>
));

// Highly optimized stats card with reduced re-renders
const AnimatedStatsCard = memo(function AnimatedStatsCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = "blue", 
  trend = null,
  delay = 0,
  loading = false 
}) {
  const [isVisible, setIsVisible] = useState(false);

  const colorClasses = useMemo(() => ({
    blue: "bg-neutral-700 text-white",
    green: "bg-green-600 text-white",
    purple: "bg-neutral-600 text-white",
    orange: "bg-orange-600 text-white",
    red: "bg-red-600 text-white",
    yellow: "bg-amber-600 text-white"
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) return <StatsCardSkeleton />;

  return (
    <div 
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-lg ${colorClasses[color]} shadow-sm flex-shrink-0`}>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
          </div>
          {trend !== null && (
            <div className={`flex items-center text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-700' : 
              trend < 0 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700'
            }`}>
              {trend > 0 ? <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> : 
               trend < 0 ? <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> : null}
              <span className="text-xs">{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-neutral-900 mb-0.5 sm:mb-1 leading-tight truncate">{value}</h3>
        <p className="text-xs sm:text-sm font-semibold text-neutral-700 mb-0.5 sm:mb-1 leading-tight truncate">{title}</p>
        {subtitle && <p className="text-xs text-neutral-500 leading-tight truncate">{subtitle}</p>}
      </div>
    </div>
  );
});

// Mobile-optimized test list item
const TestListItem = memo(function TestListItem({
  test,
  onStartTest,
  onViewResults,
  onRetakeTest,
  examcategory,
  user,
}) {
  const getDifficultyColor = useMemo(() => {
    switch (test.difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  }, [test.difficulty]);

  const formatDuration = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200">
      {/* Mobile-first layout */}
      <div className="space-y-3 sm:space-y-4">
        {/* Header with icon and title */}
        <div className="flex items-start space-x-3">
          <div className="bg-neutral-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate pr-2">{test.name}</h4>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${getDifficultyColor}`}>
                    {test.difficulty || 'Mixed'}
                  </span>
                  {test.userInProgress && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      In progress
                    </span>
                  )}
                  {test.userCompleted && !test.userInProgress && (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-1 truncate">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-600 flex-shrink-0" />
            <span className="truncate">{test.total_questions} Questions</span>
          </div>
          <div className="flex items-center space-x-1 truncate">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
            <span className="truncate">{formatDuration(test.duration)}</span>
          </div>
          <div className="flex items-center space-x-1 truncate">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-600 flex-shrink-0" />
            <span className="truncate">{test.attemptCount} Attempts</span>
          </div>
        </div>

        {/* Best Score */}
        {test.userCompleted && test.userBestScore !== undefined && (
          <div className="flex items-center space-x-2 bg-yellow-50 p-2 rounded-lg">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-yellow-700">
              Best Score: {test.userBestScore}%
            </span>
          </div>
        )}
        
        {/* Action buttons - mobile optimized */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {test.userInProgress ? (
            <button
              type="button"
              onClick={() => onStartTest(test)}
              className="col-span-2 flex items-center justify-center bg-amber-600 text-white px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              Continue test
            </button>
          ) : test.userCompleted ? (
            <>
              <button
                type="button"
                onClick={() => onViewResults(test)}
                className="flex items-center justify-center bg-neutral-800 text-white px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-700 transition-colors"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                Results
              </button>
              <button
                type="button"
                onClick={() => onRetakeTest(test)}
                className="flex items-center justify-center border border-neutral-300 text-neutral-800 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                Retake
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onStartTest(test)}
              className="col-span-2 flex items-center justify-center bg-neutral-900 text-white px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              Start test
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 flex-shrink-0" />
            </button>
          )}
        </div>

        <TestLeaderboardInline
          examcategory={examcategory}
          testId={test.id}
          testName={test.name}
          user={user}
          attemptCount={test.attemptCount}
        />
      </div>
    </div>
  );
});

// Optimized recent test session
const RecentTestSession = memo(function RecentTestSession({ attempt, examcategory }) {
  const getScoreColor = useCallback((score) => {
    const validScore = sanitizeData(score, 'number', 0);
    if (validScore >= 80) return 'bg-green-500 text-white';
    if (validScore >= 60) return 'bg-yellow-500 text-white';
    if (validScore >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  }, []);

  const {
    percentage,
    attemptedQuestions,
    correctAnswers,
    wrongAnswers,
    unanswered,
    durationTaken,
    testName
  } = useMemo(() => ({
    percentage: sanitizeData(attempt.percentage || attempt.score, 'number', 0),
    attemptedQuestions: sanitizeData(attempt.attempted_questions, 'number', 0),
    correctAnswers: sanitizeData(attempt.correct_answers, 'number', 0),
    wrongAnswers: sanitizeData(attempt.wrong_answers, 'number', 0),
    unanswered: sanitizeData(attempt.unanswered, 'number', 0),
    durationTaken: sanitizeData(attempt.duration_taken, 'number', 0),
    testName: attempt.test_name || `Test #${attempt.test_id?.slice(0,8) || 'Unknown'}`
  }), [attempt]);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm lg:text-base flex-shrink-0 ${getScoreColor(percentage)}`}>
          {Math.round(percentage)}%
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-xs sm:text-sm lg:text-base">{testName}</h4>
          <p className="text-xs sm:text-sm text-gray-600">
            {new Date(attempt.created_at || attempt.submitted_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-3">
        <div className="text-center p-1.5 sm:p-2 bg-neutral-100 rounded-lg">
          <p className="text-neutral-800 font-bold text-xs sm:text-sm">{attemptedQuestions}</p>
          <p className="text-neutral-600 text-xs">Attempted</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-green-50 rounded-lg">
          <p className="text-green-600 font-bold text-xs sm:text-sm">{correctAnswers}</p>
          <p className="text-green-700 text-xs">Correct</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-red-50 rounded-lg">
          <p className="text-red-600 font-bold text-xs sm:text-sm">{wrongAnswers}</p>
          <p className="text-red-700 text-xs">Wrong</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-gray-50 rounded-lg">
          <p className="text-gray-600 font-bold text-xs sm:text-sm">{unanswered}</p>
          <p className="text-gray-700 text-xs">Skipped</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
        <div className="flex items-center text-gray-600">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
          Duration: {formatDurationShort(durationTaken)}
        </div>
        <Link
          href={`/mock-test/${examcategory}/results/${attempt.id}`}
          className="text-neutral-800 hover:text-neutral-900 font-medium flex items-center self-end"
        >
          Details
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
});

// Mobile-optimized subject performance card
const SubjectPerformanceCard = memo(function SubjectPerformanceCard({ subject }) {
  const performanceColor = useMemo(() => {
    if (subject.accuracy >= 80) return 'border-green-300 bg-green-50';
    if (subject.accuracy >= 60) return 'border-yellow-300 bg-yellow-50';
    if (subject.accuracy >= 40) return 'border-orange-300 bg-orange-50';
    return 'border-red-300 bg-red-50';
  }, [subject.accuracy]);

  const accuracyColor = useMemo(() => {
    if (subject.accuracy >= 80) return 'from-green-400 to-green-600';
    if (subject.accuracy >= 60) return 'from-yellow-400 to-yellow-600';
    if (subject.accuracy >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  }, [subject.accuracy]);

  const badgeColor = useMemo(() => {
    if (subject.accuracy >= 80) return 'bg-green-100 text-green-700';
    if (subject.accuracy >= 60) return 'bg-yellow-100 text-yellow-700';
    if (subject.accuracy >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  }, [subject.accuracy]);

  return (
    <div className={`rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 hover:shadow-lg transition-shadow duration-300 ${performanceColor}`}>
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mb-1 truncate">{subject.subject}</h4>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            {subject.topicsIncluded?.slice(0, 2).join(', ')}
            {subject.topicsIncluded?.length > 2 && ` +${subject.topicsIncluded.length - 2} more`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${badgeColor}`}>
            {subject.accuracy.toFixed(1)}%
          </span>
          <p className="text-xs text-gray-500 mt-1">{subject.performanceLevel}</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">Accuracy</span>
            <span className="text-gray-600">{subject.correctAnswers}/{subject.attemptedQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${accuracyColor} transition-all duration-1000`}
              style={{ width: `${subject.accuracy}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">Attempt Rate</span>
            <span className="text-gray-600">{subject.attemptedQuestions}/{subject.totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="h-1.5 sm:h-2 rounded-full bg-neutral-600 transition-all duration-1000"
              style={{ width: `${subject.attemptRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-neutral-800 font-bold text-xs sm:text-sm">{subject.totalQuestions}</p>
          <p className="text-neutral-600 text-xs">Total</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-green-600 font-bold text-xs sm:text-sm">{subject.correctAnswers}</p>
          <p className="text-green-700 text-xs">Correct</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-red-600 font-bold text-xs sm:text-sm">{subject.wrongAnswers}</p>
          <p className="text-red-700 text-xs">Wrong</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-gray-600 font-bold text-xs sm:text-sm">{subject.unanswered}</p>
          <p className="text-gray-700 text-xs">Skipped</p>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1 mb-2 sm:mb-3">
        <div className="flex justify-between">
          <span>Avg Time:</span>
          <span className="font-medium">{subject.avgTimePerQuestion}s</span>
        </div>
        <div className="flex justify-between">
          <span>Tests:</span>
          <span className="font-medium">{subject.testsIncluded?.length || 0}</span>
        </div>
      </div>

      <div className="pt-2 sm:pt-3 border-t border-neutral-200">
        <p className="text-xs text-gray-600">
          <span className="font-medium text-gray-700">💡 Tip:</span> {subject.recommendedAction}
        </p>
      </div>
    </div>
  );
});

// Smart pagination with mobile optimization
const Pagination = memo(function Pagination({ currentPage, totalPages, onPageChange }) {
  const getVisiblePages = useMemo(() => {
    if (totalPages <= 1) return [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    const rangeWithDots = [];
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-6 sm:mt-8 px-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      {/* Desktop pagination */}
      <div className="hidden sm:flex items-center space-x-1">
        {getVisiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => page !== '...' && onPageChange(page)}
            disabled={page === '...' || page === currentPage}
            className={`min-w-[2.5rem] px-3 py-2 text-sm rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-neutral-900 text-white'
                : page === '...'
                ? 'text-neutral-400 cursor-default'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
            aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>
      
      {/* Mobile pagination */}
      <div className="sm:hidden px-3 py-2 text-sm text-neutral-600 bg-neutral-100 rounded-lg min-w-[4rem] text-center">
        {currentPage} / {totalPages}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
});

// Keep the analysis function (unchanged for performance)
const analyzeSubjectPerformance = (allUserAttempts, testNameLookup) => {
  const subjectAnalysis = new Map();
  let totalQuestions = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;

  allUserAttempts.forEach((attempt) => {
    const testName = testNameLookup[attempt.test_id] || `Test-${attempt.test_id?.slice(0,8) || 'Unknown'}`;
    
    try {
      const allQuestions = sanitizeData(attempt.all_questions, 'array', []);
      
      allQuestions.forEach((question) => {
        const subject = question.subject || 'General';
        totalQuestions++;
        
        if (!subjectAnalysis.has(subject)) {
          subjectAnalysis.set(subject, {
            totalQuestions: 0,
            attemptedQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            unanswered: 0,
            totalTimeSpent: 0,
            tests: new Set(),
            topics: new Set()
          });
        }
        
        const subjectData = subjectAnalysis.get(subject);
        subjectData.totalQuestions++;
        subjectData.tests.add(testName);
        subjectData.topics.add(question.topic || 'Unknown');
        
        if (question.isAttempted) {
          subjectData.attemptedQuestions++;
          totalAttempted++;
          
          const timeSpent = sanitizeData(question.timeSpent, 'number', 0);
          subjectData.totalTimeSpent += timeSpent;
          
          if (question.isCorrect) {
            subjectData.correctAnswers++;
            totalCorrect++;
          } else {
            subjectData.wrongAnswers++;
          }
        } else {
          subjectData.unanswered++;
        }
      });
    } catch (error) {
      console.error('Error processing attempt:', error);
    }
  });

  const subjectWisePerformance = Array.from(subjectAnalysis.entries())
    .map(([subject, data]) => {
      const accuracy = data.attemptedQuestions > 0 ? 
        Math.round((data.correctAnswers / data.attemptedQuestions) * 10000) / 100 : 0;
      
      const attemptRate = data.totalQuestions > 0 ? 
        Math.round((data.attemptedQuestions / data.totalQuestions) * 10000) / 100 : 0;
      
      const avgTimePerQuestion = data.attemptedQuestions > 0 ? 
        Math.round((data.totalTimeSpent / data.attemptedQuestions) * 100) / 100 : 0;
      
      return {
        subject,
        totalQuestions: data.totalQuestions,
        attemptedQuestions: data.attemptedQuestions,
        correctAnswers: data.correctAnswers,
        wrongAnswers: data.wrongAnswers,
        unanswered: data.unanswered,
        accuracy,
        attemptRate,
        avgTimePerQuestion,
        testsIncluded: Array.from(data.tests),
        topicsIncluded: Array.from(data.topics),
        performanceLevel: accuracy >= 80 ? 'Excellent' : 
                         accuracy >= 60 ? 'Good' : 
                         accuracy >= 40 ? 'Average' : 'Needs Improvement',
        recommendedAction: accuracy < 50 ? 'Focus on fundamentals' :
                          attemptRate < 70 ? 'Practice more questions' :
                          avgTimePerQuestion > 120 ? 'Work on speed' : 'Maintain performance'
      };
    })
    .filter(item => item.totalQuestions > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  const overallStats = {
    totalQuestions,
    totalAttempted,
    totalCorrect,
    overallAccuracy: totalAttempted > 0 ? 
      Math.round((totalCorrect / totalAttempted) * 10000) / 100 : 0,
    overallAttemptRate: totalQuestions > 0 ? 
      Math.round((totalAttempted / totalQuestions) * 10000) / 100 : 0,
    totalSubjects: subjectWisePerformance.length
  };

  return { subjectWisePerformance, overallStats };
};

function OptimizedMockTestDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { displayName: profileDisplayName } = useMockTestProfile(user);
  const { examcategory } = useParams();
  const router = useRouter();
  const dataLoadedForRef = React.useRef('');
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const typeParam = searchParams.get('type');
  const normalizedTab = useMemo(() => mapLegacyTab(tabParam), [tabParam]);
  const normalizedTestType = useMemo(
    () => mapLegacyTestType(tabParam, typeParam),
    [tabParam, typeParam]
  );
  const [activeTab, setActiveTab] = useState(() => normalizedTab);
  const [testTypeFilter, setTestTypeFilter] = useState(() => normalizedTestType);
  const prevTabParamRef = React.useRef(tabParam);

  useEffect(() => {
    if (tabParam !== prevTabParamRef.current) {
      prevTabParamRef.current = tabParam;
      setActiveTab(normalizedTab);
      setTestTypeFilter(normalizedTestType);
    }
  }, [tabParam, normalizedTab, normalizedTestType]);
  
  const [tests, setTests] = useState([]);
  const [userStats, setUserStats] = useState({
    completedTests: 0,
    averageScore: 0,
    totalStudyTime: 0,
    bestScore: 0,
    recentAttempts: [],
    totalQuestions: 0,
    improvement: 0,
    streak: 0
  });
  const [examTrackerStats, setExamTrackerStats] = useState({
    totalAttempts: 0,
    averageAccuracy: 0,
    totalTimeSpent: 0,
    questionsAttempted: 0,
    subjectWisePerformance: [],
    recentAttempts: [],
    strongestSubject: '',
    weakestSubject: '',
    overallStats: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [inProgressByTestId, setInProgressByTestId] = useState({});
  const [preflight, setPreflight] = useState({ open: false, test: null, isRetake: false });
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 10;

  const categoryLabel = useMemo(
    () => (examcategory?.toUpperCase?.() || 'GATE CSE').replace(/-/g, ' '),
    [examcategory]
  );

  const userEmail = useMemo(
    () =>
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      user?.email ||
      null,
    [user]
  );

  // Optimized debounced search with cleanup
  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 200),
    []
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending debounced calls
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Highly optimized fetch functions with better error handling
  const fetchAvailableTests = useCallback(async () => {
    try {
      const { data: testRows, error: testsError } = await fetchActiveMockTests(
        supabase,
        examcategory
      );

      if (testsError) throw testsError;

      let testsWithDetails = (testRows || []).map((test) => ({
        ...test,
        attemptCount: 0,
        userBestScore: null,
        userCompleted: false,
        isTopicWise: isTopicWiseTest(test),
      }));


      // If user is authenticated, enrich with attempt data (non-fatal if this fails)
      if (userEmail) {
        const testIdsArr = testsWithDetails.map((t) => t.id).filter(Boolean);
        let userAttemptsResponse = { data: [], error: null };
        let allAttemptsResponse = { data: [], error: null };

        try {
          [userAttemptsResponse, allAttemptsResponse] = await Promise.all([
            supabase
              .from('user_test_attempts')
              .select('id, test_id, score, percentage, submitted_at')
              .eq('user_email', userEmail)
              .eq('is_completed', true)
              .order('submitted_at', { ascending: false }),
            testIdsArr.length > 0
              ? supabase
                  .from('user_test_attempts')
                  .select('test_id')
                  .eq('is_completed', true)
                  .in('test_id', testIdsArr)
              : { data: [], error: null },
          ]);
        } catch (attemptFetchErr) {
          console.warn('Could not load attempt metadata for test list:', attemptFetchErr);
        }

        if (userAttemptsResponse.error) {
          console.warn('User attempts fetch:', userAttemptsResponse.error);
        }
        if (allAttemptsResponse?.error) {
          console.warn('Attempt counts fetch:', allAttemptsResponse.error);
        }

        // Get test IDs for current category
        const currentCategoryTestIds = new Set(testsWithDetails.map(test => test.id));

        // Filter attempts to only include those for tests in current category
        const filteredUserAttempts = (userAttemptsResponse.data || []).filter(attempt => 
          currentCategoryTestIds.has(attempt.test_id)
        );
        const filteredAllAttempts = (allAttemptsResponse.data || []).filter(attempt => 
          currentCategoryTestIds.has(attempt.test_id)
        );

        // Process data efficiently with null checks
        const attemptCounts = filteredAllAttempts.reduce((acc, attempt) => {
          if (attempt?.test_id) {
            acc[attempt.test_id] = (acc[attempt.test_id] || 0) + 1;
          }
          return acc;
        }, {});

        const userBestScores = filteredUserAttempts.reduce((acc, attempt) => {
          if (attempt?.test_id) {
            const score = sanitizeData(attempt.percentage || attempt.score, 'number', 0);
            // Store the score if it's the first attempt for this test, or if it's better than the current best
            if (acc[attempt.test_id] === undefined || score > acc[attempt.test_id]) {
              acc[attempt.test_id] = score;
            }
          }
          return acc;
        }, {});

        const userLatestAttempts = filteredUserAttempts.reduce((acc, attempt) => {
          if (attempt?.test_id && attempt?.id) {
            // Since we ordered by submitted_at desc, the first occurrence is the latest
            if (!acc[attempt.test_id]) {
              acc[attempt.test_id] = attempt.id;
            }
          }
          return acc;
        }, {});

        // Create a set of all attempted test IDs (regardless of score)
        const attemptedTestIds = new Set(filteredUserAttempts.map(attempt => attempt.test_id));

        const inProgressMap = {};
        if (testIdsArr.length > 0) {
          try {
            let inProgressQuery = await supabase
              .from('user_test_attempts')
              .select(
                'id, test_id, attempted_questions, current_question_index, total_questions, time_spent, started_at'
              )
              .eq('user_email', userEmail)
              .eq('is_completed', false)
              .in('test_id', testIdsArr);

            if (
              inProgressQuery.error &&
              (inProgressQuery.error.code === 'PGRST204' ||
                /time_spent|current_question_index/i.test(inProgressQuery.error.message || ''))
            ) {
              inProgressQuery = await supabase
                .from('user_test_attempts')
                .select('id, test_id, attempted_questions, total_questions, started_at')
                .eq('user_email', userEmail)
                .eq('is_completed', false)
                .in('test_id', testIdsArr);
            }

            (inProgressQuery.data || []).forEach((row) => {
              if (row?.test_id) inProgressMap[row.test_id] = row;
            });
          } catch (inProgressErr) {
            console.warn('In-progress attempts fetch:', inProgressErr);
          }
        }
        setInProgressByTestId(inProgressMap);

        testsWithDetails = testsWithDetails.map((test) => ({
          ...test,
          attemptCount: attemptCounts[test.id] || 0,
          userBestScore: userBestScores[test.id] || null,
          userCompleted: attemptedTestIds.has(test.id),
          userLatestAttemptId: userLatestAttempts[test.id] || null,
          userInProgress: Boolean(inProgressMap[test.id]),
          userInProgressAttempt: inProgressMap[test.id] || null,
        }));
      } else {
        setInProgressByTestId({});
      }

      setTests(testsWithDetails);
    } catch (error) {
      console.error('Error fetching tests:', error);
      const detail = error?.message || error?.details || '';
      toast.error(detail ? `Failed to load tests: ${detail}` : 'Failed to load tests');
      setTests([]);
    }
  }, [userEmail, examcategory]);

  const fetchOptimizedUserStats = useCallback(async () => {
    if (!userEmail) return;

    try {
      const categoryVariants = getCategoryVariants(examcategory);
      const { data: rawAttempts, error: allAttemptsError } = await supabase
        .from('user_test_attempts')
        .select('id, test_id, score, percentage, duration_taken, attempted_questions, correct_answers, wrong_answers, unanswered, all_questions, created_at, submitted_at, examcategory')
        .eq('user_email', userEmail)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (allAttemptsError) throw allAttemptsError;

      const allUserAttempts = (rawAttempts || []).filter((a) => {
        if (!a?.examcategory) return false;
        return categoryVariants.some((v) => categoryMatches(a.examcategory, v));
      });

      if (allUserAttempts.length === 0) {
        setUserStats({
          completedTests: 0,
          averageScore: 0,
          totalStudyTime: 0,
          bestScore: 0,
          recentAttempts: [],
          totalQuestions: 0,
          improvement: 0,
          streak: 0
        });
        setExamTrackerStats({
          totalAttempts: 0,
          averageAccuracy: 0,
          totalTimeSpent: 0,
          questionsAttempted: 0,
          subjectWisePerformance: [],
          recentAttempts: [],
          strongestSubject: '',
          weakestSubject: '',
          overallStats: null
        });
        return;
      }

      // Get test names efficiently with null check
      const testIds = [...new Set(allUserAttempts.map((a) => a?.test_id).filter(Boolean))];
      const { data: mockTests } = await supabase
        .from('mock_tests')
        .select('id, name')
        .in('id', testIds);

      const testNameLookup = (mockTests || []).reduce((acc, test) => {
        if (test?.id && test?.name) {
          acc[test.id] = test.name;
        }
        return acc;
      }, {});

      // Calculate stats efficiently with null checks
      const totalAttempts = allUserAttempts.length;
      const uniqueTests = testIds.length;
      
      const scores = allUserAttempts.map((attempt) =>
        sanitizeData(attempt?.percentage ?? attempt?.score, 'number', 0)
      );
      
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      
      const totalStudyTimeSeconds = allUserAttempts.reduce(
        (sum, attempt) => sum + durationTakenToSeconds(attempt?.duration_taken),
        0
      );
      
      const totalQuestionsFromAttempts = allUserAttempts.reduce((sum, attempt) => 
        sum + sanitizeData(attempt?.attempted_questions, 'number', 0), 0
      );

      // Optimized subject analysis with error handling
      const { subjectWisePerformance, overallStats } = analyzeSubjectPerformance(
        allUserAttempts, 
        testNameLookup
      );

      // Calculate improvement with null checks
      const halfPoint = Math.floor(allUserAttempts.length / 2);
      const recentHalf = allUserAttempts.slice(0, halfPoint);
      const olderHalf = allUserAttempts.slice(halfPoint);
      
      const recentAvg = recentHalf.length > 0 ? 
        recentHalf.reduce((sum, a) => sum + sanitizeData(a?.percentage || a?.score, 'number', 0), 0) / recentHalf.length : 0;
      const olderAvg = olderHalf.length > 0 ? 
        olderHalf.reduce((sum, a) => sum + sanitizeData(a?.percentage || a?.score, 'number', 0), 0) / olderHalf.length : 0;
      const improvement = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

      const streak = computeConsecutiveDayStreak(
        allUserAttempts.map((a) => a?.submitted_at || a?.created_at).filter(Boolean)
      );

      // Add test names to attempts with null checks
      const attemptsWithNames = allUserAttempts.map(attempt => ({
        ...attempt,
        test_name: testNameLookup[attempt?.test_id] || `Test #${attempt?.test_id?.slice(0,8) || 'Unknown'}`,
        score: sanitizeData(attempt?.score, 'number', 0),
        percentage: sanitizeData(attempt?.percentage, 'number', 0)
      }));

      // Set final stats
      setUserStats({
        completedTests: uniqueTests,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore: Math.round(bestScore * 100) / 100,
        totalStudyTime: Math.round((totalStudyTimeSeconds / 3600) * 10) / 10,
        recentAttempts: attemptsWithNames.slice(0, 3),
        totalQuestions: totalQuestionsFromAttempts,
        improvement: Math.round(improvement),
        streak
      });

      setExamTrackerStats({
        totalAttempts,
        averageAccuracy: overallStats?.overallAccuracy || 0,
        totalTimeSpent: Math.round(totalStudyTimeSeconds / 60),
        questionsAttempted: overallStats?.totalAttempted || 0,
        subjectWisePerformance,
        recentAttempts: attemptsWithNames.slice(0, 8),
        strongestSubject: subjectWisePerformance.length > 0 ? subjectWisePerformance[0].subject : '',
        weakestSubject: subjectWisePerformance.length > 0 ? subjectWisePerformance[subjectWisePerformance.length - 1].subject : '',
        overallStats
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load performance data');
    }
  }, [userEmail, examcategory]);

  // Fetch after auth is resolved; avoid refetch when only the user object reference changes
  useEffect(() => {
    if (authLoading || !examcategory) return;

    const loadKey = `${examcategory}::${userEmail || 'guest'}`;
    const isFirstLoad = dataLoadedForRef.current !== loadKey;
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      if (isFirstLoad) setIsLoading(true);

      try {
        await fetchAvailableTests();
        if (userEmail && isMounted) {
          await fetchOptimizedUserStats();
        } else if (isMounted) {
          setUserStats({
            completedTests: 0,
            averageScore: 0,
            totalStudyTime: 0,
            bestScore: 0,
            recentAttempts: [],
            totalQuestions: 0,
            improvement: 0,
            streak: 0,
          });
          setExamTrackerStats({
            totalAttempts: 0,
            averageAccuracy: 0,
            totalTimeSpent: 0,
            questionsAttempted: 0,
            subjectWisePerformance: [],
            recentAttempts: [],
            strongestSubject: '',
            weakestSubject: '',
            overallStats: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching data:', error);
          toast.error('Failed to load dashboard');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          dataLoadedForRef.current = loadKey;
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, examcategory, userEmail, fetchAvailableTests, fetchOptimizedUserStats]);

  // Memoized event handlers
  const handleStartTest = useCallback(
    (test) => {
      if (!test?.id) return;
      const attemptUrl = `/mock-test/${examcategory}/attempt/${test.id}`;
      if (!user) {
        router.push(`/sign-in?redirect=${encodeURIComponent(attemptUrl)}`);
        toast.success('Sign in to continue');
        return;
      }
      if (test.userInProgress) {
        router.push(attemptUrl);
        return;
      }
      setPreflight({ open: true, test, isRetake: false });
    },
    [router, examcategory, user]
  );

  const handleViewResults = useCallback((test) => {
    if (!test?.userLatestAttemptId) return;
    const resultsUrl = `/mock-test/${examcategory}/results/${test.userLatestAttemptId}`;
    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(resultsUrl)}`);
      return;
    }
    router.push(resultsUrl);
  }, [router, examcategory, user]);

  const handleRetakeTest = useCallback(
    (test) => {
      if (!test?.id) return;
      const attemptUrl = `/mock-test/${examcategory}/attempt/${test.id}`;
      if (!user) {
        router.push(`/sign-in?redirect=${encodeURIComponent(attemptUrl)}`);
        return;
      }
      setPreflight({ open: true, test, isRetake: true });
    },
    [router, examcategory, user]
  );

  const confirmPreflight = useCallback(() => {
    const test = preflight.test;
    if (!test?.id) return;
    setPreflight({ open: false, test: null, isRetake: false });
    router.push(`/mock-test/${examcategory}/attempt/${test.id}`);
  }, [preflight.test, router, examcategory]);

  const closePreflight = useCallback(() => {
    setPreflight({ open: false, test: null, isRetake: false });
  }, []);

  const resumeEntry = useMemo(() => {
    const testId = Object.keys(inProgressByTestId)[0];
    if (!testId) return null;
    const test = tests.find((t) => t.id === testId);
    const attempt = inProgressByTestId[testId];
    return test && attempt ? { test, attempt } : null;
  }, [inProgressByTestId, tests]);

  const testsForActiveTab = useMemo(() => {
    if (activeTab !== 'tests') return tests;
    if (testTypeFilter === 'topic') return tests.filter(isTopicWiseTest);
    if (testTypeFilter === 'full') return tests.filter((t) => !isTopicWiseTest(t));
    return tests;
  }, [tests, activeTab, testTypeFilter]);

  const testTypeCounts = useMemo(() => ({
    all: tests.length,
    full: tests.filter((t) => !isTopicWiseTest(t)).length,
    topic: tests.filter(isTopicWiseTest).length,
  }), [tests]);

  // Highly optimized filtered and paginated tests
  const { filteredTests, paginatedTests, totalPages } = useMemo(() => {
    const filtered = testsForActiveTab.filter((test) => {
      if (!test) return false;

      const matchesSearch =
        !searchTerm ||
        test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === 'all' || test.difficulty?.toLowerCase() === difficultyFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'new' && !test.userCompleted && !test.userInProgress) ||
        (statusFilter === 'completed' && test.userCompleted) ||
        (statusFilter === 'in-progress' && test.userInProgress);

      return matchesSearch && matchesDifficulty && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'questions':
          return (b.total_questions || 0) - (a.total_questions || 0);
        case 'newest':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    const totalPages = Math.ceil(sorted.length / testsPerPage);
    const startIndex = (currentPage - 1) * testsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + testsPerPage);

    return { filteredTests: sorted, paginatedTests: paginated, totalPages };
  }, [
    testsForActiveTab,
    searchTerm,
    difficultyFilter,
    statusFilter,
    sortBy,
    currentPage,
    testsPerPage,
  ]);

  const openProgressTab = useCallback(() => {
    setActiveTab('progress');
    router.replace(`/mock-test/${examcategory}?tab=progress`);
  }, [router, examcategory]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    router.replace(`/mock-test/${examcategory}?tab=${tabId}`, { scroll: false });
  }, [router, examcategory]);

  const handleTestTypeChange = useCallback((typeId) => {
    setTestTypeFilter(typeId);
    setCurrentPage(1);
    const p = new URLSearchParams();
    p.set('tab', 'tests');
    if (typeId !== 'all') p.set('type', typeId);
    router.replace(`/mock-test/${examcategory}?${p.toString()}`, { scroll: false });
  }, [router, examcategory]);

  const signInHref = useMemo(
    () => `/sign-in?redirect=${encodeURIComponent(`/mock-test/${examcategory || 'gate-cse'}${activeTab && activeTab !== 'tests' ? `?tab=${activeTab}` : ''}`)}`,
    [examcategory, activeTab]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tests':
        return (
          <div>
            {user ? (
              <MockTestStatsStrip
                userStats={userStats}
                examTrackerStats={examTrackerStats}
                examcategory={examcategory}
                onOpenProgress={openProgressTab}
              />
            ) : (
              <MockTestGuestHero
                testsCount={tests.length}
                totalQuestions={tests.reduce((sum, t) => sum + (t.total_questions || 0), 0)}
                signInHref={signInHref}
              />
            )}

            <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900">Available tests</h3>
                <p className="text-sm text-neutral-500 mt-0.5">Full mock and topic-wise tests</p>
              </div>

              <TestListToolbar
                onSearchChange={debouncedSearch}
                difficultyFilter={difficultyFilter}
                onDifficultyChange={(v) => {
                  setDifficultyFilter(v);
                  setCurrentPage(1);
                }}
                statusFilter={statusFilter}
                onStatusChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
                sortBy={sortBy}
                onSortChange={(v) => {
                  setSortBy(v);
                  setCurrentPage(1);
                }}
              />

              <div className="px-4 sm:px-6 pt-4">
                <MockTestTypeSegment
                  value={testTypeFilter}
                  onChange={handleTestTypeChange}
                  counts={testTypeCounts}
                />
              </div>

              <div className="p-4 sm:p-6 pt-0">
                {filteredTests.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="bg-emerald-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">
                      {searchTerm || difficultyFilter !== 'all' ? 'No tests found' : 'No tests available'}
                    </h3>
                    <p className="text-neutral-500 mb-6 text-sm">
                      {searchTerm || difficultyFilter !== 'all'
                        ? 'Try adjusting search or filters.'
                        : testTypeFilter === 'topic'
                          ? 'Topic-wise tests will appear here when published.'
                          : 'New tests will appear here soon.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedTests.map((test) => (
                      <MockTestCard
                        key={test.id}
                        test={test}
                        onStartTest={handleStartTest}
                        onViewResults={handleViewResults}
                        onRetakeTest={handleRetakeTest}
                        examcategory={examcategory}
                        user={user}
                      />
                    ))}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'rank':
        return <LeaderboardPanel examcategory={examcategory} user={user} />;

      case 'progress':
        return (
          <MyProgressTab
            examTrackerStats={examTrackerStats}
            userStats={userStats}
            examcategory={examcategory}
          />
        );

      default:
        return null;
    }
  };

  if (authLoading) {
    return <MockTestHubSkeleton />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <MockTestHubHeader
          examcategory={examcategory}
          categoryLabel={categoryLabel}
          testsCount={tests.length}
          streak={user ? userStats.streak : 0}
          profileDisplayName={profileDisplayName}
        />

        {user && resumeEntry && (
          <ResumeTestBanner
            attempt={resumeEntry.attempt}
            test={resumeEntry.test}
            examcategory={examcategory}
          />
        )}

        <MockTestHubTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAuthenticated={!!user}
        />

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 bg-white border border-neutral-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <Suspense fallback={<div className="text-center py-12 text-neutral-500">Loading...</div>}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderTabContent()}
            </motion.div>
          </Suspense>
        )}
      </div>

      <PreflightModal
        test={preflight.test}
        examcategory={examcategory}
        open={preflight.open}
        isRetake={preflight.isRetake}
        onClose={closePreflight}
        onConfirm={confirmPreflight}
      />
    </div>
  );
}

export default function MockTestCategoryPage() {
  return (
    <Suspense fallback={<MockTestHubSkeleton />}>
      <OptimizedMockTestDashboard />
    </Suspense>
  );
}
