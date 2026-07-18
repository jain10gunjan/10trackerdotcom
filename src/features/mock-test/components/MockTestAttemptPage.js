"use client";
import React, { 
  useState, 
  useReducer, 
  useEffect, 
  useCallback, 
  useMemo,
  memo,
  lazy,
  Suspense,
  useRef
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { consumeCreditOnClient } from '@/features/credits/lib/consumeCreditClient';
import { createClient } from "@supabase/supabase-js";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  Clock, ChevronRight, ChevronLeft, BookOpen, LineChart, AlertTriangle,
  CheckCircle, XCircle, Flag, Timer, Trophy, Target, Menu, X, Play,
  BarChart3, Zap, Brain, Star, Award, TrendingUp, Save, SkipForward,
  RefreshCw, Wifi, WifiOff, Battery, Signal, ArrowLeft, Home,
  Calendar, User, CheckSquare, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { toastPromise } from "@/lib/toastAsync";
import MockTestSubpageHeader from '@/features/mock-test-hub/components/MockTestSubpageHeader';
import {
  categoryMatches,
  isAnswerCorrect,
  getCategoryVariants,
  formatDurationShort,
  calculateMockTestStats,
  usesGateMarking,
} from '@/features/mock-test/lib/mockTestUtils';
import {
  isInlineAnswerQuestion,
  getVisibleMcqOptions,
} from '@/lib/questionAnswerMode';
import InlineAnswerInput from '@/features/practice/components/InlineAnswerInput';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Enhanced utility functions
const sanitizeData = (value, type = 'string', defaultValue = null) => {
  if (value === null || value === undefined) return defaultValue;
  
  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? (defaultValue || 0) : num;
    case 'array':
      return Array.isArray(value) ? value.filter(item => item != null) : (defaultValue || []);
    case 'object':
      return typeof value === 'object' && value !== null ? value : (defaultValue || {});
    case 'boolean':
      return Boolean(value);
    default:
      return String(value).trim();
  }
};

// Enhanced state management with better mobile handling
const initialState = {
  // Core test data
  currentQuestion: null,
  userAnswer: "",
  questionsQueue: [],
  currentQuestionIndex: 0,
  
  // Answer tracking with dual storage
  answerHistory: [],
  answerSummary: {},
  answeredQuestionIds: [],
  markedForReview: [],
  
  // Test state
  testStarted: false,
  testDuration: 0,
  testStartTime: null,

  // Time tracking (seconds)
  timeRemaining: 0,
  totalTime: 0,
  timeSpent: 0,
  
  // Statistics
  questionsAnswered: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  points: 0,
  
  // UI state - Mobile-first
  sidebarOpen: false,
  showQuestionGrid: false,
  showStats: false,
  isOnline: true,
  autoSaveEnabled: true,
  lastSaved: null,
  
  // Mobile-specific
  swipeDirection: null,
  touchStart: null,
  showMobileMenu: false,
  
  // Performance tracking
  questionStartTime: 0,
  navigationHistory: [],
  interactionLog: []
};

const reducer = (state, action) => {
  const newState = { ...state };
  
  switch (action.type) {
    case "LOAD_TEST":
      return { ...newState, ...action.payload };
      
      case "START_TEST":
        return { 
          ...newState, 
          ...action.payload, 
          testStarted: true,
          testStartTime: Date.now(), // Add this
          questionStartTime: Date.now(),
          sidebarOpen: false
        };
      
      
    case "ANSWER_QUESTION":
      const interactionLog = [...state.interactionLog, {
        type: 'answer',
        questionId: state.currentQuestion?.id,
        answer: action.payload.userAnswer,
        timestamp: Date.now(),
        timeSpent: action.payload.timeSpent || 0
      }];
      
      return { 
        ...newState, 
        ...action.payload,
        interactionLog: interactionLog.slice(-100)
      };

    case "SET_USER_ANSWER_DRAFT":
      return { ...newState, userAnswer: action.payload ?? "" };
      
    case "NEXT_QUESTION":
      const navigationLog = [...state.navigationHistory, {
        from: state.currentQuestionIndex,
        to: action.payload.currentQuestionIndex,
        timestamp: Date.now()
      }];
      
      return { 
        ...newState, 
        ...action.payload, 
        timeSpent: 0,
        questionStartTime: Date.now(),
        navigationHistory: navigationLog.slice(-50),
        showQuestionGrid: false,
        sidebarOpen: false
      };
      
    case "UPDATE_TIME": {
      const nowMs = action.payload?.nowMs ?? Date.now();
      const questionStart = sanitizeData(state.questionStartTime, "number", nowMs);
      const timeSpent = Math.max(0, Math.floor((nowMs - questionStart) / 1000));
      return {
        ...newState,
        totalTime: sanitizeData(action.payload?.totalTime, "number", state.totalTime),
        timeRemaining: sanitizeData(action.payload?.timeRemaining, "number", state.timeRemaining),
        timeSpent,
      };
    }
      
    case "MARK_FOR_REVIEW":
      return { ...newState, ...action.payload };
      
    case "TOGGLE_SIDEBAR":
      return { ...newState, sidebarOpen: !state.sidebarOpen };
      
    case "TOGGLE_QUESTION_GRID":
      return { ...newState, showQuestionGrid: !state.showQuestionGrid };
      
    case "TOGGLE_MOBILE_MENU":
      return { ...newState, showMobileMenu: !state.showMobileMenu };
      
    case "UPDATE_CONNECTION":
      return { ...newState, isOnline: action.payload };
      
    case "AUTO_SAVE_SUCCESS":
      return { ...newState, lastSaved: new Date().toISOString() };
      
    case "SET_SWIPE":
      return { ...newState, swipeDirection: action.payload };
      
    case "RESET_TEST":
      return { ...initialState };
      
    default:
      return newState;
  }
};

// Memoized Progress Ring Component
const ProgressRing = memo(({ progress, size = 60, strokeWidth = 4, className = "", showPercentage = true }) => {
  const validProgress = Math.max(0, Math.min(100, sanitizeData(progress, 'number', 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (validProgress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-neutral-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-neutral-700 transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-neutral-700">
            {Math.round(validProgress)}%
          </span>
        </div>
      )}
    </div>
  );
});

ProgressRing.displayName = 'ProgressRing';

// REPLACE your existing TimerDisplay with this self-contained version:
const TimerDisplay = memo(({ 
  testDuration, 
  testStarted, 
  testStartTime,
  onTimeEnd, 
  onTimeWarning,
  onTick,
  className = "" 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(testDuration);
  const onTimeEndRef = useRef(onTimeEnd);
  const onTimeWarningRef = useRef(onTimeWarning);
  const onTickRef = useRef(onTick);

  // Keep latest callbacks without retriggering timer effect
  useEffect(() => {
    onTimeEndRef.current = onTimeEnd;
    onTimeWarningRef.current = onTimeWarning;
    onTickRef.current = onTick;
  }, [onTimeEnd, onTimeWarning, onTick]);

  const formatTime = useCallback((seconds) => {
    const validSeconds = Math.max(0, sanitizeData(seconds, 'number', 0));
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const secs = validSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!testStarted || !testStartTime) {
      setTimeRemaining(testDuration);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - testStartTime) / 1000);
      const remaining = Math.max(0, testDuration - elapsed);
      
      setTimeRemaining(remaining);
      onTickRef.current?.({ timeRemaining: remaining, totalTime: elapsed, nowMs: now });

      // Handle warnings
      if (remaining === 600) {
        onTimeWarningRef.current?.(remaining, '⚠️ 10 minutes left!');
      } else if (remaining === 300) {
        onTimeWarningRef.current?.(remaining, '🚨 5 minutes left!');
      } else if (remaining === 60) {
        onTimeWarningRef.current?.(remaining, '⏰ Final minute!');
      }

      if (remaining === 0) {
        onTimeEndRef.current?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [testStarted, testStartTime, testDuration]);

  const progress = testDuration > 0 ? ((testDuration - timeRemaining) / testDuration) * 100 : 0;
  const isWarning = timeRemaining <= 300;
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ProgressRing 
        progress={progress} 
        size={32} 
        strokeWidth={3} 
        showPercentage={false}
        className={isWarning ? 'text-red-500' : 'text-neutral-600'}
      />
      <div className={`font-mono text-sm md:text-lg font-bold ${
        isWarning ? 'text-red-600' : 'text-neutral-800'
      }`}>
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';


// Mobile Connection Status Component
const ConnectionStatus = memo(({ isOnline, lastSaved }) => (
  <div className="flex items-center space-x-1 text-xs">
    {isOnline ? (
      <Wifi className="h-3 w-3 text-green-500" />
    ) : (
      <WifiOff className="h-3 w-3 text-red-500" />
    )}
    <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
      {isOnline ? 'Online' : 'Offline'}
    </span>
    {lastSaved && (
      <span className="text-neutral-500 hidden sm:inline">
        • Saved {new Date(lastSaved).toLocaleTimeString()}
      </span>
    )}
  </div>
));

ConnectionStatus.displayName = 'ConnectionStatus';

// Mobile-First Question Grid Component
const QuestionGrid = memo(({ 
  questions, 
  currentIndex, 
  answeredIds, 
  markedIds, 
  onNavigate, 
  onClose 
}) => {
  const getQuestionStatus = useCallback((questionId, index) => {
    const isAnswered = answeredIds.includes(questionId);
    const isMarked = markedIds.includes(questionId);
    const isCurrent = index === currentIndex;

    if (isCurrent) return "bg-neutral-900 text-white scale-105 ring-2 ring-neutral-400";
    if (isAnswered && isMarked) return "bg-neutral-600 text-white";
    if (isAnswered) return "bg-neutral-700 text-white";
    if (isMarked) return "bg-amber-500 text-white";
    return "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 active:bg-neutral-400";
  }, [answeredIds, markedIds, currentIndex]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden border border-neutral-200 shadow-xl">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-900">Questions</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {questions.map((q, index) => (
              <button
                key={q.id || index}
                className={`relative p-3 text-sm font-semibold rounded-lg transition-all duration-200 touch-manipulation active:scale-95 ${getQuestionStatus(q.id, index)}`}
                onClick={() => {
                  onNavigate(index);
                  onClose();
                }}
                title={`Question ${index + 1}`}
              >
                {index + 1}
                {markedIds.includes(q.id) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
            <h5 className="text-xs font-semibold text-neutral-700 mb-2">Legend</h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
              <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-neutral-900 rounded" /><span>Current</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-neutral-600 rounded" /><span>Answered</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-amber-500 rounded" /><span>Marked</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-neutral-200 rounded" /><span>Pending</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

QuestionGrid.displayName = 'QuestionGrid';

// Previous Attempt Check Component
const PreviousAttemptCard = memo(({ attempt, onViewResult, onRetakeTest }) => (
  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Test Already Attempted</h3>
          <p className="text-neutral-600 text-sm">You have previously taken this test.</p>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="text-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-xl font-bold text-neutral-900">{attempt.score ?? 0}</div>
        <div className="text-neutral-600 text-xs">Score</div>
      </div>
      <div className="text-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-xl font-bold text-neutral-900">{attempt.percentage ?? 0}%</div>
        <div className="text-neutral-600 text-xs">Percentage</div>
      </div>
      <div className="text-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-xl font-bold text-neutral-900">{attempt.attempted_questions ?? 0}</div>
        <div className="text-neutral-600 text-xs">Attempted</div>
      </div>
      <div className="text-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-xl font-bold text-neutral-900">{formatDurationShort(attempt.duration_taken)}</div>
        <div className="text-neutral-600 text-xs">Time</div>
      </div>
    </div>
    <div className="mb-6 text-sm text-neutral-600 space-y-1">
      <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Attempted on: {new Date(attempt.submitted_at).toLocaleDateString()}</p>
      <p className="flex items-center gap-1.5"><User className="h-4 w-4" /> Status: <span className="font-semibold capitalize text-neutral-800">{attempt.status}</span></p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      {attempt.status === 'completed' ? (
        <button onClick={onViewResult} className="flex-1 bg-neutral-900 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center font-medium">
          <Trophy className="h-5 w-5 mr-2" /> View Results
        </button>
      ) : (
        <button onClick={onRetakeTest} className="flex-1 bg-neutral-100 text-neutral-800 px-6 py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center font-medium">
          <RefreshCw className="h-5 w-5 mr-2" /> Start Test
        </button>
      )}
    </div>
  </div>
));

PreviousAttemptCard.displayName = 'PreviousAttemptCard';

// Main Component
export default function EnhancedMobileMockTestPage() {
    const { examcategory, testId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [testInfo, setTestInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState(null);
  const autoSubmitOnceRef = useRef(false);

 // Optimized MathJax config
 const config = useMemo(() => ({
  "fast-preview": { disabled: false },
  tex: { 
    inlineMath: [["$", "$"], ["\\(", "\\)"]], 
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
  },
  messageStyle: "none",
  showMathMenu: false,
}), []);

  // Time formatting
  const formatTime = useCallback((seconds) => {
    const validSeconds = sanitizeData(seconds, 'number', 0);
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const secs = validSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized calculations
  const currentStats = useMemo(
    () =>
      calculateMockTestStats({
        answerHistory: state.answerHistory,
        totalQuestions: state.questionsQueue?.length || 0,
        examcategory,
        markedForReview: state.markedForReview,
        timeData: { totalTimeSpent: state.totalTime },
      }),
    [state.answerHistory, state.questionsQueue, state.markedForReview, state.totalTime, examcategory]
  );

  // Touch/Swipe handlers for mobile navigation
  const handleTouchStart = useCallback((e) => {
    const touchStartX = e.touches[0].clientX;
    dispatch({ type: "SET_SWIPE", payload: { startX: touchStartX } });
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!state.swipeDirection?.startX) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - state.swipeDirection.startX;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && state.currentQuestionIndex > 0) {
        handleNavigation('prev');
      } else if (deltaX < 0 && state.currentQuestionIndex < state.questionsQueue.length - 1) {
        handleNavigation('next');
      }
    }
    
    dispatch({ type: "SET_SWIPE", payload: null });
  }, [state.swipeDirection, state.currentQuestionIndex, state.questionsQueue.length]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "UPDATE_CONNECTION", payload: true });
      setNetworkError(false);
    };
    const handleOffline = () => {
      dispatch({ type: "UPDATE_CONNECTION", payload: false });
      setNetworkError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for previous attempts
  const userEmail = useMemo(() => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      user?.email ||
      null
    );
  }, [user?.email, user?.primaryEmailAddress?.emailAddress]);

  const checkPreviousAttempts = useCallback(async () => {
    if (!userEmail || !testId) return;

    try {
      const { data: attempts, error } = await supabase
        .from('user_test_attempts')
        .select(`
          id, submitted_at, score, percentage, attempted_questions, 
          duration_taken, status, is_completed
        `)
        .eq('test_id', testId)
        .eq('user_email', userEmail)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (attempts?.length > 0) {
        setPreviousAttempt(attempts[0]);
      }
    } catch (error) {
      console.error('Error checking previous attempts:', error);
    }
  }, [userEmail, testId]);

  // Auto-save functionality - optimized
  const performAutoSave = useCallback(async () => {
    if (!attemptId || !state.answerHistory.length || !state.isOnline) return;

    try {
      const stats = currentStats;

      await supabase
        .from('user_test_attempts')
        .update({
          answers: state.answerHistory,
          answer2: state.answerSummary,
          attempted_questions: stats.attempted,
          correct_answers: stats.correct,
          wrong_answers: stats.incorrect,
          marked_for_review_count: stats.markedCount,
          current_question_index: state.currentQuestionIndex,
          time_spent: state.totalTime,
          last_updated: new Date().toISOString(),
          examcategory:examcategory.toUpperCase(),
          quick_stats: {
            progress: stats.attemptPercentage,
            score: stats.score,
            percentage: stats.percentage,
            subjects: Object.keys(stats.subjectStats),
            topSubject: Object.entries(stats.subjectStats)
              .sort((a, b) => b[1].percentage - a[1].percentage)[0]?.[0] || 'None'
          }
        })
        .eq('id', attemptId);

      dispatch({ type: "AUTO_SAVE_SUCCESS" });
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [attemptId, state.answerHistory, state.isOnline, currentStats, state.answerSummary, state.currentQuestionIndex, state.totalTime]);

  // Auto-save effect
  useEffect(() => {
    if (state.testStarted && state.autoSaveEnabled && state.isOnline && attemptId) {
      const autoSaveInterval = setInterval(performAutoSave, 30000);
      return () => clearInterval(autoSaveInterval);
    }
  }, [state.testStarted, state.autoSaveEnabled, state.isOnline, attemptId, performAutoSave]);

  const handleTimeEnd = useCallback(async () => {
    if (autoSubmitOnceRef.current) return;
    autoSubmitOnceRef.current = true;
    toast.error('⏰ Time up! Auto-submitting...', { duration: 5000 });
    await submitTest(true);
  }, [submitTest]);
  
  const handleTimeWarning = useCallback((timeRemaining, message) => {
    toast.error(message, { 
      duration: timeRemaining <= 60 ? 8000 : timeRemaining <= 300 ? 4000 : 3000 
    });
  }, []);
  // Load test metadata (does not require sign-in)
  useEffect(() => {
    if (authLoading || !testId) return;
    fetchTestInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch when test/category ready only
  }, [authLoading, testId, examcategory]);

  // Previous attempts need a signed-in email
  useEffect(() => {
    if (authLoading || !testId || !userEmail) {
      if (!authLoading && !userEmail) setPreviousAttempt(null);
      return;
    }
    checkPreviousAttempts();
  }, [authLoading, testId, userEmail, checkPreviousAttempts]);

  const fetchTestInfo = async () => {
    setIsLoading(true);
    try {
      await toastPromise(
        async () => {
          const { data: testData, error: testError } = await supabase
            .from('mock_tests')
            .select(`
              id, name, description, duration, total_questions, difficulty, category
            `)
            .eq('id', testId)
            .eq('is_active', true)
            .single();

          if (testError) throw testError;

          if (!categoryMatches(testData.category, examcategory)) {
            router.push(`/mock-test/${examcategory}`);
            throw new Error('This test does not belong to the selected exam category');
          }

          setTestInfo(testData);
          await fetchQuestions(testData);
        },
        {
          loading: 'Loading test…',
          success: 'Test ready',
          error: (err) => err?.message || 'Failed to load test',
        }
      );
    } catch (error) {
      console.error('Error fetching test:', error);
      router.push(`/mock-test/${examcategory}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (testData) => {
    try {
      const { data: questionData, error: questionError } = await supabase
        .from('mock_test_questions')
        .select(`question_id, question_order, subject, topic, difficulty`)
        .eq('test_id', testId)
        .order('question_order');

      if (questionError) throw questionError;
      if (!questionData?.length) {
        toast.error('No questions available');
        return;
      }

      const questionIds = questionData.map(q => q.question_id).filter(Boolean);
      const batchSize = 20;
      let allQuestions = [];

      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        const { data: batchQuestions, error: batchError } = await supabase
          .from('examtracker')
          .select(`
            _id, question, options_A, options_B, options_C, options_D, 
            correct_option, solution, subject, topic, difficulty
          `)
          .in('_id', batch);

        if (batchError) throw batchError;
        allQuestions = [...allQuestions, ...batchQuestions];
      }

      const orderedQuestions = questionData.map(orderInfo => {
        const questionDetail = allQuestions.find(q => q._id === orderInfo.question_id);
        if (!questionDetail) return null;
        
        return {
          ...questionDetail,
          id: questionDetail._id,
          order: sanitizeData(orderInfo.question_order, 'number', 0),
          subject: sanitizeData(questionDetail.subject || orderInfo.subject, 'string', 'General'),
          topic: sanitizeData(questionDetail.topic || orderInfo.topic, 'string', 'General'),
          difficulty: sanitizeData(questionDetail.difficulty || orderInfo.difficulty, 'string', 'medium')
        };
      }).filter(Boolean);

      if (!orderedQuestions.length) {
        toast.error('No valid questions found');
        return;
      }

      const testDurationInSeconds = sanitizeData(testData.duration, 'number', 60) * 60;

      dispatch({
        type: "LOAD_TEST",
        payload: {
          questionsQueue: orderedQuestions,
          currentQuestion: orderedQuestions[0],
          currentQuestionIndex: 0,
          testDuration: testDurationInSeconds,
          timeRemaining: testDurationInSeconds,
          totalTime: 0,
          timeSpent: 0,
          answerHistory: [],
          answerSummary: {},
          answeredQuestionIds: [],
          markedForReview: []
        },
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    }
  };

  const startTestAttempt = async () => {
    if (!userEmail) {
      toast.error("Please sign in again to start the test.");
      return;
    }

    try {
      await toastPromise(
        async () => {
          const { data: existingInProgress } = await supabase
            .from('user_test_attempts')
            .select('id')
            .eq('test_id', testId)
            .eq('user_email', userEmail)
            .eq('is_completed', false)
            .eq('status', 'in_progress')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingInProgress?.id) {
            setAttemptId(existingInProgress.id);
            dispatch({ type: "START_TEST", payload: { testStarted: true } });
            autoSubmitOnceRef.current = false;
            return 'Resuming your in-progress attempt';
          }

          const creditCheck = await consumeCreditOnClient('mock_test', {
            referenceId: String(testId),
            user: { email: userEmail, id: user?.id },
          });
          if (!creditCheck.ok) {
            if (creditCheck.needsSubscription) {
              router.push('/pricing');
              throw new Error('Not enough credits for a new mock test. View plans on Pricing.');
            }
            throw new Error('Could not start test. Please sign in and try again.');
          }

          const categoryTag =
            getCategoryVariants(examcategory)[0] || String(examcategory || '').toUpperCase();

          const { data: attemptData, error: attemptError } = await supabase
            .from('user_test_attempts')
            .insert({
              test_id: testId,
              user_email: sanitizeData(userEmail, 'string', 'anonymous@test.com'),
              total_questions: state.questionsQueue.length,
              started_at: new Date().toISOString(),
              status: 'in_progress',
              examcategory: categoryTag,
            })
            .select()
            .single();

          if (attemptError) throw attemptError;

          setAttemptId(attemptData.id);
          dispatch({ type: "START_TEST", payload: { testStarted: true } });
          autoSubmitOnceRef.current = false;
          return '🚀 Test started!';
        },
        {
          loading: 'Starting test…',
          success: (msg) => msg,
          error: (err) => err?.message || 'Failed to start test',
        }
      );
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const handleAnswerSelect = useCallback((selectedAnswer) => {
    if (!state.currentQuestion || !selectedAnswer) return;

    const questionId = state.currentQuestion.id;
    const isCorrect = isAnswerCorrect(
      selectedAnswer,
      state.currentQuestion.correct_option,
      state.currentQuestion
    );
    const timeSpent = state.timeSpent;
    const currentTime = Date.now();

    const existingIndex = state.answerHistory.findIndex(a => a.questionId === questionId);
    
    let newAnswerHistory = [...state.answerHistory];
    let newAnswerSummary = { ...state.answerSummary };
    let newAnsweredIds = [...state.answeredQuestionIds];
    let statsUpdate = {
      questionsAnswered: state.questionsAnswered,
      correctAnswers: state.correctAnswers,
      incorrectAnswers: state.incorrectAnswers,
      points: state.points
    };

    const detailedAnswer = {
      questionId,
      question: state.currentQuestion.question,
      userAnswer: selectedAnswer,
      correctAnswer: state.currentQuestion.correct_option,
      isCorrect,
      timeSpent,
      timestamp: currentTime,
      subject: state.currentQuestion.subject,
      topic: state.currentQuestion.topic,
      difficulty: state.currentQuestion.difficulty,
      order: state.currentQuestion.order
    };

    const summaryAnswer = {
      q: questionId,
      a: selectedAnswer,
      c: state.currentQuestion.correct_option,
      r: isCorrect ? 1 : 0,
      t: timeSpent,
      s: state.currentQuestion.subject,
      d: state.currentQuestion.difficulty,
      o: state.currentQuestion.order
    };

    if (existingIndex >= 0) {
      const oldAnswer = newAnswerHistory[existingIndex];
      const wasCorrect = oldAnswer.isCorrect;
      
      newAnswerHistory[existingIndex] = detailedAnswer;
      newAnswerSummary[questionId] = summaryAnswer;
      
      if (wasCorrect !== isCorrect) {
        if (isCorrect) {
          statsUpdate.correctAnswers++;
          statsUpdate.incorrectAnswers = Math.max(0, statsUpdate.incorrectAnswers - 1);
          statsUpdate.points += 100;
        } else {
          statsUpdate.correctAnswers = Math.max(0, statsUpdate.correctAnswers - 1);
          statsUpdate.incorrectAnswers++;
          statsUpdate.points = Math.max(0, statsUpdate.points - 100);
        }
      }
    } else {
      newAnswerHistory.push(detailedAnswer);
      newAnswerSummary[questionId] = summaryAnswer;
      
      if (!newAnsweredIds.includes(questionId)) {
        newAnsweredIds.push(questionId);
        statsUpdate.questionsAnswered++;
      }
      
      if (isCorrect) {
        statsUpdate.correctAnswers++;
        statsUpdate.points += 100;
      } else {
        statsUpdate.incorrectAnswers++;
      }
    }

    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        userAnswer: selectedAnswer,
        answerHistory: newAnswerHistory,
        answerSummary: newAnswerSummary,
        answeredQuestionIds: newAnsweredIds,
        timeSpent,
        ...statsUpdate
      },
    });

    // Mobile feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    toast.success('✓ Saved', { duration: 1000 });
  }, [state]);

  const handleNavigation = useCallback((direction) => {
    let newIndex;
    if (direction === 'next') {
      newIndex = Math.min(state.currentQuestionIndex + 1, state.questionsQueue.length - 1);
    } else if (direction === 'prev') {
      newIndex = Math.max(state.currentQuestionIndex - 1, 0);
    } else {
      newIndex = direction;
    }

    if (newIndex !== state.currentQuestionIndex && state.questionsQueue[newIndex]) {
      const newQuestion = state.questionsQueue[newIndex];
      const existingAnswer = state.answerHistory.find(a => a.questionId === newQuestion.id);
      
      dispatch({
        type: "NEXT_QUESTION",
        payload: {
          currentQuestionIndex: newIndex,
          currentQuestion: newQuestion,
          userAnswer: existingAnswer?.userAnswer || "",
        },
      });
    }
  }, [state.currentQuestionIndex, state.questionsQueue, state.answerHistory]);

  const handleMarkForReview = useCallback(() => {
    if (!state.currentQuestion?.id) return;
    
    const questionId = state.currentQuestion.id;
    const isMarked = state.markedForReview.includes(questionId);
    const newMarked = isMarked 
      ? state.markedForReview.filter(id => id !== questionId)
      : [...state.markedForReview, questionId];
    
    dispatch({
      type: "MARK_FOR_REVIEW",
      payload: { markedForReview: newMarked }
    });
    
    toast.success(isMarked ? '🏳️ Unmarked' : '🚩 Marked for review', { duration: 1500 });
  }, [state.currentQuestion?.id, state.markedForReview]);

  const handleAutoSubmit = async () => {
    toast.error('⏰ Time up! Auto-submitting...', { duration: 5000 });
    await submitTest(true);
  };

  async function submitTest(isAutoSubmit = false) {
    if (!attemptId) {
      toast.error('No test session found');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const runSubmit = async () => {
      const stats = currentStats;
      const elapsedSeconds = Math.max(1, Math.round(sanitizeData(state.totalTime, "number", 0)));

      // Create answered questions lookup map
      const answeredMap = new Map();
      state.answerHistory.forEach(answer => {
        answeredMap.set(answer.questionId, answer);
      });

      // Create lightweight answer2 object
      const answer2 = {};
      state.questionsQueue.forEach(question => {
        const userResponse = answeredMap.get(question.id);
        
        answer2[question.id] = {
          q: question.id,
          a: userResponse?.userAnswer || null,
          c: question.correct_option,
          r: userResponse?.isCorrect ? 1 : 0,
          t: userResponse?.timeSpent || 0,
          s: question.subject,
          d: question.difficulty,
          o: question.order,
          attempted: !!userResponse,
          marked: state.markedForReview.includes(question.id)
        };
      });

      // Create efficient all_questions with user response data
      const allQuestions = state.questionsQueue.map(q => {
        const userResponse = answeredMap.get(q.id);
        
        return {
          id: q.id,
          order: q.order,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          correct_option: q.correct_option,
          userAnswer: userResponse?.userAnswer || null,
          isCorrect: userResponse?.isCorrect || false,
          timeSpent: userResponse?.timeSpent || 0,
          isAttempted: !!userResponse,
          isMarkedForReview: state.markedForReview.includes(q.id),
          hasContent: true
        };
      });

      // Prepare comprehensive stats
      const finalStats = {
        totalQuestions: stats.totalQuestions,
        attempted: stats.attempted,
        correct: stats.correct,
        incorrect: stats.incorrect,
        skipped: stats.skipped,
        score: stats.score,
        percentage: stats.percentage,
        subjectStats: stats.subjectStats,
        markingScheme: stats.markingScheme,
        maxMarks: stats.maxMarks,
        netMarks: stats.netMarks,
        timeMetrics: {
          totalTime: state.totalTime,
          avgTimePerQuestion: stats.avgTimePerQuestion
        }
      };

      // Main submission with optimized data structure
      const submissionData = {
        submitted_at: new Date().toISOString(),
        duration_taken: elapsedSeconds,
        attempted_questions: stats.attempted,
        correct_answers: stats.correct,
        wrong_answers: stats.incorrect,
        unanswered: stats.skipped,
        score: stats.score,
        percentage: stats.percentage,
        examcategory:examcategory.toUpperCase(),
        is_completed: true,
        completion_type: isAutoSubmit ? 'auto_submit' : 'manual_submit',
        status: 'completed',
        
        // Optimized dual storage
        answers: state.answerHistory,
        answer2: answer2,
        all_questions: allQuestions,
        
        // Comprehensive analytics
        quick_stats: {
          progress: stats.attemptPercentage,
          score: stats.score,
          percentage: stats.percentage,
          markingScheme: stats.markingScheme,
          maxMarks: stats.maxMarks,
          netMarks: stats.netMarks,
          subjects: Object.keys(stats.subjectStats),
          topSubject: Object.entries(stats.subjectStats)
            .sort((a, b) => b[1].percentage - a[1].percentage)[0]?.[0] || 'None'
        },
        
        subject_performance: stats.subjectStats,
        final_stats: finalStats,
        
        // Performance metrics
        avg_time_per_question: stats.avgTimePerQuestion,
        total_interactions: state.interactionLog.length,
        completion_rate: stats.attemptPercentage,
        marked_for_review_count: state.markedForReview.length,
        
        // Navigation data
        navigation_pattern: {
          totalNavigations: state.navigationHistory.length,
          backtrackCount: state.navigationHistory.filter(nav => nav.to < nav.from).length,
          jumpCount: state.navigationHistory.filter(nav => Math.abs(nav.to - nav.from) > 1).length
        }
      };

      // Update main attempt
      const { error: updateError } = await supabase
        .from('user_test_attempts')
        .update(submissionData)
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Save individual responses - ALL questions (correct_answer is NOT NULL in DB)
      const responses = allQuestions.map(question => ({
        attempt_id: attemptId,
        question_id: question.id,
        question_order: question.order,
        user_answer: question.userAnswer ?? '',
        correct_answer: question.correct_option ?? '',
        is_correct: question.isCorrect,
        time_taken: question.timeSpent,
        marked_for_review: question.isMarkedForReview,
        subject: question.subject ?? '',
        topic: question.topic ?? '',
        difficulty: question.difficulty ?? '',
        response_type: question.isAttempted ? 'answered' : 'skipped',
        is_unanswered: !question.isAttempted
      }));

      const batchSize = 50;
      const responseErrors = [];
      for (let i = 0; i < responses.length; i += batchSize) {
        const batch = responses.slice(i, i + batchSize);
        const { error: batchError } = await supabase
          .from('user_question_responses')
          .upsert(batch, { onConflict: 'attempt_id,question_id' });

        if (batchError) {
          responseErrors.push(batchError);
          console.error(`Batch ${i / batchSize + 1} error:`, batchError);
        }
      }
      if (responseErrors.length > 0) {
        throw new Error('Failed to save some question responses. Please try again.');
      }

      // Success message based on performance
      let message = '🎉 Test submitted successfully!';
      if (stats.attempted === 0) {
        message = '📝 Test submitted with no answers';
      } else if (stats.percentage >= 90) {
        message = `🏆 Outstanding! ${stats.percentage}% score!`;
      } else if (stats.percentage >= 75) {
        message = `🎯 Excellent! ${stats.percentage}% score!`;
      } else if (stats.percentage >= 60) {
        message = `👍 Good job! ${stats.percentage}% score!`;
      } else if (stats.markingScheme === 'gate') {
        message = `📊 Test completed! ${stats.netMarks} / ${stats.maxMarks} marks (${stats.percentage}%)`;
      } else {
        message = `📊 Test completed! ${stats.percentage}% score`;
      }

      return message;
    };

    try {
      const message = await toastPromise(runSubmit, {
        loading: isAutoSubmit ? 'Submitting test…' : 'Saving your answers…',
        success: (msg) => msg,
        error: (err) => err?.message || 'Submission failed',
      });

      localStorage.removeItem(`test_backup_${attemptId}`);
      router.push(`/mock-test/${examcategory}/results/${attemptId}`);
      return message;
    } catch (error) {
      console.error('Submission error:', error);

      // Create comprehensive backup
      const backup = {
        attemptId,
        testId,
        timestamp: new Date().toISOString(),
        userEmail: user?.email,
        answerHistory: state.answerHistory,
        questionsQueue: state.questionsQueue.map(q => ({
          id: q.id,
          order: q.order,
          subject: q.subject,
          correct_option: q.correct_option
        })),
        markedForReview: state.markedForReview,
        stats: currentStats,
        timeData: {
          totalTime: state.totalTime,
          timeRemaining: state.timeRemaining,
          testDuration: state.testDuration
        }
      };
      
      localStorage.setItem(`test_backup_${attemptId}`, JSON.stringify(backup));
      toast.error(
        'Submission failed but data is backed up locally. Please contact support.',
        { duration: 10000, id: 'submit-backup' }
      );
      router.push(`/mock-test/${examcategory}/results/${attemptId}?backup=true`);
      
    } finally {
      setIsSubmitting(false);
    }
  }

  const getQuestionStatus = useCallback((questionId, index) => {
    const isAnswered = state.answeredQuestionIds.includes(questionId);
    const isMarked = state.markedForReview.includes(questionId);
    const isCurrent = index === state.currentQuestionIndex;

    if (isCurrent) return "bg-blue-600 text-white scale-105 ring-2 ring-blue-300";
    if (isAnswered && isMarked) return "bg-purple-500 text-white";
    if (isAnswered) return "bg-green-500 text-white";
    if (isMarked) return "bg-yellow-500 text-white";
    return "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400";
  }, [state.answeredQuestionIds, state.markedForReview, state.currentQuestionIndex]);

  // Handle previous attempt actions
  const handleViewResult = useCallback(() => {
    router.push(`/mock-test/${examcategory}/results/${previousAttempt.id}`);
  }, [router, previousAttempt]);

  const handleRetakeTest = useCallback(() => {
    setPreviousAttempt(null);
    toast.success('You can now retake the test', { duration: 2000 });
  }, []);

  // Loading state
  const categoryLabel = (examcategory?.toUpperCase?.() || 'GATE CSE').replace(/-/g, ' ');

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-emerald-600 mx-auto mb-4" />
            <p className="text-neutral-600 font-medium text-sm md:text-base">Loading test…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center bg-white rounded-3xl shadow-sm border border-neutral-200 p-6 md:p-8 max-w-sm md:max-w-md w-full">
            <BookOpen className="h-12 w-12 md:h-14 md:w-14 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Sign in required</h2>
            <p className="text-neutral-600 mb-6 text-sm md:text-base">Sign in to take this mock test.</p>
            <button
              onClick={() => router.push(`/sign-in?redirect=${encodeURIComponent(`/mock-test/${examcategory}/attempt/${testId}`)}`)}
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-2xl hover:bg-emerald-700 transition-colors font-semibold"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testInfo) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24">
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center bg-white rounded-3xl shadow-sm border border-neutral-200 p-6 md:p-8 max-w-sm md:max-w-md w-full">
            <AlertTriangle className="h-12 w-12 md:h-14 md:w-14 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Test not found</h2>
            <p className="text-neutral-600 mb-6 text-sm md:text-base">The requested test is not available.</p>
            <button
              onClick={() => router.push(`/mock-test/${examcategory}`)}
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-2xl hover:bg-emerald-700 transition-colors font-semibold"
            >
              Browse tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-test screen with previous attempt check
  if (!state.testStarted) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <MockTestSubpageHeader
            backHref={`/mock-test/${examcategory}`}
            backLabel="Back to mock tests"
            title={testInfo.name}
            description={`${categoryLabel} · ${testInfo.total_questions} questions · ${Math.floor(testInfo.duration / 60) > 0 ? `${Math.floor(testInfo.duration / 60)}h ` : ''}${testInfo.duration % 60}m`}
          />

            <div className="max-w-4xl mx-auto">
              {/* Desktop Header */}
              <div className="text-center mb-6 md:mb-8 hidden md:block">
                <Trophy className="h-12 w-12 md:h-14 md:w-14 text-neutral-600 mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
                  {testInfo.name}
                </h1>
                <p className="text-base md:text-lg text-neutral-600">
                  {categoryLabel} · Full-length mock test
                </p>
              </div>

            {/* Previous Attempt Check */}
            {previousAttempt && (
              <PreviousAttemptCard 
                attempt={previousAttempt}
                onViewResult={handleViewResult}
                onRetakeTest={handleRetakeTest}
              />
            )}

            {/* Only show test start if no previous attempt or retake is allowed */}
{(!previousAttempt) && (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-neutral-600" />
          Test overview
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Target className="h-6 w-6 text-neutral-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-neutral-600">Questions</p>
              <p className="text-lg md:text-xl font-bold text-neutral-900">{testInfo.total_questions}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Timer className="h-6 w-6 text-neutral-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-neutral-600">Duration</p>
              <p className="text-lg md:text-xl font-bold text-neutral-900">{Math.floor(testInfo.duration / 60)}h {testInfo.duration % 60}m</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Zap className="h-6 w-6 text-neutral-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-neutral-600">Difficulty</p>
              <p className="text-lg md:text-xl font-bold text-neutral-900 capitalize">{testInfo.difficulty}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Award className="h-6 w-6 text-neutral-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-neutral-600">
                {usesGateMarking(examcategory) ? 'Max marks' : 'Max score'}
              </p>
              <p className="text-lg md:text-xl font-bold text-neutral-900">
                {usesGateMarking(examcategory)
                  ? testInfo.total_questions
                  : testInfo.total_questions * 100}
              </p>
              {usesGateMarking(examcategory) ? (
                <p className="text-[10px] text-neutral-500">+1 / −⅓ marking</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm text-neutral-600">
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Avg. time per question</span>
            <span className="font-medium text-neutral-800">{Math.round(testInfo.duration / testInfo.total_questions * 60)}s</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="flex items-center gap-1.5"><Brain className="h-4 w-4" /> Type</span>
            <span className="font-medium text-neutral-800">MCQ</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="flex items-center gap-1.5"><Flag className="h-4 w-4" /> Mark for review</span>
            <span className="font-medium text-neutral-800">Available</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200 md:hidden">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center"><Star className="h-4 w-4 mr-1" /> Quick tips</h4>
          <ul className="text-xs text-neutral-700 space-y-1">
            <li>• ~{Math.round(testInfo.duration / testInfo.total_questions * 60)}s per question</li>
            <li>• Mark difficult ones; review if time permits</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 md:p-6">
        <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center">
          <BookOpen className="h-4 w-4 mr-2 text-neutral-600" />
          Instructions
        </h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" /> Use nav or grid to move between questions</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" /> Answers auto-saved</li>
          <li className="flex items-start gap-2"><Flag className="h-4 w-4 mt-0.5 flex-shrink-0" /> Mark for review; clear/change anytime</li>
          <li className="flex items-start gap-2"><Save className="h-4 w-4 mt-0.5 flex-shrink-0" /> Auto-save every 30s; time warnings at 10, 5, 1 min</li>
          <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" /> Test auto-submits when time ends</li>
        </ul>
      </div>
    </div>

    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 p-4 md:relative md:bg-transparent md:border-0 md:p-0">
      <div className="text-center">
        <button
          onClick={startTestAttempt}
          disabled={!state.questionsQueue.length}
          className="w-full md:w-auto inline-flex items-center justify-center px-6 md:px-8 py-4 bg-emerald-600 text-white text-base md:text-lg font-semibold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[52px]"
        >
          <Play className="h-5 w-5 mr-2" />
          Start {testInfo.total_questions} question test
        </button>
        <p className="mt-2 text-xs text-neutral-500">
          Test starts immediately. Progress is auto-saved.
        </p>
      </div>
    </div>
  </>
)}

            </div>
        </div>
      </div>
    );
  }

  // Main test interface
  const totalQ = state.questionsQueue.length;
  const currentQ = state.currentQuestionIndex + 1;
  const progressPct = totalQ > 0 ? (currentQ / totalQ) * 100 : 0;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      {networkError && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs md:text-sm">
          <WifiOff className="h-3 w-3 md:h-4 md:w-4 inline mr-2" />
          No internet. Progress saved locally.
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {state.currentQuestion ? (
          <MathJaxContext config={config}>
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-3 md:p-4 lg:p-5 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
                  <div className="hidden md:block w-8 h-8 lg:w-10 lg:h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-neutral-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm md:text-lg font-bold text-neutral-900 truncate">
                      {testInfo.name}
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-600">
                      Q {currentQ}/{totalQ}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                  <TimerDisplay
                    testDuration={state.testDuration}
                    testStarted={state.testStarted}
                    testStartTime={state.testStartTime}
                    onTimeEnd={handleTimeEnd}
                    onTimeWarning={handleTimeWarning}
                    onTick={(tick) => dispatch({ type: "UPDATE_TIME", payload: tick })}
                  />
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_QUESTION_GRID" })}
                    className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                    aria-label="Question list"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={isSubmitting}
                    className="bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center text-xs md:text-sm font-medium"
                  >
                    <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Submit</span>
                    <span className="sm:hidden">End</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <ConnectionStatus isOnline={state.isOnline} lastSaved={state.lastSaved} />
                <div className="flex items-center space-x-2 md:space-x-4">
                  <span className="text-neutral-500">{Math.round(progressPct)}%</span>
                  <div className="w-16 md:w-20 bg-neutral-200 rounded-full h-1.5">
                    <div
                      className="bg-neutral-700 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="hidden lg:block w-72 xl:w-80 bg-white rounded-xl shadow-sm border border-neutral-200 flex-shrink-0">
              <div className="p-4">
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center">
                  <LineChart className="h-4 w-4 mr-2 text-neutral-600" />
                  Progress
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-neutral-50 p-3 rounded-lg text-center border border-neutral-200">
                    <div className="text-xl font-bold text-neutral-900">{state.questionsAnswered}</div>
                    <div className="text-neutral-600 text-xs">Answered</div>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg text-center border border-neutral-200">
                    <div className="text-xl font-bold text-neutral-900">{state.markedForReview.length}</div>
                    <div className="text-neutral-600 text-xs">Marked</div>
                  </div>
                </div>
                <div className="mb-2 flex justify-center">
                  <ProgressRing progress={progressPct} size={72} className="mx-auto" />
                </div>
                <h4 className="text-xs font-semibold text-neutral-700 mb-2">Questions</h4>
                <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto">
                  {state.questionsQueue.map((q, index) => (
                    <button
                      key={q.id || index}
                      className={`relative p-2 text-xs font-semibold rounded-lg transition-all duration-200 ${getQuestionStatus(q.id, index)}`}
                      onClick={() => handleNavigation(index)}
                      title={`Question ${index + 1}`}
                    >
                      {index + 1}
                      {state.markedForReview.includes(q.id) && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />}
                    </button>
                  ))}
                </div>
                <div className="mt-3 bg-neutral-50 rounded-lg p-2 border border-neutral-200">
                  <div className="grid grid-cols-2 gap-1 text-xs text-neutral-600">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-neutral-900 rounded" /><span>Current</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-neutral-600 rounded" /><span>Done</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded" /><span>Marked</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-neutral-200 rounded" /><span>Pending</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex-1 bg-white rounded-xl shadow-sm border border-neutral-200 min-w-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="p-3 md:p-6 lg:p-8">
                {/* Question Header - Mobile First */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-neutral-100 text-neutral-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                      {state.currentQuestion.subject}
                    </span>
                    <span className="bg-neutral-100 text-neutral-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                      {state.currentQuestion.topic}
                    </span>
                    <span className="bg-neutral-100 text-neutral-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm capitalize">
                      {state.currentQuestion.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={handleMarkForReview}
                    className={`flex items-center px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      state.markedForReview.includes(state.currentQuestion.id)
                        ? 'bg-amber-100 text-amber-800 border border-amber-400'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-transparent'
                    }`}
                  >
                    <Flag className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {state.markedForReview.includes(state.currentQuestion.id) ? 'Unmark' : 'Mark'}
                  </button>
                </div>

                {/* Question Content */}
                <MathJax hideUntilTypeset={"first"} inline dynamic>
                  <div
                    dangerouslySetInnerHTML={{ __html: state.currentQuestion.question }}
                    className="text-base md:text-lg mb-6 md:mb-8 prose max-w-none leading-relaxed"
                  />
                  
                  {/* Answer input — inline text or MCQ options */}
                  <div className="space-y-3 md:space-y-4">
                    {isInlineAnswerQuestion(state.currentQuestion) ? (
                      <InlineAnswerInput
                        value={state.userAnswer || ""}
                        onChange={(value) =>
                          dispatch({ type: "SET_USER_ANSWER_DRAFT", payload: value })
                        }
                        onSubmit={() => handleAnswerSelect(state.userAnswer)}
                        submitted={state.answeredQuestionIds.includes(state.currentQuestion.id)}
                        isCorrect={
                          state.answeredQuestionIds.includes(state.currentQuestion.id) &&
                          isAnswerCorrect(
                            state.userAnswer,
                            state.currentQuestion.correct_option,
                            state.currentQuestion
                          )
                        }
                        correctOption={state.currentQuestion.correct_option}
                      />
                    ) : (
                      getVisibleMcqOptions(state.currentQuestion).map((option) => (
                      <label
                        key={option}
                        className={`flex items-start p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          state.userAnswer === option
                            ? "bg-neutral-100 border-neutral-700 shadow-sm"
                            : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={state.userAnswer === option}
                          onChange={() => handleAnswerSelect(option)}
                          className="h-4 w-4 md:h-5 md:w-5 text-neutral-700 focus:ring-neutral-600 mr-3 md:mr-4 mt-0.5 flex-shrink-0"
                        />
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3 md:mr-4 flex-shrink-0 ${
                          state.userAnswer === option ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-600"
                        }`}>
                          {option}
                        </div>
                        <span
                          dangerouslySetInnerHTML={{ __html: state.currentQuestion[`options_${option}`] }}
                          className="flex-1 text-sm md:text-base leading-relaxed"
                        />
                      </label>
                    ))
                    )}
                  </div>
                </MathJax>

                {/* Action Buttons - Mobile First */}
                <div className="mt-6 md:mt-8">
                  <div className="flex justify-between items-center mb-4 md:hidden">
                  <button
                    onClick={() => handleNavigation('prev')}
                    disabled={state.currentQuestionIndex === 0}
                    className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg flex items-center hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </button>
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_QUESTION_GRID" })}
                    className="bg-neutral-100 text-neutral-800 px-4 py-2 rounded-lg flex items-center hover:bg-neutral-200 font-medium"
                  >
                    <Target className="h-4 w-4 mr-1" />
                    {currentQ}/{totalQ}
                  </button>
                  <button
                    onClick={() => handleNavigation('next')}
                    disabled={currentQ >= totalQ}
                    className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg flex items-center hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                <div className="space-y-3 md:hidden">
                  {state.userAnswer && (
                    <button
                      onClick={() => {
                        if (currentQ < totalQ) handleNavigation('next');
                        else setShowConfirmSubmit(true);
                      }}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {state.currentQuestionIndex + 1 < state.questionsQueue.length ? 'Save & Next' : 'Save & Finish'}
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {state.userAnswer && (
                      <button
                        onClick={() => dispatch({ type: "ANSWER_QUESTION", payload: { userAnswer: "" } })}
                        className="bg-neutral-100 text-neutral-700 py-3 px-4 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Clear
                      </button>
                    )}
                    {currentQ < totalQ && (
                      <button
                        onClick={() => handleNavigation('next')}
                        className="bg-neutral-900 text-white py-3 px-4 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center font-medium"
                      >
                        <SkipForward className="h-4 w-4 mr-2" /> Skip
                      </button>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex flex-wrap justify-between items-center gap-3">
                  <button
                    onClick={() => handleNavigation('prev')}
                    disabled={state.currentQuestionIndex === 0}
                    className="bg-neutral-100 text-neutral-700 px-5 py-2.5 rounded-lg flex items-center hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" /> Previous
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    {state.userAnswer && (
                      <button
                        onClick={() => {
                          if (state.currentQuestionIndex + 1 < state.questionsQueue.length) handleNavigation('next');
                          else setShowConfirmSubmit(true);
                        }}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg flex items-center hover:bg-green-700 transition-colors font-medium"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {state.currentQuestionIndex + 1 < state.questionsQueue.length ? 'Save & Next' : 'Save & Finish'}
                      </button>
                    )}
                    {state.userAnswer && (
                      <button
                        onClick={() => dispatch({ type: "ANSWER_QUESTION", payload: { userAnswer: "" } })}
                        className="bg-neutral-100 text-neutral-700 px-4 py-2.5 rounded-lg flex items-center hover:bg-neutral-200 font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Clear
                      </button>
                    )}
                    {currentQ < totalQ && (
                      <button
                        onClick={() => handleNavigation('next')}
                        className="bg-neutral-900 text-white px-5 py-2.5 rounded-lg flex items-center hover:bg-neutral-800 font-medium"
                      >
                        <SkipForward className="h-4 w-4 mr-2" /> Skip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {state.showQuestionGrid && (
            <QuestionGrid
              questions={state.questionsQueue}
              currentIndex={state.currentQuestionIndex}
              answeredIds={state.answeredQuestionIds}
              markedIds={state.markedForReview}
              onNavigate={handleNavigation}
              onClose={() => dispatch({ type: "TOGGLE_QUESTION_GRID" })}
            />
          )}
          </div>
        </MathJaxContext>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-neutral-200">
          <AlertTriangle className="h-14 w-14 text-neutral-400 mx-auto mb-4" />
          <p className="text-lg text-neutral-600 mb-6">No questions available</p>
          <button
            onClick={() => router.push(`/mock-test/${examcategory}`)}
            className="bg-neutral-900 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
          >
            Back to tests
          </button>
        </div>
      )}
    </div>

    {showConfirmSubmit && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
              <h3 className="text-lg font-bold text-neutral-900">Submit test?</h3>
            </div>
            <p className="text-neutral-600 mb-4 text-sm">
              You cannot change answers after submission.
            </p>
            <div className="bg-neutral-50 rounded-lg p-4 mb-5 border border-neutral-200 space-y-2 text-sm text-neutral-700">
              <div className="flex justify-between"><span>Total</span><span className="font-semibold text-neutral-900">{state.questionsQueue.length}</span></div>
              <div className="flex justify-between"><span>Answered</span><span className="font-semibold text-green-600">{state.questionsAnswered}</span></div>
              <div className="flex justify-between"><span>Skipped</span><span className="font-semibold text-neutral-900">{state.questionsQueue.length - state.questionsAnswered}</span></div>
              <div className="flex justify-between"><span>Marked</span><span className="font-semibold text-neutral-900">{state.markedForReview.length}</span></div>
              <div className="flex justify-between"><span>Time left</span><span className="font-semibold">{formatTime(state.timeRemaining)}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 bg-neutral-100 text-neutral-800 px-4 py-3 rounded-lg hover:bg-neutral-200 disabled:opacity-50 font-medium"
              >
                Continue test
              </button>
              <button
                onClick={() => { setShowConfirmSubmit(false); submitTest(); }}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Time Warning - Mobile Optimized */}
    {state.testStarted && state.timeRemaining <= 300 && state.timeRemaining > 0 && (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-red-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl animate-pulse z-40">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Clock className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm md:text-base">Time Warning!</div>
            <div className="text-xs md:text-sm">{formatTime(state.timeRemaining)} remaining</div>
          </div>
        </div>
      </div>
    )}

  </div>
)
}