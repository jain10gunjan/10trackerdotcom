"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
  RotateCcw,
  LineChart,
  Settings,
  Search,
  TrendingUp,
  Filter,
  ChevronLeft,
  Save,
  Download,
  X,
  AlertCircle,
  BookmarkPlus,
  Bookmark,
  Eye,
  EyeOff,
  Info,
  Layout,
  Grid,
  List,
  FilterX,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import MetaDataJobs from "@/components/Seo";
import { motion, AnimatePresence } from 'framer-motion';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// MathJax configuration
const config = {
  "fast-preview": { disabled: true },
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
  messageStyle: "none",
};

// Custom hook for fetching topics and subject data
const useTopics = (category) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(true);

  // const fetchOrderStatus = useCallback(async (email) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("orders")
  //       .select("status")
  //       .eq("user_email", email)
  //       .eq("plan", category)
  //       .limit(1);

  //     if (error) throw new Error(error.message);
  //     return data.length > 0;
  //   } catch (err) {
  //     console.error("Error checking order status:", err);
  //     return false;
  //   }
  // }, [category]);

  useEffect(() => {
    let isMounted = true;
    
    if (!user) {
      setShowDemoMode(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const checkAccess = async () => {
      try {
        // const hasValidOrder = await fetchOrderStatus(user.email);
        const hasValidOrder = true;
        if (isMounted) {
          setHasAccess(hasValidOrder);
          setShowDemoMode(!hasValidOrder);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setShowDemoMode(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAccess();
    
    return () => { isMounted = false; };
  // }, [user, fetchOrderStatus]);
}, [user]);

  useEffect(() => {
    if (!category) return;

    let isMounted = true;
    setIsLoading(true);

    // Always fetch topics for demo mode
    fetch(`/api/allsubtopics?category=${category}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch topics");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          // Create a deduplicated list of topics
          const topicsList = [...new Set(
            data.subjectsData.flatMap((subject) =>
              subject.subtopics.map((sub) => sub.title)
            )
          )];
          setTopics(topicsList);
          setSubjectData(data.subjectsData);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          toast.error("Failed to load topics");
        }
      })
      .finally(() => isMounted && setIsLoading(false));

    return () => { isMounted = false; };
  }, [category]);

  return { topics, subjectData, isLoading, error, hasAccess, showDemoMode };
};

// Utility function to format time
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Empty state component
const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    <div className="bg-gray-100 p-4 rounded-full mb-4">
      <Icon className="h-8 w-8 text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 max-w-md">{message}</p>
    {action && action}
  </div>
);

// Toast notification component for better UI
const CustomToast = ({ message, type }) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };
  
  const bgColors = {
    success: "bg-green-50 border-green-100",
    error: "bg-red-50 border-red-100",
    info: "bg-blue-50 border-blue-100",
  };
  
  const textColors = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
  };
  
  return (
    <div className={`flex items-center p-3 rounded-lg shadow-md border ${bgColors[type]}`}>
      <div className="mr-3">{icons[type]}</div>
      <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
    </div>
  );
};

const PracticeUnlimited = () => {
  const { category } = useParams();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const { topics, subjectData, isLoading, error, hasAccess, showDemoMode } = useTopics(category);
  const questionContainerRef = useRef(null);

  const [state, setState] = useState({
    selectedTopics: [],
    currentQuestion: null,
    userAnswer: "",
    showSolution: false,
    points: 0,
    timeSpent: 0,
    answeredQuestionIds: [],
    practiceStarted: false,
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    questionsQueue: [],
    currentQuestionIndex: 0,
    totalQuestionsToFetch: 30,
    savedQuestions: [],
    statistics: {
      avgTimePerQuestion: 0,
      topicPerformance: {},
      difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    },
  });
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "topic", direction: "ascending" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topicView, setTopicView] = useState("grid"); // grid or list
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showProgressMeter, setShowProgressMeter] = useState(true);
  
  // Performance optimization - debounce search
  const debouncedSearchRef = useRef(null);
  

  useEffect(() => {
    toast("Loading new question...");
    window.MathJax = {
      tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        processEscapes: true,
      },
      svg: { fontCache: "global" },
    };
  }, [state.currentQuestion]);

  // Handle search with debounce
  const handleSearchChange = (value) => {
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }
    
    debouncedSearchRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  // Memoized filtered topics and topic count
  const filteredTopics = useMemo(() => {
    let filtered = topics.filter((topic) => 
      topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (showBookmarked) {
      // Get saved topics from local storage
      const savedTopics = JSON.parse(localStorage.getItem(`${category}_savedTopics`) || "[]");
      filtered = filtered.filter(topic => savedTopics.includes(topic));
    }
    
    return filtered;
  }, [topics, searchQuery, category, showBookmarked]);

  const topicCountMap = useMemo(() => {
    const countMap = {};
    subjectData?.forEach((item) => {
      item?.subtopics?.forEach(subtopic => {
        if (subtopic?.title) {
          countMap[subtopic.title] = (countMap[subtopic.title] || 0) + 1;
        }
      });
    });
    return countMap;
  }, [subjectData]);
  
  // Get saved topics
  const savedTopics = useMemo(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(`${category}_savedTopics`) || "[]");
    }
    return [];
  }, [category, state.savedQuestions]);

  // Save a topic to favorites
  const saveTopic = (topic) => {
    const currentSaved = JSON.parse(localStorage.getItem(`${category}_savedTopics`) || "[]");
    if (!currentSaved.includes(topic)) {
      const newSaved = [...currentSaved, topic];
      localStorage.setItem(`${category}_savedTopics`, JSON.stringify(newSaved));
      toast.custom((t) => (
        <CustomToast message={`Topic "${topic}" added to favorites`} type="success" />
      ));
      setState(prev => ({ ...prev, savedQuestions: newSaved }));
    } else {
      const newSaved = currentSaved.filter(t => t !== topic);
      localStorage.setItem(`${category}_savedTopics`, JSON.stringify(newSaved));
      toast.custom((t) => (
        <CustomToast message={`Topic "${topic}" removed from favorites`} type="info" />
      ));
      setState(prev => ({ ...prev, savedQuestions: newSaved }));
    }
  };

  // Timer for tracking time spent
  useEffect(() => {
    let timer;
    if (state.practiceStarted && !state.showSolution && state.currentQuestion) {
      timer = setInterval(() => {
        setState((prev) => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.practiceStarted, state.showSolution, state.currentQuestion]);

  // Scroll to top of question container when question changes
  useEffect(() => {
    if (state.currentQuestion && questionContainerRef.current) {
      questionContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, [state.currentQuestion, state.currentQuestionIndex]);


  const reportQuestion = async (questionId, reason, topic) => {
    console.log(questionId);
    console.log(reason);
    console.log(topic);
    console.log(state);



    if (!user) {
      toast.error("No user found."); // better to use error toast
      return;
    }
    toast("Reporting...")
  
    try {
      const { error } = await supabase.from("reported_questions").insert({
        question_id: questionId,
        topic,
        user_id: user.email,
        reason,
        reported_at: new Date().toISOString(),
      });
  
      if (error) throw error;
  
      toast.success("Question reported successfully!");
    } catch (error) {
      console.error("Report error:", error);
      toast.error("Failed to report question");
    }
  };


  // Fetch questions for practice
  const fetchQuestions = useCallback(async () => {
    if (!state.selectedTopics.length) {
      toast.custom((t) => (
        <CustomToast message="Please select at least one topic" type="error" />
      ));
      return [];
    }

    try {
      if (showDemoMode) {
        const mockQuestions = Array.from({ length: Math.min(state.totalQuestionsToFetch, 5) }, (_, i) => ({
          _id: `demo-${i}`,
          question: `Sample question ${i + 1} for topic ${state.selectedTopics[i % state.selectedTopics.length]}?`,
          options_A: "First option with some sample text",
          options_B: "Second option with sample text",
          options_C: "Third option that might be correct",
          options_D: "Fourth option as another possibility",
          correct_option: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
          solution: "This is a sample solution for the demo question. In the full version, you'll get detailed explanations for each question.",
          topic: state.selectedTopics[i % state.selectedTopics.length],
          difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
        }));
        return mockQuestions;
      }
    
      const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
    
      let query = supabase
        .from("examtracker")
        .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty")
        .eq("category", category.toUpperCase())
        .in("topic", state.selectedTopics);
    
      if (difficultyFilter !== "all") {
        query = query.eq("difficulty", difficultyFilter);
      }
    
      // Fetch all matching data first
      const { data, error } = await query;
    
      if (error) throw error;
    
      if (!data || data.length === 0) {
        toast.custom((t) => (
          <CustomToast message="No questions available for selected topics" type="error" />
        ));
        return [];
      }
    
      // Shuffle first, then limit
      const shuffled = shuffleArray(data);
      return shuffled.slice(0, state.totalQuestionsToFetch);
    } catch (err) {
      toast.custom((t) => (
        <CustomToast message="Failed to fetch questions" type="error" />
      ));
      console.error(err);
      return [];
    }    
  }, [state.selectedTopics, difficultyFilter, category, state.totalQuestionsToFetch, showDemoMode]);

  // Start practice session
  const startPractice = useCallback(async () => {
    const questions = await fetchQuestions();
    if (!questions.length) return;

    setState((prev) => ({
      ...prev,
      practiceStarted: true,
      points: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      timeSpent: 0,
      questionsQueue: questions,
      currentQuestionIndex: 0,
      currentQuestion: questions[0],
      userAnswer: "",
      showSolution: false,
      answeredQuestionIds: [],
    }));
    
    toast.custom((t) => (
      <CustomToast 
        message={`Practice session started with ${questions.length} questions!`} 
        type="success" 
      />
    ));
  }, [fetchQuestions]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((selectedAnswer) => {
    if (!state.currentQuestion) return;

    const isCorrect = selectedAnswer === state.currentQuestion.correct_option;
    const currentTime = state.timeSpent;

    setState((prev) => {
      const { topic, difficulty } = prev.currentQuestion;
      
      // Update topic performance statistics
      const topicPerformance = { ...prev.statistics.topicPerformance };
      topicPerformance[topic] = topicPerformance[topic] || { correct: 0, total: 0, avgTime: 0 };
      topicPerformance[topic].total += 1;
      if (isCorrect) topicPerformance[topic].correct += 1;
      
      // Update average time for this topic
      topicPerformance[topic].avgTime =
        (topicPerformance[topic].avgTime * (topicPerformance[topic].total - 1) + currentTime) /
        topicPerformance[topic].total;

      // Update difficulty breakdown
      const difficultyBreakdown = { ...prev.statistics.difficultyBreakdown };
      difficultyBreakdown[difficulty.toLowerCase()] =
        (difficultyBreakdown[difficulty.toLowerCase()] || 0) + 1;

      return {
        ...prev,
        userAnswer: selectedAnswer,
        showSolution: true,
        points: isCorrect ? prev.points + 100 : prev.points,
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
        incorrectAnswers: isCorrect ? prev.incorrectAnswers : prev.incorrectAnswers + 1,
        answeredQuestionIds: [...prev.answeredQuestionIds, prev.currentQuestion._id],
        statistics: {
          ...prev.statistics,
          avgTimePerQuestion:
            prev.questionsAnswered > 0
              ? (prev.statistics.avgTimePerQuestion * prev.questionsAnswered + currentTime) /
                (prev.questionsAnswered + 1)
              : currentTime,
          topicPerformance,
          difficultyBreakdown,
        },
      };
    });

    toast.custom((t) => (
      <CustomToast 
        message={isCorrect ? "Correct answer!" : "Incorrect answer"} 
        type={isCorrect ? "success" : "error"} 
      />
    ));
  }, [state.currentQuestion, state.timeSpent]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    const nextIndex = state.currentQuestionIndex + 1;
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      currentQuestion: nextIndex < prev.questionsQueue.length ? prev.questionsQueue[nextIndex] : null,
      userAnswer: "",
      showSolution: false,
      timeSpent: 0,
    }));
  }, [state.currentQuestionIndex, state.questionsQueue]);
  
  // Handle previous question
  const handlePreviousQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      const prevIndex = state.currentQuestionIndex - 1;
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: prevIndex,
        currentQuestion: prev.questionsQueue[prevIndex],
        userAnswer: prev.answeredQuestionIds.includes(prev.questionsQueue[prevIndex]._id) 
          ? prev.questionsQueue[prevIndex].correct_option 
          : "",
        showSolution: prev.answeredQuestionIds.includes(prev.questionsQueue[prevIndex]._id),
        timeSpent: 0,
      }));
    }
  }, [state.currentQuestionIndex, state.questionsQueue, state.answeredQuestionIds]);

  // Reset practice session
  const resetPractice = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestion: null,
      userAnswer: "",
      showSolution: false,
      points: 0,
      timeSpent: 0,
      answeredQuestionIds: [],
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      questionsQueue: [],
      currentQuestionIndex: 0,
      practiceStarted: false,
    }));
  }, []);

  // Handle topic selection
  const handleTopicChange = useCallback((topic) => {
    setState((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter((t) => t !== topic)
        : [...prev.selectedTopics, topic],
    }));
  }, []);
  
  // Select all visible topics
  const selectAllVisibleTopics = useCallback(() => {
    setState((prev) => {
      const currentSelected = new Set(prev.selectedTopics);
      filteredTopics.forEach(topic => currentSelected.add(topic));
      return { ...prev, selectedTopics: Array.from(currentSelected) };
    });
    
    toast.custom((t) => (
      <CustomToast message={`Selected ${filteredTopics.length} topics`} type="success" />
    ));
  }, [filteredTopics]);
  
  // Deselect all visible topics
  const deselectAllVisibleTopics = useCallback(() => {
    setState((prev) => {
      const currentSelected = new Set(prev.selectedTopics);
      filteredTopics.forEach(topic => currentSelected.delete(topic));
      return { ...prev, selectedTopics: Array.from(currentSelected) };
    });
    
    toast.custom((t) => (
      <CustomToast message="Deselected filtered topics" type="info" />
    ));
  }, [filteredTopics]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setShowBookmarked(false);
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }
    
    toast.custom((t) => (
      <CustomToast message="All filters cleared" type="info" />
    ));
  }, []);

  // Download practice statistics
  const downloadStatistics = useCallback(() => {
    if (!state.questionsAnswered) {
      toast.custom((t) => (
        <CustomToast message="No statistics available to download" type="error" />
      ));
      return;
    }
    
    const statsData = {
      date: new Date().toISOString(),
      category,
      totalQuestions: state.questionsAnswered,
      correctAnswers: state.correctAnswers,
      incorrectAnswers: state.incorrectAnswers,
      accuracy: `${Math.round((state.correctAnswers / state.questionsAnswered) * 100)}%`,
      avgTimePerQuestion: formatTime(Math.round(state.statistics.avgTimePerQuestion)),
      topicPerformance: Object.entries(state.statistics.topicPerformance).map(([topic, stats]) => ({
        topic,
        accuracy: `${Math.round((stats.correct / stats.total) * 100)}%`,
        correct: stats.correct,
        total: stats.total,
        avgTime: formatTime(Math.round(stats.avgTime))
      })),
      difficultyBreakdown: state.statistics.difficultyBreakdown
    };
    
    const dataStr = JSON.stringify(statsData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${category}_practice_stats_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.custom((t) => (
      <CustomToast message="Statistics downloaded successfully" type="success" />
    ));
  }, [state.statistics, state.questionsAnswered, state.correctAnswers, state.incorrectAnswers, category]);

  // Handle sorting for topic performance
  const sortedTopicPerformance = useMemo(() => {
    const performanceArray = Object.entries(state.statistics.topicPerformance);
    return performanceArray.sort(([topicA, statsA], [topicB, statsB]) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case "topic":
          comparison = topicA.localeCompare(topicB);
          break;
        case "accuracy":
          comparison = (statsA.correct / statsA.total) - (statsB.correct / statsB.total);
          break;
        case "avgTime":
          comparison = statsA.avgTime - statsB.avgTime;
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === "ascending" ? comparison : -comparison;
    });
  }, [state.statistics.topicPerformance, sortConfig]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-indigo-50 to-white">
        <MetaDataJobs
          seoTitle={` Practice Tracker`}
          seoDescription={`Practice PYQs Topic-Wise Chapter-Wise Date-Wise questions with detailed solutions.`}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-md flex items-center space-x-6 max-w-md border border-indigo-100"
        >
          <div className="h-16 w-16 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin"></div>
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-1">
              Loading subjects
            </h3>
            <p className="text-gray-500">Please wait a moment...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  
  // Render unauthorized state
  if (!user) {
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 pb-8 sm:pt-24 sm:pb-16 mt-32">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access practice content</p>
            <button
              onClick={() => openAuthModal()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center mx-auto shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.564,9.505-11.622H12.545z"/>
              </svg>
              Sign in with Google
            </button>
            
            
          </div>
        </div>
      </div>
    );
  }

  // Render no access state (with demo option)
  if (!hasAccess && !showDemoMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 pb-8 sm:pt-24 sm:pb-16 mt-16 sm:mt-20 mt-32">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
              <p className="text-gray-600 mb-6">
                You need to purchase a plan to access full {category.toUpperCase()} practice content
              </p>
              <div className="mb-6">
                <a
                  href={`/${category}`}
                  className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Purchase Access
                </a>
              </div>
              
              {/* Demo mode option */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-500 mb-4">Want to try before purchasing?</p>
                <button
                  onClick={() => setShowDemoMode(true)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Try Demo Mode
                </button>
              </div>
            </div>
          </div>
        </div>
</div>
    );
  }

  // Render topic selection
  if (!state.practiceStarted) {
    return (
      <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-4 sm:p-6 pt-16 mt-32">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Demo mode banner */}
            {/* {showDemoMode && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                    <p>You&apos;re currently in demo mode with limited questions and features. Purchase access for the full experience.</p>
                      <a href={`/${category}`}
                          className="mt-2 text-yellow-800 font-medium hover:text-yellow-600 underline"
                        >
                          Upgrade Now
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
            )} */}

<div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">BETA Version Mode</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                    <p>You&apos;re currently using the Beta version, so there might be some errors or issues. We would greatly appreciate it if you report them. If no questions are showing, click on any option and then click &apos;Next.&apos;</p>
                       
                      </div>
                    </div>
                  </div>
                </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Practice {category.toUpperCase()} Questions
            </h1>

            {/* Topic selection header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-3 md:space-y-0">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-gray-700">Select Topics to Practice</h2>
                <p className="text-sm text-gray-500">
                  Choose one or more topics you want to practice
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm flex items-center hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  {showFilters ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                </button>
                
                <button
                  onClick={() => setTopicView(topicView === "grid" ? "list" : "grid")}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm flex items-center hover:bg-gray-50"
                >
                  {topicView === "grid" ? (
                    <>
                      <List className="h-4 w-4 mr-1" />
                      List View
                    </>
                  ) : (
                    <>
                      <Grid className="h-4 w-4 mr-1" />
                      Grid View
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Filters section */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-3 md:items-center mb-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search topics..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-shrink-0">
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowBookmarked(!showBookmarked)}
                      className={`flex items-center px-3 py-2 border rounded-md shadow-sm text-sm ${
                        showBookmarked 
                          ? "bg-indigo-100 border-indigo-300 text-indigo-800" 
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      {showBookmarked ? (
                        <>
                          <Bookmark className="h-4 w-4 mr-1" />
                          Favorites
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-4 w-4 mr-1" />
                          Show Favorites
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <FilterX className="h-4 w-4 mr-1" />
                      Clear Filters
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={selectAllVisibleTopics}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full hover:bg-indigo-200"
                  >
                    Select All Visible ({filteredTopics.length})
                  </button>
                  
                  {state.selectedTopics.length > 0 && (
                    <button
                      onClick={deselectAllVisibleTopics}
                      className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full hover:bg-gray-200"
                    >
                      Deselect Visible
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Selected topics summary */}
            {state.selectedTopics.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-blue-800 font-medium">
                      {state.selectedTopics.length} topic{state.selectedTopics.length !== 1 ? 's' : ''} selected
                    </span>
                    <p className="text-sm text-blue-600 mt-1">
                      {state.selectedTopics.slice(0, 3).join(", ")}
                      {state.selectedTopics.length > 3 ? ` and ${state.selectedTopics.length - 3} more...` : ""}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={startPractice}
                      disabled={state.selectedTopics.length === 0}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ChevronRight className="h-5 w-5 mr-1" />
                      Start Practice
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Topics list */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredTopics.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No topics found"
                message="Try adjusting your search or filters"
                action={
                  <button
                    onClick={clearFilters}
                    className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md hover:bg-indigo-200"
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className={topicView === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" : "space-y-2"}>
                {filteredTopics.map((topic) => (
                  <div
                    key={topic}
                    className={`
                      border rounded-md relative overflow-hidden
                      ${topicView === "grid" ? "p-4" : "p-3"}
                      ${state.selectedTopics.includes(topic) ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200 hover:bg-gray-50"}
                      transition-colors duration-150
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{topic}</h3>
                         
                      </div>
                      <div className="flex ml-2 space-x-1">
                        <button
                          onClick={() => saveTopic(topic)}
                          className="text-gray-400 hover:text-indigo-600 focus:outline-none"
                          title={savedTopics.includes(topic) ? "Remove from favorites" : "Add to favorites"}
                        >
                          {savedTopics.includes(topic) ? (
                            <Bookmark className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <BookmarkPlus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-end">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.selectedTopics.includes(topic)}
                          onChange={() => handleTopicChange(topic)}
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded transition duration-150 ease-in-out"
                        />
                        <span className="ml-2 text-xs font-medium text-gray-700">
                          {state.selectedTopics.includes(topic) ? "Selected" : "Select"}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  // Render practice session
  return (
    <div className="min-h-screen bg-gray-50">
      <MetaDataJobs
                    seoTitle={`Practice Unlimited ${category}`}
                    seoDescription={`Boost your CSE 2025 placement prep with the Placement Tracker Sheet CSE 2025. Organize coding practice, aptitude tests, interviews, and deadlines.`}
                  />
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6 pt-16 mt-32">
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          {/* Practice header */}
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Practice {category.toUpperCase()}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {state.selectedTopics.length} topic{state.selectedTopics.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm flex items-center hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </button>
                
                <button
                  onClick={resetPractice}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm flex items-center hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </button>
              </div>
            </div>
            
            {/* Settings panel */}
            {showSettings && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Practice Settings</h3>
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showProgressMeter}
                      onChange={() => setShowProgressMeter(!showProgressMeter)}
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show progress meter</span>
                  </label>
                  
                   
                </div>
              </div>
            )}
            
            {/* Progress bar */}
            {showProgressMeter && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Question {state.currentQuestionIndex + 1} of {state.questionsQueue.length}</span>
                  <span>{Math.round((state.questionsAnswered / state.questionsQueue.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${(state.currentQuestionIndex / state.questionsQueue.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Question content */}
          <div ref={questionContainerRef} className="p-4 sm:p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {state.currentQuestion ? (
              <div>
                {/* Stats row */}
                <div className="flex flex-wrap gap-3 mb-4 text-xs sm:text-sm">
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {state.currentQuestion.topic}
                  </div>
                  
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {state.currentQuestion.difficulty?.charAt(0).toUpperCase() + state.currentQuestion.difficulty?.slice(1)}
                  </div>
                  
                  {!state.showSolution && (
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(state.timeSpent)}
                    </div>
                  )}
                </div>
                
                {/* Question */}
                <MathJaxContext config={config}>
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Question:</h2>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <MathJax hideUntilTypeset={"first"} inline dynamic>
                        <div 
                          dangerouslySetInnerHTML={{ __html: state.currentQuestion.question }}
                          className="prose prose-indigo max-w-none"
                        />
                      </MathJax>
                    </div>
                  </div>
                  
                  {/* Options */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Options:</h3>
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <button
                          key={option}
                          onClick={() => !state.showSolution && handleAnswerSelect(option)}
                          disabled={state.showSolution}
                          className={`w-full text-left p-3 rounded-md border flex items-start transition-colors ${
                            state.showSolution && option === state.currentQuestion.correct_option
                              ? "bg-green-50 border-green-300"
                              : state.showSolution && option === state.userAnswer && option !== state.currentQuestion.correct_option
                              ? "bg-red-50 border-red-300"
                              : state.userAnswer === option
                              ? "bg-indigo-50 border-indigo-300"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            <div className={`flex items-center justify-center h-6 w-6 rounded-full ${
                              state.showSolution && option === state.currentQuestion.correct_option
                                ? "bg-green-500 text-white"
                                : state.showSolution && option === state.userAnswer && option !== state.currentQuestion.correct_option
                                ? "bg-red-500 text-white"
                                : state.userAnswer === option
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}>
                              {option}
                            </div>
                          </div>
                          <div className="flex-1">
                            <MathJax hideUntilTypeset={"first"} inline dynamic>
                              <div 
                                dangerouslySetInnerHTML={{ __html: state.currentQuestion[`options_${option}`] }} 
                                className="prose prose-sm max-w-none"
                              />
                            </MathJax>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Solution */}
                  {state.showSolution && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Explanation:</h3>
                      <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                        <MathJax>
                          {/* <div 
                            dangerouslySetInnerHTML={{ __html: state.currentQuestion.solution }} 
                            className="prose prose-indigo max-w-none"
                          /> */}
                          <a href={`${state.currentQuestion.solution}`}>{state.currentQuestion.solution}</a>
                        </MathJax>
                      </div>
                    </div>
                  )}
                </MathJaxContext>
              </div>
            ) : (
              // Practice completed
              <div className="py-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Practice Completed!</h2>
                  <p className="text-gray-500 mt-1">You&apos;ve finished all questions in this session</p>
                </div>
                
                {/* Stats summary */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <p className="text-xs text-indigo-700 uppercase font-semibold">Total</p>
                    <p className="text-2xl font-bold text-indigo-900">{state.questionsAnswered}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-md">
                    <p className="text-xs text-green-700 uppercase font-semibold">Correct</p>
                    <p className="text-2xl font-bold text-green-900">{state.correctAnswers}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-xs text-red-700 uppercase font-semibold">Incorrect</p>
                    <p className="text-2xl font-bold text-red-900">{state.incorrectAnswers}</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-xs text-blue-700 uppercase font-semibold">Accuracy</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {state.questionsAnswered > 0
                        ? `${Math.round((state.correctAnswers / state.questionsAnswered) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
                
                {/* Topic performance */}
                {Object.keys(state.statistics.topicPerformance).length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Topic Performance</h3>
                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => setSortConfig({
                                  key: 'topic',
                                  direction: sortConfig.key === 'topic' && sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
                                })}
                              >
                                Topic
                                {sortConfig.key === 'topic' && (
                                  <span className="ml-1">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                )}
                              </th>
                              <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => setSortConfig({
                                  key: 'accuracy',
                                  direction: sortConfig.key === 'accuracy' && sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
                                })}
                              >
                                Accuracy
                                {sortConfig.key === 'accuracy' && (
                                  <span className="ml-1">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                )}
                              </th>
                              <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => setSortConfig({
                                  key: 'avgTime',
                                  direction: sortConfig.key === 'avgTime' && sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
                                })}
                              >
                                Avg. Time
                                {sortConfig.key === 'avgTime' && (
                                  <span className="ml-1">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                )}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedTopicPerformance.map(([topic, stats]) => (
                              <tr key={topic} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {topic}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 w-24">
                                      <div
                                        className="bg-indigo-600 h-2.5 rounded-full"
                                        style={{ width: `${Math.round((stats.correct / stats.total) * 100)}%` }}
                                      ></div>
                                    </div>
                                    <span>{Math.round((stats.correct / stats.total) * 100)}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatTime(Math.round(stats.avgTime))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={downloadStatistics}
                    className="px-4 py-2 flex items-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Statistics
                  </button>
                  
                  <button
                    onClick={resetPractice}
                    className="px-4 py-2 flex items-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Practice Again
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Question navigation */}
          {state.currentQuestion && (
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between space-x-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={state.currentQuestionIndex === 0}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              <button
                  onClick={() => reportQuestion(state.currentQuestion._id, "Question Not Upto The Mark.", state.currentQuestion.topic)}
                  className={`px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center
                  }`}
                >
                  <AlertTriangle size={16} className="mr-2" />
                   Report Question
                </button>
              
              {!state.showSolution ? (
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Time: {formatTime(state.timeSpent)}
                </div>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeUnlimited;