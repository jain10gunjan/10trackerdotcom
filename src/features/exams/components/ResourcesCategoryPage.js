"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation"; // Updated importimport { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import BuyNow from "@/features/pricing/components/BuyNow";
import MetaDataJobs from "@/components/ui/Seo";
import BuyNowYearWise from "@/features/pricing/components/BuyNowYearWise";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  // State variables
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [orderChecking, setOrderChecking] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedPracticeUrl, setSelectedPracticeUrl] = useState(null);
  const [hasAccess, setHasAccess] = useState(null); // New state to track access

  const { category } = useParams();
  const { user, setShowAuthModal } = useAuth();
  const router = useRouter();

  const fetchOrderStatus = useCallback(
    async (email) => {
      if (!email) return false;

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("status")
          .eq("user_email", email)
          .eq("plan", category)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw new Error(error.message || "Failed to fetch order status");

        return data[0]?.status === "completed";
      } catch (err) {
        console.error("Order fetch error:", err.message);
        return false;
      }
    },
    [category]
  );

  // Check order status on mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setShowAuthModal(true);
        setHasAccess(false);
        return;
      }

      setShowAuthModal(false);
      setOrderChecking(true);
      try {
        const access = await fetchOrderStatus(user.email);
        setHasAccess(access);
        if (!access) {
          toast.error("Access denied. Please purchase a plan.");
          // setShowBuyModal(true); // Show buy modal instead of redirecting
        }
      } catch (err) {
        toast.error("Failed to verify access");
        setHasAccess(false);
        setShowBuyModal(true); // Show buy modal on error
      } finally {
        setOrderChecking(false);
      }
    };

    checkAccess();
  }, [user, fetchOrderStatus, category, setShowAuthModal]);

  // Fetch questions with pagination and filters
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("technicalinterviewquestions")
        .select("*", { count: "exact" });

      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`);
      }

      if (categoryFilter) {
        query = query.eq("topic", categoryFilter);
      }

      const { data, error, count } = await query
        .range(from, to)
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setQuestions(data || []);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

      setLoading(false);
    }

    fetchQuestions();
  }, [currentPage, searchQuery, categoryFilter, itemsPerPage]);

  // Fetch categories for filter dropdown and tabs
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("technicalinterviewquestions")
        .select("topic")
        .not("topic", "is", null);

      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        const uniqueCategories = [...new Set(data.map((item) => item.topic))];
        setCategories(uniqueCategories);
      }
    }

    fetchCategories();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setCategoryFilter(category);
    setActiveTab(category || "all");
    setCurrentPage(1);
  };

  const handleTabChange = (category) => {
    setActiveTab(category);
    setCategoryFilter(category === "all" ? "" : category);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const toggleQuestion = (id) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCloseModal = () => {
    setShowBuyModal(false);
  };

  const handlePurchaseSuccess = () => {
    setShowBuyModal(false);
    setHasAccess(true); // Grant access after successful purchase
    toast.success("Purchase successful!");
  };

  const categoryTitle = category
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const renderPaginationButtons = () => {
    const buttons = [];

    buttons.push(
      <button
        key="prev"
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 mx-1 rounded-md ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 shadow-sm"
        }`}
      >
        Previous
      </button>
    );

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4 && startPage > 1) {
      startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-4 py-2 mx-1 rounded-md bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 shadow-sm"
        >
          1
        </button>
      );

      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2 py-2">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 mx-1 rounded-md shadow-sm ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "bg-white hover:bg-gray-50 text-blue-600 border border-gray-200"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2 py-2">
            ...
          </span>
        );
      }

      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-4 py-2 mx-1 rounded-md bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 shadow-sm"
        >
          {totalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 mx-1 rounded-md ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 shadow-sm"
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  const renderCategoryTabs = () => (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex space-x-1 pb-3 pt-1">
        <button
          onClick={() => handleTabChange("all")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          All Topics
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleTabChange(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeTab === category
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {category.replaceAll("-"," ")}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading metadata...</div>}>
        <MetaDataJobs
          seoTitle={`${categoryTitle} PYQs`}
          seoDescription={`Practice ${categoryTitle} questions with detailed solutions and MCQs.`}
        />
      </Suspense>
      <Suspense fallback={<div>Loading navbar...</div>}>
        <Navbar />
      </Suspense>

      <header className="bg-gradient-to-r mt-28 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold mb-2">Tech Interview Prep</h1>
            <p className="text-xl">
              Master your next technical interview with our curated question bank
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-white rounded-xl shadow-sm p-3">{renderCategoryTabs()}</div>

        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Questions
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search questions or answers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Topic
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={handleCategoryChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Topics</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
            {category.replaceAll("-"," ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="itemsPerPage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Questions Per Page
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {loading || orderChecking ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className={`relative`}>
            {!hasAccess && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Unlock Premium Content
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Purchase a plan to access all {categoryTitle} questions and solutions.
                  </p>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            )}

            {!loading && (
              <div className="mb-4 text-gray-600 flex justify-between items-center">
                <div>Showing {questions.length} of {totalPages * itemsPerPage} results</div>
                {(searchQuery || categoryFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("");
                      setActiveTab("all");
                      setCurrentPage(1);
                      router.push("/", undefined, { shallow: true });
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
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
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {!loading && questions.length === 0 && (
              <div className="bg-white p-12 rounded-xl shadow-md text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xl text-gray-600 mb-4">
                  No questions found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("");
                    setActiveTab("all");
                    setCurrentPage(1);
                    router.push("/", undefined, { shallow: true });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && questions.length > 0 && (
              <div className="space-y-6">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg border border-gray-100"
                  >
                    <div
                      onClick={() => hasAccess && toggleQuestion(question.id)}
                      className={`p-6 ${hasAccess ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            {question.topic && (
                              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-3">
                                {question.topic}
                              </span>
                            )}
                            {question.category && (
                              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                {question.category}
                              </span>
                            )}
                          </div>
                          <h2
                            className={`text-xl font-semibold text-gray-900 ${hasAccess === false ? "blur-sm" : ""}`}
                            dangerouslySetInnerHTML={{ __html: question.question }}
                          />
                        </div>
                        <div className="ml-4">
                          <button
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-6 w-6 transform transition-transform ${
                                expandedQuestions[question.id] ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedQuestions[question.id] && hasAccess && (
                      <div className="px-6 pb-6">
                        <div className="mt-2 pt-4 pl-4 border-t border-gray-100">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Answer:</h3>
                          <div
                            className={`prose max-w-none text-gray-700 ${hasAccess === false ? "blur-sm" : ""}`}
                            dangerouslySetInnerHTML={{ __html: question.answer }}
                          />

                          
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && questions.length > 0 && (
              <div className="flex justify-center mt-10">
                <div className="flex flex-wrap">{renderPaginationButtons()}</div>
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-6 w-full overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Unlock Premium Access</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close subscription modal"
                >
                  <svg
                    className="h-5 w-5"
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
              <p className="text-gray-600 mb-6">
                Get unlimited access to all {categoryTitle} practice questions, detailed
                solutions, and performance tracking.
              </p>
              <Suspense
                fallback={
                  <div className="py-8 flex justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin"></div>
                  </div>
                }
              >
                <BuyNowYearWise category={category} onSuccess={handlePurchaseSuccess} redirectUrl={window.location.href} />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}