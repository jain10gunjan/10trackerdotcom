"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  categoryMatches,
  formatDurationShort,
  formatDurationLong,
  usesGateMarking,
} from '@/lib/mockTestUtils';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  Clock,
  BookOpen,
  ArrowLeft,
  BarChart3,
  Target
} from "lucide-react";
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import MetaDataJobs from '@/components/Seo';
import MockTestBreadcrumb from '@/components/mock-test/MockTestBreadcrumb';
import ShareResultsCard from '@/components/mock-test/ShareResultsCard';
import TestRankSummary from '@/components/mock-test/TestRankSummary';

// MathJax 3 config (same as attempt page) so $...$ and $$...$$ are processed
const MATHJAX_CONFIG = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
  messageStyle: 'none',
  showMathMenu: false,
};

// Normalize LaTeX: [latex]...[/latex] → $...$ for MathJax
function convertLatexTags(text) {
  if (!text) return text;
  return String(text)
    .replace(/\[latex\]/g, '$')
    .replace(/\[\/latex\]/g, '$');
}

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Renders HTML and triggers MathJax typeset so $...$ and $$...$$ are processed (wrapper + manual typeset for dynamic HTML)
const MathHtml = React.memo(function MathHtml({ html, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);

  const normalizedHtml = useMemo(() => convertLatexTags(html), [html]);

  useEffect(() => {
    if (!ref.current || !normalizedHtml || typeof window === 'undefined') return;
    const node = ref.current;
    const id = setTimeout(() => {
      if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        window.MathJax.typesetPromise([node]).catch(() => {});
      }
    }, 50);
    return () => clearTimeout(id);
  }, [normalizedHtml]);

  if (!normalizedHtml) return null;
  return (
    <MathJax inline dynamic>
      <Tag ref={ref} className={className} dangerouslySetInnerHTML={{ __html: normalizedHtml }} />
    </MathJax>
  );
});

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: BarChart3 },
  { key: 'correct', label: 'Correct', icon: CheckCircle },
  { key: 'incorrect', label: 'Incorrect', icon: XCircle },
  { key: 'unanswered', label: 'Skipped', icon: AlertCircle }
];

export default function TestResultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { instanceid: attemptId, examcategory } = useParams();
  const isBackupMode = searchParams.get('backup') === 'true';

  const userEmail = useMemo(
    () =>
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      user?.email ||
      null,
    [user]
  );
  const categoryLabel = useMemo(
    () => (examcategory?.toUpperCase?.() || 'GATE CSE').replace(/-/g, ' '),
    [examcategory]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [topicBreakdown, setTopicBreakdown] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [enhancedQuestions, setEnhancedQuestions] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  const fetchAttemptDetails = useCallback(async () => {
    if (!attemptId || !userEmail) return;
    const startTime = Date.now();
    try {
      setIsLoading(true);
      const { data: attemptData, error: attemptError } = await fetchAttemptData(attemptId, userEmail);
      if (attemptError || !attemptData) {
        toast.error('Test attempt not found or unauthorized');
        router.push(`/mock-test/${examcategory}?tab=progress`);
        return;
      }
      if (
        attemptData.mock_tests?.category &&
        !categoryMatches(attemptData.mock_tests.category, examcategory)
      ) {
        toast.error('This result does not match the selected exam category');
        router.push(`/mock-test/${examcategory}?tab=progress`);
        return;
      }

      setAttempt(attemptData);
      setTestInfo(attemptData.mock_tests);

      const backupKey = `test_backup_${attemptId}`;
      if (isBackupMode && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(backupKey);
          if (raw?.trim()) {
            let backup;
            try {
              backup = JSON.parse(raw);
            } catch {
              backup = null;
            }
            if (!backup) {
              /* ignore corrupt backup */
            } else {
            toast('Showing locally backed-up answers (submission may be incomplete)', {
              icon: '⚠️',
              duration: 6000,
            });
            if (backup.stats) {
              setAttempt((prev) =>
                prev
                  ? {
                      ...prev,
                      score: backup.stats.score ?? prev.score,
                      percentage: backup.stats.percentage ?? prev.percentage,
                      correct_answers: backup.stats.correct ?? prev.correct_answers,
                      wrong_answers: backup.stats.incorrect ?? prev.wrong_answers,
                      unanswered: backup.stats.skipped ?? prev.unanswered,
                    }
                  : prev
              );
            }
            }
          }
        } catch (e) {
          console.warn('Could not read local backup', e);
        }
      }

      const questionIds = (attemptData.all_questions || []).map((q) => q.id).filter(Boolean);
      if (questionIds.length === 0) {
        toast.error('No questions found in this test attempt');
        setIsLoading(false);
        return;
      }

      const { data: questionsData, error: questionsError } = await fetchQuestionsData(questionIds);
      if (questionsError) {
        setIsLoading(false);
        return;
      }

      const { questionsMap, answersMap } = buildMaps(questionsData, attemptData.answers);
      const { breakdown, enhancedQuestions: enhanced } = buildBreakdown(
        attemptData.all_questions || [],
        questionsMap,
        answersMap
      );
      setTopicBreakdown(breakdown);
      setEnhancedQuestions(enhanced);

      if (startTime) {
        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development' && duration > 500) {
          console.warn(`Fetch completed in ${duration}ms`);
        }
      }
    } catch (err) {
      console.error('Error in fetchAttemptDetails:', err);
      toast.error('Failed to load test results');
      router.push(`/mock-test/${examcategory}?tab=progress`);
    } finally {
      setIsLoading(false);
    }
  }, [attemptId, userEmail, examcategory, router, isBackupMode]);

  useEffect(() => {
    if (authLoading) return;
    if (attemptId && userEmail) fetchAttemptDetails();
  }, [authLoading, attemptId, userEmail, fetchAttemptDetails]);

  // --- Helpers ---
  const fetchAttemptData = async (attemptId, userEmail) => {
    return supabase
      .from("user_test_attempts")
      .select(`
        id,
        test_id,
        user_email,
        started_at,
        submitted_at,
        duration_taken,
        total_questions,
        attempted_questions,
        correct_answers,
        wrong_answers,
        unanswered,
        score,
        percentage,
        is_completed,
        answers,
        all_questions,
        quick_stats,
        final_stats,
        mock_tests (
          name,
          duration,
          difficulty,
          category
        )
      `)
      .eq("id", attemptId)
      .eq("user_email", userEmail)
      .eq("is_completed", true)
      .single();
  };

  const fetchQuestionsData = async (questionIds) => {
    return supabase
      .from("examtracker")
      .select(`
        _id,
        topic,
        category,
        difficulty,
        year,
        subject,
        question,
        options_A,
        options_B,
        options_C,
        options_D,
        correct_option,
        solution,
        questionCode,
        questionImage,
        solutiontext,
        topicList,
        topic_list
      `)
      .in("_id", questionIds);
  };

  const buildMaps = (questionsData, answers) => {
    const questionsMap = new Map();
    const answersMap = new Map();

    questionsData?.forEach((q) => questionsMap.set(q._id, q));
    answers?.forEach((a) => answersMap.set(a.questionId, a));

    return { questionsMap, answersMap };
  };

  const buildBreakdown = (allQuestions, questionsMap, answersMap) => {
    const breakdown = {};
    const enhancedQuestions = [];

    allQuestions.forEach((q, idx) => {
      const fullQ = questionsMap.get(q.id);
      const ans = answersMap.get(q.id);

      const topic =
        fullQ?.topic || fullQ?.subject || q.topic || q.subject || "General";

      if (!breakdown[topic]) {
        breakdown[topic] = {
          correct: [],
          incorrect: [],
          unanswered: [],
          timeSpent: 0,
          totalQuestions: 0,
          subject: fullQ?.subject || q.subject || topic,
          difficulty: fullQ?.difficulty || q.difficulty || "medium",
        };
      }

      const enriched = {
        ...q,
        ...fullQ,
        question_order: idx + 1,
        userAnswer: ans?.userAnswer ?? "",
        correctAnswer: fullQ?.correct_option || q.correct_option,
        isCorrect: ans?.isCorrect ?? false,
        timeSpent: ans?.timeSpent ?? 0,
        isAttempted: Boolean(ans?.userAnswer),
        isMarkedForReview: ans?.isMarkedForReview ?? false,
        hasFullData: !!fullQ,
        questionText: fullQ?.question || q.question || "Question text not available",
        options: fullQ
          ? { A: fullQ.options_A, B: fullQ.options_B, C: fullQ.options_C, D: fullQ.options_D }
          : (q.options || {}),
        solution: fullQ?.solution || q.solution,
        solutionText: fullQ?.solutiontext || q.solutiontext,
        questionImage: fullQ?.questionImage,
        questionCode: fullQ?.questionCode,
        topicList: fullQ?.topic_list || fullQ?.topicList || [],
        category: fullQ?.category || q.category,
        year: fullQ?.year || q.year,
        difficulty: fullQ?.difficulty || q.difficulty || "medium",
      };

      enhancedQuestions.push(enriched);

      breakdown[topic].totalQuestions++;
      if (enriched.isAttempted) {
        enriched.isCorrect
          ? breakdown[topic].correct.push(enriched)
          : breakdown[topic].incorrect.push(enriched);
      } else {
        breakdown[topic].unanswered.push(enriched);
      }
      breakdown[topic].timeSpent += enriched.timeSpent;
    });

    // add stats
    Object.values(breakdown).forEach((topicData) => {
      const attempted = topicData.correct.length + topicData.incorrect.length;
      topicData.accuracy =
        topicData.totalQuestions > 0
          ? Math.round((topicData.correct.length / (attempted || 1)) * 100)
          : 0;
      topicData.attemptedCount = attempted;
      topicData.averageTime = attempted > 0
        ? Math.round(topicData.timeSpent / attempted)
        : 0;
    });

    return { breakdown, enhancedQuestions };
  };

  const getAccuracyColor = useCallback((accuracy) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-amber-600';
    if (accuracy >= 40) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const toggleTopic = useCallback((topic) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  }, []);

  const filteredQuestions = useMemo(() => {
    return Object.entries(topicBreakdown).reduce((acc, [topic, data]) => {
      if (activeTab === 'all') acc[topic] = data;
      else if (activeTab === 'correct') acc[topic] = { ...data, incorrect: [], unanswered: [] };
      else if (activeTab === 'incorrect') acc[topic] = { ...data, correct: [], unanswered: [] };
      else if (activeTab === 'unanswered') acc[topic] = { ...data, correct: [], incorrect: [] };
      return acc;
    }, {});
  }, [topicBreakdown, activeTab]);

  // Show loading until auth is resolved; then show loading again while fetching data (never flash "Sign in required" first)
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-xs px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-neutral-200 rounded-full animate-spin border-t-neutral-700 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-neutral-600 font-medium">Checking sign-in...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md w-full">
            <BookOpen className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Sign in required</h2>
            <p className="text-neutral-600 text-sm sm:text-base">Sign in to view test results.</p>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-xs px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-neutral-200 rounded-full animate-spin border-t-neutral-700 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-neutral-600 font-medium">Loading results...</p>
          </div>
        </div>
      </>
    );
  }

  if (!attempt || !testInfo) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md w-full">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Attempt not found</h2>
            <p className="text-neutral-600 text-sm sm:text-base mb-4">The requested test attempt could not be found.</p>
            <Link
              href={`/mock-test/${examcategory}?tab=progress`}
              className="inline-flex items-center gap-2 text-neutral-800 font-medium hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back to results
            </Link>
          </div>
        </div>
      </>
    );
  }

  const testName = testInfo?.name || 'Test result';
  const gateMarking =
    attempt?.quick_stats?.markingScheme === 'gate' ||
    attempt?.final_stats?.markingScheme === 'gate' ||
    usesGateMarking(examcategory);
  const netMarks =
    attempt?.quick_stats?.netMarks ??
    attempt?.final_stats?.netMarks ??
    attempt?.score;
  const maxMarks =
    attempt?.quick_stats?.maxMarks ??
    attempt?.final_stats?.maxMarks ??
    attempt?.total_questions;

  return (
    <>
      <MetaDataJobs
        seoTitle={`${testName} - ${categoryLabel} Results`}
        seoDescription={`View your ${testName} result and topic-wise breakdown.`}
      />
      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">
        <MathJaxContext config={MATHJAX_CONFIG}>
          <div className="pt-24 max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
            {/* Back link */}
            <Link
              href={`/mock-test/${examcategory}?tab=progress`}
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 mb-4 sm:mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to results
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-4 sm:mb-6 overflow-hidden">
              <div className="p-4 sm:p-6">
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-2 sm:mb-3">{testName}</h1>
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                  <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                    {testInfo.category || categoryLabel}
                  </span>
                  <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                    {testInfo.difficulty || '—'}
                  </span>
                  {gateMarking ? (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-medium">
                      GATE +1 / −⅓
                    </span>
                  ) : null}
                </div>
                <div className="mb-4 sm:mb-6 p-4 rounded-xl bg-neutral-900 text-white">
                  <p className="text-xs text-neutral-300 uppercase tracking-wide mb-1">Overall</p>
                  {gateMarking ? (
                    <p className="text-2xl sm:text-3xl font-bold">
                      {netMarks} <span className="text-lg font-medium text-neutral-300">/ {maxMarks} marks</span>
                      <span className="block text-sm font-normal text-neutral-400 mt-1">
                        ({attempt.percentage}% of max)
                      </span>
                    </p>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-bold">{attempt.percentage}%</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                      <span className="text-lg sm:text-2xl font-bold text-green-900">{attempt.correct_answers}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-green-700">Correct</div>
                  </div>
                  <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                      <span className="text-lg sm:text-2xl font-bold text-red-900">{attempt.wrong_answers}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-red-700">Incorrect</div>
                  </div>
                  <div className="bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                      <span className="text-lg sm:text-2xl font-bold text-amber-900">{attempt.unanswered}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-amber-700">Skipped</div>
                  </div>
                  <div className="bg-neutral-50 p-3 sm:p-4 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-1">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 flex-shrink-0" />
                      <span className="text-lg sm:text-2xl font-bold text-neutral-900">
                        {formatDurationShort(attempt.duration_taken)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-neutral-700">Time</div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  <TestRankSummary
                    examcategory={examcategory}
                    testId={attempt.test_id}
                    user={user}
                    testName={testName}
                  />
                  <ShareResultsCard
                    testName={testName}
                    scoreLabel={gateMarking ? `${netMarks}/${maxMarks} marks` : `${attempt.percentage}%`}
                    percentage={attempt.percentage}
                    examcategory={examcategory}
                    attemptId={attemptId}
                  />
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neutral-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-600">
                    <div>
                      <span className="font-medium text-neutral-500">Started</span>
                      <div className="text-neutral-800">{new Date(attempt.started_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-500">Submitted</span>
                      <div className="text-neutral-800">{new Date(attempt.submitted_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-500">Questions</span>
                      <div className="text-neutral-800">{attempt.attempted_questions}/{attempt.total_questions}</div>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-500">Duration</span>
                      <div className="text-neutral-800">{formatDurationLong(attempt.duration_taken)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-4 sm:mb-6 overflow-hidden">
              <div className="p-1 sm:p-2 flex overflow-x-auto scrollbar-hide gap-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="space-y-3 sm:space-y-4">
              {Object.keys(filteredQuestions).length === 0 ? (
                <div className="text-center py-10 sm:py-12 px-4 bg-white rounded-xl shadow-sm border border-neutral-200">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 text-sm sm:text-base">No questions for this filter.</p>
                </div>
              ) : (
                Object.entries(filteredQuestions).map(([topic, data]) => {
                  const total = data.correct.length + data.incorrect.length + data.unanswered.length;
                  if (total === 0) return null;
                  const accuracy = total > 0 ? (data.correct.length / total) * 100 : 0;
                  const isExpanded = expandedTopics[topic];

                  return (
                    <div key={topic} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 text-left cursor-pointer hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-inset"
                        onClick={() => toggleTopic(topic)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <div className="w-1 h-6 sm:h-8 bg-neutral-400 rounded-full flex-shrink-0" />
                              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">{topic}</h3>
                              <span className={`font-semibold text-sm sm:text-base flex-shrink-0 ${getAccuracyColor(accuracy)}`}>
                                {accuracy.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                              <span className="flex items-center gap-1.5 text-green-700">
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                                {data.correct.length} correct
                              </span>
                              <span className="flex items-center gap-1.5 text-red-700">
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                {data.incorrect.length} incorrect
                              </span>
                              <span className="flex items-center gap-1.5 text-amber-700">
                                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                {data.unanswered.length} skipped
                              </span>
                              <span className="flex items-center gap-1.5 text-neutral-600">
                                <Clock className="w-3 h-3" />
                                {Math.floor(data.timeSpent / 60)}m {data.timeSpent % 60}s
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-neutral-200">
                          <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                            {/* Correct Questions */}
                            {data.correct.length > 0 && (
                              <QuestionSection
                                title="Correct Answers"
                                questions={data.correct}
                                type="correct"
                                icon={CheckCircle}
                                bgColor="bg-green-50"
                                borderColor="border-green-200"
                                textColor="text-green-700"
                              />
                            )}

                            {/* Incorrect Questions */}
                            {data.incorrect.length > 0 && (
                              <QuestionSection
                                title="Incorrect Answers"
                                questions={data.incorrect}
                                type="incorrect"
                                icon={XCircle}
                                bgColor="bg-red-50"
                                borderColor="border-red-200"
                                textColor="text-red-700"
                              />
                            )}

                            {/* Unanswered Questions */}
                            {data.unanswered.length > 0 && (
                              <QuestionSection
                                title="Skipped Questions"
                                questions={data.unanswered}
                                type="unanswered"
                                icon={AlertCircle}
                                bgColor="bg-yellow-50"
                                borderColor="border-yellow-200"
                                textColor="text-yellow-700"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

             
          </div>

</MathJaxContext>
      </div>
    </>
  );
}

// Question Section Component — memoized; question/options/solution wrapped in MathJax for LaTeX
const QuestionSection = React.memo(function QuestionSection({ title, questions, type, icon: Icon, bgColor, borderColor, textColor }) {
  const getOptionHtml = useCallback((q, option) => {
    const key = `options_${option}`;
    if (q[key]) return q[key];
    if (q.options && typeof q.options[option] !== 'undefined') return q.options[option];
    return '';
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          <Icon className="w-4 h-4 text-current" />
        </div>
        <h4 className={`font-semibold text-sm sm:text-base ${textColor}`}>{title}</h4>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {questions.map((q, index) => {
          const questionHtml = q.questionText || q.question || '';
          const explanationHtml = q.solutionText || q.solutiontext || q.solution || '';
          return (
            <div key={q.question_order ?? index} className={`${bgColor} p-3 sm:p-4 rounded-lg border ${borderColor}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                <span className={`${bgColor.replace('50', '100')} ${textColor} px-2 py-0.5 rounded-full text-xs font-bold`}>
                  Q{q.question_order}
                </span>
                <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full text-xs">
                  {q.difficulty}
                </span>
                <span className="ml-auto text-xs text-neutral-600 font-medium">
                  {type === 'correct' ? '✓' : type === 'incorrect' ? '✗' : '—'} {q.timeSpent}s
                </span>
              </div>
              <MathHtml html={questionHtml} className="mb-2 sm:mb-3 text-neutral-800 text-sm sm:text-base prose prose-neutral max-w-none" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 sm:mb-3 text-xs sm:text-sm">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optHtml = getOptionHtml(q, opt) || '—';
                  return (
                    <div key={opt} className="p-2 bg-white rounded border border-neutral-200">
                      <strong>{opt}:</strong>{' '}
                      <MathHtml html={optHtml} as="span" />
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                {type === 'incorrect' && (
                  <>
                    <span className="text-red-700 font-semibold">Your: {q.userAnswer}</span>
                    <span className="text-green-700 font-semibold">Correct: {q.correctAnswer || '—'}</span>
                  </>
                )}
                {type === 'correct' && (
                  <>
                    <span className="text-green-700 font-semibold">Your answer: {q.userAnswer || '—'}</span>
                    <span className="text-neutral-700 font-semibold">Correct option: {q.correctAnswer || '—'}</span>
                  </>
                )}
                {type === 'unanswered' && <span className="text-green-700 font-semibold">Correct: {q.correctAnswer || '—'}</span>}
              </div>

              {explanationHtml && (
                <div className="mt-3 sm:mt-4 border-t border-neutral-200 pt-3">
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
                    Solution / Explanation
                  </p>
                  <MathHtml
                    html={explanationHtml}
                    className="text-neutral-800 text-sm sm:text-base overflow-x-auto"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});