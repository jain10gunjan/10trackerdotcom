"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import debounce from "lodash/debounce";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";

// Lazy-loaded components
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"), { ssr: false });

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex justify-center items-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Something went wrong</h1>
            <p className="text-neutral-600 mb-4">Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Examtracker = () => {
  const [data, setData] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const { user, setShowAuthModal } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const searchInputRef = useRef(null);
  const { category } = useParams();

  const categoryTitle = useMemo(() => 
    category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || 'Practice',
  [category]);
  
  const apiEndpoint = `/api/year-wise?category=${category?.toUpperCase() || ''}`;
  const token = "eyJhbGciOiJIUzIVoltageIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

  // Fetch year data with optimized cache handling
  const fetchData = useCallback(
    debounce(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error("Failed to fetch data");
        const responseData = await response.json();
        const yearData = responseData.yearData || [];
        setData(yearData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [apiEndpoint, token, category]
  );

  // Handle practice button click - allow signed in users direct access
  const handlePracticeClick = useCallback((url) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Direct access for signed in users
    window.location.href = url;
  }, [user, setShowAuthModal]);

  // Memoized calculations
  const totalQuestions = useMemo(() => 
    data.reduce((acc, year) => acc + (year.count || 0), 0), 
    [data]
  );
  
  const allYears = useMemo(() => 
    data.map((year) => ({
      ...year,
      uniqueId: year.year
    })), 
    [data]
  );
  
  const filteredAndSortedYears = useMemo(() => {
    let years = allYears;
  
    if (searchTerm) {
      years = years.filter((y) => 
        y.year.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    return years; // No sorting
  }, [allYears, searchTerm]);
  

  // Effect to fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (searchTerm) {
          setSearchTerm("");
        } else if (showMobileOptions) {
          setShowMobileOptions(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm, showMobileOptions]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50">
        <Suspense fallback={<div>Loading metadata...</div>}>
          <MetaDataJobs
            seoTitle={`${categoryTitle} Practice Tracker`}
            seoDescription={`Practice ${categoryTitle} PYQs Year-Wise with detailed solutions.`}
          />
        </Suspense>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }} 
          className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-3 sm:space-x-6 max-w-md w-full"
        >
          <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-full border-4 border-t-neutral-800 border-neutral-100 animate-spin flex-shrink-0"></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-xl font-medium text-neutral-900 mb-1">Loading your dashboard</h3>
            <p className="text-xs sm:text-sm text-neutral-600">Please wait a moment...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty state
  if (allYears.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <Suspense fallback={<div>Loading navbar...</div>}>
          <Navbar/>
        </Suspense>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-[80vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md w-full">
            <svg className="h-16 w-16 text-neutral-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-neutral-900 mb-2">No practice materials found</h3>
            <p className="text-neutral-500 mb-4">We couldn&apos;t find any practice materials for {categoryTitle}.</p>
            <button onClick={() => window.location.href="/"} className="px-4 py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading metadata...</div>}>
        <MetaDataJobs
          seoTitle={`${categoryTitle} Practice Tracker`}
          seoDescription={`Practice ${categoryTitle} PYQs Year-Wise with detailed solutions.`}
        />
      </Suspense>
      <Suspense fallback={<div>Loading navbar...</div>}>
        <Navbar/>
      </Suspense>
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8 bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900">{categoryTitle} Practice Tracker</h1>
                <p className="text-sm sm:text-base text-neutral-600 mt-1">Explore {allYears.length} years with {totalQuestions} practice questions</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {!user && (
                  <button 
                    onClick={() => setShowAuthModal(true)} 
                    className="px-4 py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150"
                  >
                    Sign In
                  </button>
                )}
                <div className="relative w-full sm:max-w-xs">
                    <svg className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search years (Ctrl + /)"
                    className="pl-10 pr-10 sm:pr-4 py-2.5 sm:py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-sm sm:text-base transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                    aria-label="Search years"
                  />
                  {searchTerm && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2" 
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <Suspense fallback={<div>Loading alert...</div>}>
            <Alert 
              type="info" 
              message="We update our question bank daily. Found an issue? Report it — we'll fix it within 48 hrs!" 
              linkText="Learn More" 
              linkHref="https://examtracker.in/about-us" 
              dismissible={true} 
            />
          </Suspense>


          {/* Years grid with auto-fill for better responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
            {filteredAndSortedYears.map((year) => {
              const yearProgress = userProgress[year.year] || { completedQuestions: [], correctAnswers: [], points: 0 };
              const completedCount = yearProgress.completedQuestions?.length || 0;
              const correctCount = yearProgress.correctAnswers?.length || 0;
              const progressPercentage = year.count ? Math.round((completedCount / year.count) * 100) : 0;
              const isCompleted = completedCount === year.count && year.count > 0;
              const accuracyPercentage = completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0;
              const practiceUrl = `/${category}/practice/year-wise/${year.year.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

              return (
                <motion.div
                  key={year.uniqueId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-xl shadow-sm border ${
                    isCompleted ? "border-green-200" : completedCount > 0 ? "border-neutral-300" : "border-neutral-200"
                  } hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-neutral-900">
                          {year.year.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </h3>
                        <div className="text-xs sm:text-sm text-neutral-500">{year.count}+ Questions</div>
                      </div>
                      {isCompleted && (
                        <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {user && completedCount > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>{completedCount} of {year.count} questions</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isCompleted ? "bg-green-500" : completedCount > 0 ? "bg-neutral-800" : "bg-neutral-300"
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-neutral-500">
                            <span>Accuracy: {accuracyPercentage}%</span>
                            <span>Points: {yearProgress.points || 0}</span>
                          </div>
                        </>
                      )}
                      <a
                        href={practiceUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePracticeClick(practiceUrl);
                        }}
                        className={`block text-center py-2 rounded-lg border ${
                          isCompleted 
                            ? "border-green-300 text-green-800 hover:bg-green-50" 
                            : "border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                        } transition-colors duration-150`}
                      >
                        {completedCount > 0 ? "Continue" : "Start"} Practice
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredAndSortedYears.length === 0 && searchTerm && (
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center border border-neutral-200">
              <svg className="h-10 w-10 sm:h-12 sm:w-12 text-neutral-400 mx-auto mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">No years found</h3>
              <p className="text-sm sm:text-base text-neutral-500 mb-4">No years match &apos;{searchTerm}&apos;</p>
              <button 
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

       
</div>
    </ErrorBoundary>
  );
};

export default React.memo(Examtracker);