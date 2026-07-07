"use client";
import React, { useState, useReducer, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  Clock,
  ChevronRight,
  BookOpen,
  RotateCcw,
  LineChart,
  Settings,
  Search,
  Download,
  BarChart2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { usePDF } from "react-to-pdf";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import {
  isAnswerCorrect,
  isInlineAnswerQuestion,
  getVisibleMcqOptions,
} from "@/lib/questionAnswerMode";
import InlineAnswerInput from "@/components/InlineAnswerInput";

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
// Reducer for state management
const initialState = {
  selectedTopics: [],
  currentQuestion: null,
  userAnswer: "",
  points: 0,
  timeSpent: 0,
  totalTime: 0,
  answeredQuestionIds: [],
  testStarted: false,
  questionsAnswered: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  questionsQueue: [],
  currentQuestionIndex: 0,
  totalQuestionsToFetch: 10,
  answerHistory: [],
  statistics: {
    avgTimePerQuestion: 0,
    topicPerformance: {},
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_TOPICS":
      return { ...state, selectedTopics: action.payload };
    case "START_TEST":
      return { ...state, ...action.payload, testStarted: true };
    case "ANSWER_QUESTION":
      return { ...state, ...action.payload };
    case "NEXT_QUESTION":
      return { ...state, ...action.payload, timeSpent: 0 };
    case "RESET_TEST":
      return { ...initialState };
    case "UPDATE_TIME":
      return { ...state, timeSpent: state.timeSpent + 1, totalTime: state.totalTime + 1 };
    case "SET_TOTAL_QUESTIONS":
      return { ...state, totalQuestionsToFetch: action.payload };
    default:
      return state;
  }
};

// Custom hook for fetching topics and access status
const useTopics = (category) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  const fetchOrderStatus = useCallback(async () => {
    // const { data, error } = await supabase
    //   .from("orders")
    //   .select("status")
    //   .eq("user_email", email)
    //   .eq("plan", category)
    //   .limit(1);

    // if (error) throw new Error(error.message);
    return true;
  }, [category]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchOrderStatus()
      .then(setHasAccess)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [user, fetchOrderStatus]);

  useEffect(() => {
    if (!hasAccess || !category) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/allsubtopics?category=${category}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch topics");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
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
  }, [category, hasAccess]);

  return { topics, subjectData, isLoading, error, hasAccess };
};

// // AuthModal Component
// const AuthModal = ({ isOpen, onClose, onGoogleSignIn }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 max-w-sm w-full">
//         <h2 className="text-xl font-semibold mb-4">Sign In</h2>
//         <button
//           onClick={onGoogleSignIn}
//           className="w-full bg-indigo-600 text-white py-2 rounded-md flex items-center justify-center hover:bg-indigo-700"
//         >
//           <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
//             <path
//               fill="currentColor"
//               d="M12.24 10.667V13.8h3.818c-.152.965-1.14 2.833-3.818 2.833-2.3 0-4.167-1.904-4.167-4.25s1.867-4.25 4.167-4.25c1.3 0 2.167.548 2.667 1.024L16 7.583c-1.167-.833-2.667-1.333-4-1.333-3.333 0-6 2.667-6 6s2.667 6 6 6c3.467 0 5.833-2.5 5.833-6 0-.4-.033-.833-.093-1.233H12.24z"
//             />
//           </svg>
//           Sign in with Google
//         </button>
//         <button
//           onClick={onClose}
//           className="mt-4 text-sm text-gray-600 hover:underline w-full text-center"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// };

// Utility function to format time
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Test = () => {
  const { category } = useParams();
  const { user, openAuthModal } = useAuth();
  const { topics, isLoading, error, hasAccess } = useTopics(category);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toPDF, targetRef } = usePDF({ filename: `test_summary_${category}.pdf` });

  // Memoized filtered topics
  const filteredTopics = useMemo(() =>
    topics.filter((topic) =>
      topic?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [topics, searchQuery]);

  // Timer for tracking time spent
  useEffect(() => {
    let timer;
    if (state.testStarted && state.currentQuestion) {
      timer = setInterval(() => dispatch({ type: "UPDATE_TIME" }), 1000);
    }
    return () => clearInterval(timer);
  }, [state.testStarted, state.currentQuestion]);

  // Fetch questions for test
  const fetchQuestions = useCallback(async () => {
    if (!state.selectedTopics.length) {
      toast.error("Please select at least one topic");
      return [];
    }

    try {
      let query = supabase
        .from("examtracker")
        .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, solutiontext, topic, difficulty")
        .eq("category", category.toUpperCase())
        .in("topic", state.selectedTopics);

      if (difficultyFilter !== "all") query = query.eq("difficulty", difficultyFilter);

      const { data, error } = await query.limit(state.totalQuestionsToFetch);
      if (error) throw error;
      if (!data?.length) {
        toast.error("No questions available for selected topics");
        return [];
      }
      return data.sort(() => Math.random() - 0.5);
    } catch (err) {
      toast.error("Failed to fetch questions");
      console.error(err);
      return [];
    }
  }, [state.selectedTopics, difficultyFilter, category, state.totalQuestionsToFetch]);


    useEffect(() => {
      window.MathJax = {
        tex: {
          inlineMath: [["$", "$"], ["\\(", "\\)"]],
          processEscapes: true,
        },
        svg: { fontCache: "global" },
      };
    }, [state.currentQuestion]);


  // Start test
  const startTest = useCallback(async () => {
    const questions = await toast.promise(fetchQuestions(), {
      loading: "Fetching questions...",
      success: (questions) => {
        if (!questions.length) throw new Error("No questions found");
        return `Test started with ${questions.length} questions!`;
      },
      error: "Failed to fetch questions",
    });

    if (!questions.length) return;

    dispatch({
      type: "START_TEST",
      payload: {
        questionsQueue: questions,
        currentQuestion: questions[0],
        currentQuestionIndex: 0,
        points: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeSpent: 0,
        totalTime: 0,
        answerHistory: [],
      },
    });
  }, [fetchQuestions]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((selectedAnswer) => {
    if (!state.currentQuestion) return;

    const isCorrect = isAnswerCorrect(
      selectedAnswer,
      state.currentQuestion.correct_option,
      state.currentQuestion
    );
    const { topic, difficulty } = state.currentQuestion;

    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        userAnswer: selectedAnswer,
        points: isCorrect ? state.points + 100 : state.points,
        questionsAnswered: state.questionsAnswered + 1,
        correctAnswers: isCorrect ? state.correctAnswers + 1 : state.correctAnswers,
        incorrectAnswers: isCorrect ? state.incorrectAnswers : state.incorrectAnswers + 1,
        answeredQuestionIds: [...state.answeredQuestionIds, state.currentQuestion._id],
        answerHistory: [
          ...state.answerHistory,
          {
            questionId: state.currentQuestion._id,
            question: state.currentQuestion.question,
            userAnswer: selectedAnswer,
            correctAnswer: state.currentQuestion.correct_option,
            isCorrect,
            timeSpent: state.timeSpent,
            solutiontext: state.currentQuestion.solutiontext,
            solution: state.currentQuestion.solution,
          },
        ],
        statistics: {
          ...state.statistics,
          avgTimePerQuestion:
            state.questionsAnswered > 0
              ? (state.statistics.avgTimePerQuestion * state.questionsAnswered + state.timeSpent) /
                (state.questionsAnswered + 1)
              : state.timeSpent,
          topicPerformance: {
            ...state.statistics.topicPerformance,
            [topic]: {
              correct: (state.statistics.topicPerformance[topic]?.correct || 0) + (isCorrect ? 1 : 0),
              total: (state.statistics.topicPerformance[topic]?.total || 0) + 1,
              avgTime:
                ((state.statistics.topicPerformance[topic]?.avgTime || 0) *
                  (state.statistics.topicPerformance[topic]?.total || 0) + state.timeSpent) /
                ((state.statistics.topicPerformance[topic]?.total || 0) + 1),
            },
          },
          difficultyBreakdown: {
            ...state.statistics.difficultyBreakdown,
            [difficulty.toLowerCase()]: (state.statistics.difficultyBreakdown[difficulty.toLowerCase()] || 0) + 1,
          },
        },
      },
    });
  }, [state.currentQuestion, state.points, state.questionsAnswered, state.correctAnswers, state.incorrectAnswers, state.answeredQuestionIds, state.timeSpent, state.answerHistory, state.statistics]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    const nextIndex = state.currentQuestionIndex + 1;
    dispatch({
      type: "NEXT_QUESTION",
      payload: {
        currentQuestionIndex: nextIndex,
        currentQuestion: state.questionsQueue[nextIndex] || null,
        userAnswer: "",
      },
    });
  }, [state.currentQuestionIndex, state.questionsQueue]);

  // Reset test
  const resetTest = useCallback(() => {
    dispatch({ type: "RESET_TEST" });
  }, []);

  // Render unauthorized state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="pt-24 pb-16 mt-24">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access test content.</p>
            <button
              onClick={() => openAuthModal()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center mx-auto"
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

  // Render no access state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="pt-24 pb-16 mt-24">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
            <p className="text-gray-600 mb-6">Purchase a plan to access {category} test content.</p>
            {/* Add BuyNow component or link here */}
          </div>
        </div>
</div>
    );
  }

  // Render topic selection
  if (!state.testStarted) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <Navbar
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="container mx-auto px-4 py-6 mt-24">
          <div className="flex flex-col lg:flex-row gap-4">
            <div
              className={`w-full lg:w-1/4 bg-white rounded-xl shadow-lg p-4 ${isSidebarOpen ? "block" : "hidden"}`}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                Test Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                    <span className="ml-1 text-gray-400 cursor-help" title="Choose 1-100 questions">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={state.totalQuestionsToFetch}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_TOTAL_QUESTIONS",
                        payload: Math.max(1, Math.min(100, parseInt(e.target.value) || 10)),
                      })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                    <span className="ml-1 text-gray-400 cursor-help" title="Filter by difficulty">ⓘ</span>
                  </label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Topics
                    <span className="ml-1 text-gray-400 cursor-help" title="Search topics">ⓘ</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full p-2 border rounded-lg focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3">
                  {isLoading ? (
                    <div className="text-center text-gray-500">Loading...</div>
                  ) : error ? (
                    <div className="text-center text-red-500">Error: {error}</div>
                  ) : filteredTopics.length === 0 ? (
                    <div className="text-center text-gray-500">No topics found</div>
                  ) : (
                    filteredTopics.map((topic) => (
                      <label key={topic} className="flex items-center p-2 hover:bg-gray-100 rounded">
                        <input
                          type="checkbox"
                          checked={state.selectedTopics.includes(topic)}
                          onChange={() =>
                            dispatch({
                              type: "SET_TOPICS",
                              payload: state.selectedTopics.includes(topic)
                                ? state.selectedTopics.filter((t) => t !== topic)
                                : [...state.selectedTopics, topic],
                            })
                          }
                          className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                          aria-label={`Topic ${topic}`}
                        />
                        <span className="ml-2 text-sm text-gray-700">{topic}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Selected Topics: {state.selectedTopics.length}</p>
                  <p className="text-sm text-gray-600">
                    Estimated Duration: ~{Math.round(state.totalQuestionsToFetch * 1.5)} minutes
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => dispatch({ type: "SET_TOPICS", payload: topics })}
                    className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm hover:bg-indigo-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => dispatch({ type: "SET_TOPICS", payload: [] })}
                    className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-indigo-600" />
                Start Your Test
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-indigo-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 text-center">
                  Welcome to Your Test Preparation
                </h3>
                <p className="text-gray-600 text-base text-center">
                  Prepare for your exams with our comprehensive test platform. Customize your test by selecting topics, difficulty, and number of questions. Track progress and review detailed solutions.
                </p>
                <p className="text-gray-600 text-base text-center">
                  You have chosen <span className="font-medium">{state.selectedTopics.length}</span> topics and{" "}
                  <span className="font-medium">{state.totalQuestionsToFetch}</span> questions.
                </p>
                <button
                  onClick={startTest}
                  disabled={isLoading || !state.selectedTopics.length}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Start Test Now!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render test session
  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <Navbar
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="container mx-auto px-4 py-6 mt-24">
        {state.currentQuestion ? (
          <MathJaxContext config={config}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div
                className={`w-full lg:w-1/4 bg-white rounded-xl shadow-lg p-4 ${isSidebarOpen ? "block" : "hidden"}`}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <LineChart className="h-5 w-5 mr-2 text-indigo-600" />
                  Test Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Time</p>
                    <p className="text-lg font-semibold">{formatTime(state.totalTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Questions</p>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-semibold">
                        {state.currentQuestionIndex + 1}/{state.questionsQueue.length}
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${((state.currentQuestionIndex + 1) / state.questionsQueue.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {state.questionsQueue.map((q, index) => (
                        <button
                          key={index}
                          className={`p-2 text-sm rounded-md ${
                            index === state.currentQuestionIndex
                              ? "bg-indigo-600 text-white"
                              : state.answeredQuestionIds.includes(q._id)
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                          onClick={() => {
                            dispatch({
                              type: "NEXT_QUESTION",
                              payload: {
                                currentQuestionIndex: index,
                                currentQuestion: state.questionsQueue[index],
                                userAnswer: state.answerHistory.find((a) => a.questionId === q._id)?.userAnswer || "",
                              },
                            });
                          }}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-lg font-semibold">{state.points}</p>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                  <div className="flex items-center space-x-4 mb-3 lg:mb-0">
                    <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full flex items-center text-sm font-medium">
                      <Clock className="h-5 w-5 mr-2" />
                      {formatTime(state.timeSpent)}
                    </span>
                    <span className="text-base font-medium">
                      Question {state.currentQuestionIndex + 1} of {state.questionsQueue.length}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">Topic: {state.currentQuestion.topic}</span>
                </div>
                <MathJax hideUntilTypeset={"first"} inline dynamic>
                  <div
                    dangerouslySetInnerHTML={{ __html: state.currentQuestion.question }}
                    className="text-lg mb-8 prose max-w-none leading-relaxed"
                  />
                  {isInlineAnswerQuestion(state.currentQuestion) ? (
                    <div className="mb-8">
                      <InlineAnswerInput
                        value={state.userAnswer || ""}
                        onChange={(value) =>
                          dispatch({
                            type: "ANSWER_QUESTION",
                            payload: { userAnswer: value },
                          })
                        }
                        onSubmit={() => handleAnswerSelect(state.userAnswer)}
                        submitted={!!state.userAnswer && state.answeredQuestionIds.includes(state.currentQuestion._id)}
                        isCorrect={
                          state.answeredQuestionIds.includes(state.currentQuestion._id) &&
                          isAnswerCorrect(
                            state.userAnswer,
                            state.currentQuestion.correct_option,
                            state.currentQuestion
                          )
                        }
                        correctOption={state.currentQuestion.correct_option}
                      />
                    </div>
                  ) : (
                    getVisibleMcqOptions(state.currentQuestion).map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-5 border rounded-lg mb-3 cursor-pointer transition-all ${
                        state.userAnswer === option ? "bg-indigo-50 border-indigo-500" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={state.userAnswer === option}
                        onChange={() => handleAnswerSelect(option)}
                        disabled={state.userAnswer && state.userAnswer !== option}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 mr-4"
                        aria-label={`Option ${option}`}
                      />
                      <span
                        dangerouslySetInnerHTML={{ __html: state.currentQuestion[`options_${option}`] }}
                        className="flex-1 text-base"
                      />
                    </label>
                  ))
                  )}
                </MathJax>
                <div className="flex justify-between mt-8">
                  <button
                    onClick={resetTest}
                    className="bg-gray-100 text-gray-700 px-5 py-3 rounded-lg flex items-center hover:bg-gray-200"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" /> End Test
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={!state.userAnswer}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-lg flex items-center hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {state.currentQuestionIndex + 1 === state.questionsQueue.length ? "Finish" : "Next"}
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </MathJaxContext>
        ) : (
          <MathJaxContext config={config}>
            <div ref={targetRef} className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <LineChart className="h-6 w-6 mr-2 text-indigo-600" />
                Test Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-600">Total Score</p>
                  <p className="text-2xl font-bold">{state.points}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {state.questionsAnswered > 0
                      ? Math.round((state.correctAnswers / state.questionsAnswered) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Time</p>
                  <p className="text-2xl font-bold">{formatTime(state.totalTime)}</p>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-indigo-600" />
                  Topic Performance
                </h3>
                <div className="space-y-4">
                  {Object.entries(state.statistics.topicPerformance).map(([topic, stats]) => (
                    <div key={topic} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-800 text-base">{topic}</span>
                        <span className="text-sm text-gray-600">
                          {stats.correct}/{stats.total} Correct
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>Accuracy: {Math.round((stats.correct / stats.total) * 100)}%</span>
                        <span>Avg Time: {formatTime(Math.round(stats.avgTime))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Difficulty Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(state.statistics.difficultyBreakdown).map(([difficulty, count]) => (
                    <div key={difficulty} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 capitalize">{difficulty}</p>
                      <p className="text-lg font-semibold">{count} Questions</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Answers</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {state.answerHistory.map((_, index) => (
                    <button
                      key={index}
                      className={`px-3 py-1 rounded-md text-sm ${
                        state.answerHistory[index].isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                      onClick={() => {
                        document.getElementById(`answer-${index}`).scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {state.answerHistory.map((answer, index) => (
                    <div key={index} id={`answer-${index}`} className="p-4 bg-gray-50 rounded-lg">
                      <MathJax hideUntilTypeset={"first"} inline dynamic>
                        <h4 className="font-medium text-gray-800 mb-2 text-base">Question {index + 1}</h4>
                        <p
                          className="text-sm text-gray-800 mb-2"
                          dangerouslySetInnerHTML={{ __html: answer.question }}
                        />
                        <p className="text-sm">
                          Your Answer: <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>{answer.userAnswer}</span>
                        </p>
                        {!answer.isCorrect && (
                          <p className="text-sm">Correct Answer: <span className="text-green-600">{answer.correctAnswer}</span></p>
                        )}
                        <p className="text-sm text-gray-600">Time Spent: {formatTime(answer.timeSpent)}</p>
                        <div className="mt-2">
                        

                          <h5 className="text-sm font-semibold text-gray-800">Solution:</h5>
                          <div
                            dangerouslySetInnerHTML={{ __html: answer.solutiontext }}
                            className="prose max-w-none text-sm"
                          />
                          {answer.solution && (
                            <span>
                              {answer.solution}
                              </span>

                          )}
                        </div>
                      </MathJax>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={resetTest}
                  className="bg-gray-100 text-gray-700 px-5 py-3 rounded-lg flex items-center hover:bg-gray-200"
                >
                  <RotateCcw className="h-5 w-5 mr-2" /> Start New Test
                </button>
              </div>
            </div>
          </MathJaxContext>
        )}
      </div>
</div>
  );
};

export default Test;