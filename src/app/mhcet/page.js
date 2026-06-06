"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { createClient } from "@supabase/supabase-js";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import toast from "react-hot-toast";
import debounce from "lodash/debounce";
import AuthModal from "@/components/AuthModal";
import Navbar from "@/components/Navbar";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Something went wrong. Please refresh the page.
          </h1>
        </div>
      );
    }
    return this.props.children;
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyHHobmWFRWb_ZnKhs3JXSCKdbTQaNHW8",
  authDomain: "examtracker-6731e.firebaseapp.com",
  projectId: "examtracker-6731e",
  storageBucket: "examtracker-6731e.firebasestorage.app",
  messagingSenderId: "492165379080",
  appId: "1:492165379080:web:6c71aa16d2447f81348dbd",
  measurementId: "G-Z5B4SRV9H7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    fetch: (...args) => fetch(...args),
  }
);

const Mhcettracker = () => {
  const [data, setData] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [user, setUser] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({
    completedTopics: [],
    completedCount: 0,
    completionPercentage: 0,
    totalCompletedQuestions: 0,
    totalCorrectAnswers: 0,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [fetchProgressCallCount, setFetchProgressCallCount] = useState(0);
  const searchInputRef = useRef(null);

  const apiEndpoint = "/api/mhcet/allsubtopics";
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

  // Fetch subjects data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch data");
        const responseData = await response.json();
        console.log("API Response:", responseData);
        const subjectsData = responseData.subjectsData || [];
        setData(subjectsData);
        console.log("Set Data:", subjectsData);
        setActiveSubject(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        const sampleData = {
          subjectsData: [
            {
              subject: "Compiler Design",
              subtopics: [
                { title: "lexical-analysis", count: 19 },
                { title: "parsing", count: 82 },
              ],
            },
            {
              subject: "Theory of Computation",
              subtopics: [
                { title: "finite-automata", count: 73 },
                { title: "turing-machine", count: 13 },
              ],
            },
          ],
        };
        setData(sampleData.subjectsData);
        console.log("Fallback Data:", sampleData.subjectsData);
        setActiveSubject(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Firebase Authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserProgress(currentUser.uid);
      } else {
        setUserProgress({});
        setProgress({
          completedTopics: [],
          completedCount: 0,
          completionPercentage: 0,
          totalCompletedQuestions: 0,
          totalCorrectAnswers: 0,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user progress for all topics
  const fetchUserProgress = useCallback(
    debounce(async (uid) => {
      setFetchProgressCallCount((prev) => {
        const newCount = prev + 1;
        console.log(`User Progress API Call #${newCount} for user: ${uid}`);
        return newCount;
      });

      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("topic, completedquestions, correctanswers, points")
          .eq("user_id", uid)
          .eq("area", "mhcet");

        if (error) throw error;

        const progressData = (data || []).reduce((acc, item) => {
          acc[item.topic] = {
            completedQuestions: item.completedquestions || [],
            correctAnswers: item.correctanswers || [],
            points: item.points || 0,
          };
          return acc;
        }, {});

        setUserProgress(progressData);
        console.log("Fetched User Progress:", progressData);
      } catch (error) {
        console.error("Progress fetch error:", error);
        toast.error("Failed to load progress");
        setUserProgress({});
      }
    }, 300),
    []
  );

  // Debounced function to update progress in Supabase
  const debouncedUpdateProgress = useCallback(
    debounce(async (topic, updatedProgress) => {
      if (!user) return;

      try {
        const { data, error } = await upsertUserProgress(
          supabase,
          {
            user_id: user.uid,
            topic: topic,
            completedquestions: updatedProgress.completedQuestions,
            correctanswers: updatedProgress.correctAnswers,
            points: updatedProgress.points,
            area: "mhcet",
          },
          { select: "*" }
        );

        if (error) throw error;
        console.log("Progress updated for topic", topic, ":", data);
      } catch (error) {
        console.error("Progress update error:", error);
        toast.error(`Failed to update progress: ${error.message}`);
      }
    }, 500),
    [user]
  );

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setShowAuthModal(false);
      toast.success("Successfully signed in!");
      fetchUserProgress(result.user.uid);
    } catch (error) {
      toast.error("Authentication failed");
      console.error(error);
    }
  };

  // Calculate total questions across all topics
  const calculateTotalQuestions = () => {
    return data.reduce(
      (acc, subject) =>
        acc +
        (subject.subtopics || []).reduce(
          (sum, topic) => sum + (topic.count || 0),
          0
        ),
      0
    );
  };

  // Calculate overall progress metrics
  const calculateOverallProgress = () => {
    const totalQuestions = calculateTotalQuestions();
    const totalTopics = data.flatMap(
      (subject) => subject.subtopics || []
    ).length;

    const totalCompletedQuestions = Object.values(userProgress).reduce(
      (acc, topic) => acc + (topic.completedQuestions?.length || 0),
      0
    );
    const totalCorrectAnswers = Object.values(userProgress).reduce(
      (acc, topic) => acc + (topic.correctAnswers?.length || 0),
      0
    );

    const completedTopics = Object.keys(userProgress).filter(
      (topic) => userProgress[topic].completedQuestions?.length > 0
    );

    return {
      totalCompletedQuestions,
      totalCorrectAnswers,
      completedTopics,
      completedCount: completedTopics.length,
      completionPercentage: totalTopics
        ? Math.round((completedTopics.length / totalTopics) * 100)
        : 0,
      questionCompletionPercentage: totalQuestions
        ? Math.round((totalCompletedQuestions / totalQuestions) * 100)
        : 0,
    };
  };

  // Update progress state whenever userProgress or data changes
  useEffect(() => {
    const progressMetrics = calculateOverallProgress();
    setProgress({
      completedTopics: progressMetrics.completedTopics,
      completedCount: progressMetrics.completedCount,
      completionPercentage: progressMetrics.completionPercentage,
      totalCompletedQuestions: progressMetrics.totalCompletedQuestions,
      totalCorrectAnswers: progressMetrics.totalCorrectAnswers,
      questionCompletionPercentage:
        progressMetrics.questionCompletionPercentage,
    });
  }, [userProgress, data]);

  // Get all subtopics with a unique identifier
  const getAllSubtopics = () => {
    if (!data || data.length === 0) return [];
    return data.flatMap((subject) =>
      (subject.subtopics || []).map((topic) => ({
        ...topic,
        parentSubject: subject.subject,
        uniqueId: `${subject.subject}-${topic.title}`,
      }))
    );
  };

  // Filter and sort topics
  const getFilteredAndSortedTopics = () => {
    let allTopics = activeSubject
      ? (
          data.find((subject) => subject.subject === activeSubject)
            ?.subtopics || []
        ).map((topic) => ({
          ...topic,
          parentSubject: activeSubject,
          uniqueId: `${activeSubject}-${topic.title}`,
        }))
      : getAllSubtopics();

    if (searchTerm) {
      allTopics = allTopics.filter((topic) =>
        topic.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sortedTopics = [...allTopics].sort((a, b) => {
      const aCompleted = userProgress[a.title]?.completedQuestions?.length || 0;
      const bCompleted = userProgress[b.title]?.completedQuestions?.length || 0;
      const aProgress = aCompleted / a.count;
      const bProgress = bCompleted / b.count;
      const aRemaining = a.count - aCompleted;
      const bRemaining = b.count - bCompleted;

      switch (sortBy) {
        case "progress":
          return bProgress - aProgress;
        case "remaining":
          return bRemaining - aRemaining;
        default:
          return activeSubject
            ? a.title.localeCompare(b.title)
            : a.parentSubject.localeCompare(b.parentSubject) ||
                a.title.localeCompare(b.title);
      }
    });

    console.log("Filtered and Sorted Topics:", sortedTopics);
    return sortedTopics;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && searchTerm) {
        setSearchTerm("");
        setIsFiltering(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-md flex items-center space-x-6"
        >
          <div className="h-12 w-12 rounded-full border-4 border-t-gray-600 border-gray-200 animate-spin"></div>
          <span className="text-xl font-medium text-gray-800">
            Loading your dashboard...
          </span>
        </motion.div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Subjects Available
          </h1>
          <p className="text-gray-600">
            It looks like there are no subjects to display. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Navbar
        auth={auth}
        user={user}
        setShowAuthModal={setShowAuthModal}
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="min-h-screen bg-gray-100 mt-24">
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-40 md:hidden ${
            isSidebarOpen ? "block" : "hidden"
          }`}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">SUBJECTS</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto h-full py-4">
              <div className="px-4 space-y-1">
                <button
                  className={`block w-full text-left py-2 px-3 rounded-md ${
                    activeSubject === null
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setActiveSubject(null);
                    setIsSidebarOpen(false);
                  }}
                >
                  ALL Subjects
                </button>
                {data.map((subject) => (
                  <button
                    key={subject.subject}
                    className={`block w-full text-left py-2 px-3 rounded-md ${
                      activeSubject === subject.subject
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setActiveSubject(subject.subject);
                      setIsSidebarOpen(false);
                    }}
                  >
                    {subject.subject}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Desktop sidebar */}
          <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex-1 px-4 space-y-1">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </h3>
                </div>
                <button
                  className={`block w-full text-left py-2 px-3 rounded-md ${
                    activeSubject === null
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveSubject(null)}
                >
                  ALL Subjects
                </button>
                {data.map((subject) => (
                  <button
                    key={subject.subject}
                    className={`block w-full text-left py-2 px-3 rounded-md ${
                      activeSubject === subject.subject
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveSubject(subject.subject)}
                  >
                    {subject.subject}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress overview */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-medium text-gray-900 mb-4">
                    MHCET Tracker
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Total Topics
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {
                          data.flatMap((subject) => subject.subtopics || [])
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Questions Completed
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {calculateTotalQuestions()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search and filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="relative flex-grow md:max-w-lg">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsFiltering(e.target.value !== "");
                        }}
                        placeholder="Search topics... (Ctrl + /)"
                        className="pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-200 focus:border-gray-500 w-full"
                      />
                      <svg
                        className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <select
                      value={activeSubject || "all"}
                      onChange={(e) =>
                        setActiveSubject(
                          e.target.value === "all" ? null : e.target.value
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-500 w-full md:w-auto"
                    >
                      <option value="all">All Subjects</option>
                      {data.map((subject) => (
                        <option key={subject.subject} value={subject.subject}>
                          {subject.subject.replace("-", " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Topics */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">
                    {activeSubject || "All Topics"}
                    {isFiltering && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        Filtering: {searchTerm}
                      </span>
                    )}
                  </h2>

                  {activeSubject === null && !isFiltering && (
                    <div className="mb-6">
                      <div className="border-b border-gray-200 mb-4">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Grouped by Subject
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {activeSubject === null &&
                      !isFiltering &&
                      data.map((subject) => (
                        <div key={subject.subject} className="mb-6">
                          <h3 className="text-md font-medium text-gray-800 mb-3 px-2 py-1 bg-gray-50 rounded-md">
                            {subject.subject.replaceAll("-", " ").toUpperCase()}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(subject.subtopics || []).map((topic) => {
                              const completedCount =
                                userProgress[topic.title]?.completedQuestions
                                  ?.length || 0;
                              const correctCount =
                                userProgress[topic.title]?.correctAnswers
                                  ?.length || 0;
                              const progressPercentage = Math.round(
                                (completedCount / topic.count) * 100
                              );

                              return (
                                <motion.div
                                  key={`${subject.subject}-${topic.title}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
                                >
                                  <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="text-sm font-medium text-gray-900">
                                        {topic.title.replace(/-/g, " ")}
                                      </h3>
                                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                        {completedCount}/{topic.count}
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <div className="flex items-center">
                                        <div className="flex-1">
                                          <div className="h-2 bg-gray-200 rounded-full">
                                            <div
                                              className="h-2 bg-gray-600 rounded-full"
                                              style={{
                                                width: `${progressPercentage}%`,
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                        <span className="ml-2 text-xs font-medium text-gray-500">
                                          {progressPercentage}%
                                        </span>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        Correct: {correctCount}/{completedCount}
                                      </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                      <a
                                        href={`/mhcet/practice/${topic.title}`}
                                        className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                      >
                                        Practice
                                      </a>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                    {(activeSubject !== null || isFiltering) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getFilteredAndSortedTopics().map((topic) => {
                          const completedCount =
                            userProgress[topic.title]?.completedQuestions
                              ?.length || 0;
                          const correctCount =
                            userProgress[topic.title]?.correctAnswers?.length ||
                            0;
                          const progressPercentage = Math.round(
                            (completedCount / topic.count) * 100
                          );

                          return (
                            <motion.div
                              key={topic.uniqueId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
                            >
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    {isFiltering && (
                                      <div className="text-xs font-medium text-gray-500 mb-1">
                                        {topic.parentSubject}
                                      </div>
                                    )}
                                    <h3 className="text-sm font-medium text-gray-900">
                                      {topic.title.replace(/-/g, " ")}
                                    </h3>
                                  </div>
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                    {completedCount}/{topic.count}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center">
                                    <div className="flex-1">
                                      <div className="h-2 bg-gray-200 rounded-full">
                                        <div
                                          className="h-2 bg-gray-600 rounded-full"
                                          style={{
                                            width: `${progressPercentage}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="ml-2 text-xs font-medium text-gray-500">
                                      {progressPercentage}%
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    Correct: {correctCount}/{completedCount}
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <a
                                    href={`/mhcet/practice/${topic.title}`}
                                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                  >
                                    Practice
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {getFilteredAndSortedTopics().length === 0 && (
                      <div className="text-center py-12">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No topics found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {isFiltering
                            ? "Try changing your search query."
                            : "No topics available for this subject."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onGoogleSignIn={handleGoogleSignIn}
        />
</div>
    </ErrorBoundary>
  );
};

export default Mhcettracker;
