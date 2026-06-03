"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, 
  Trophy, 
  Search,
  ArrowRight,
  FileText,
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Filter,
  X
} from "lucide-react";
import { mergeExamData } from "@/data/examData";
import { examMeta } from "@/data/examMeta";

const hasGuide = (slug) => !!examMeta?.[slug];

const getPracticeHref = (slug) => {
  const meta = examMeta?.[slug];
  // If we have structured links for this exam, prefer them.
  if (meta?.practiceLinks?.topicWisePyqs) return meta.practiceLinks.topicWisePyqs;
  // Fallback to legacy practice route structure used across the app.
  return `/${slug}`;
};

const getGuideHref = (slug) => `/exams/${slug}`;

// Exam Card Component (richer, consistent with homepage)
function ExamCard({ exam }) {
  const [imageError, setImageError] = useState(false);
  const showImage = exam.image && !imageError;
  const isActive = exam.active !== false; // Default to true if not specified
  const guideAvailable = hasGuide(exam.slug);
  const practiceHref = getPracticeHref(exam.slug);
  const guideHref = getGuideHref(exam.slug);
  
  // If inactive, render as disabled card
  if (!isActive) {
    return (
      <div className="relative overflow-hidden bg-neutral-100 border border-neutral-200 rounded-2xl p-4 sm:p-5 opacity-60 cursor-not-allowed">
        {/* Small Logo on Left - Grayed out */}
        <div className="flex items-start gap-4">
          <div className={`relative w-16 h-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 overflow-hidden ${exam.bg || ''}`}>
            {showImage ? (
              <Image
                src={exam.image}
                alt={exam.name}
                fill
                className="object-cover grayscale"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50">
                {exam.icon}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-500 truncate">
                  {exam.name}
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm line-clamp-2 mt-1">
                  {exam.description || "Topic-wise practice questions with detailed solutions"}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400 bg-white/70 border border-neutral-200 px-2 py-1 rounded-full whitespace-nowrap">
                Coming soon
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-3">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="font-medium">{exam.count?.toLocaleString() || 0} Questions</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Active exam card
  return (
    <div className="group relative overflow-hidden bg-white border border-neutral-200 rounded-2xl hover:border-neutral-300 hover:shadow-lg transition-all duration-300 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className={`relative w-16 h-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden ${exam.bg || ''}`}>
          {showImage ? (
            <Image
              src={exam.image}
              alt={exam.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              {exam.icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
                {exam.name}
              </h3>
              <p className="text-neutral-600 text-xs sm:text-sm line-clamp-2 mt-1">
                {exam.description || "Topic-wise practice questions with detailed solutions"}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-full whitespace-nowrap">
              Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-3">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-medium">{exam.count?.toLocaleString() || 0} Questions</span>
            </span>
            {exam.category && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-neutral-50 border border-neutral-200 px-2 py-1">
                <span className="font-medium">{exam.category}</span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={practiceHref}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Practice
              <ArrowRight className="w-4 h-4" />
            </Link>

            {guideAvailable && (
              <Link
                href={guideHref}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
              >
                Guide
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamsPage() {
  const [examCategories, setExamCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // popular, name, questions
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  // Use hardcoded exam data
  useEffect(() => {
    const hardcodedExams = mergeExamData([]); // Pass empty array since we're using hardcoded data
    setExamCategories(hardcodedExams);
    setLoading(false);
  }, []);

  // Filter and sort exams
  const filteredAndSortedExams = useMemo(() => {
    let filtered = examCategories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (activeCategory && activeCategory !== "All") {
      filtered = filtered.filter((e) => (e.category || "Other") === activeCategory);
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "questions":
          return (b.count || 0) - (a.count || 0);
        case "popular":
        default:
          // Sort by active first, then by count
          if (a.active !== b.active) {
            return a.active ? -1 : 1;
          }
          return (b.count || 0) - (a.count || 0);
      }
    });

    return sorted;
  }, [examCategories, searchTerm, sortBy, activeCategory]);

  // Calculate total stats
  const stats = useMemo(() => {
    const totalQuestions = examCategories.reduce((sum, exam) => sum + (exam.count || 0), 0);
    const totalExams = examCategories.length;
    return { totalQuestions, totalExams };
  }, [examCategories]);

  const categories = useMemo(() => {
    const set = new Set();
    examCategories.forEach((e) => set.add(e.category || "Other"));
    return ["All", ...Array.from(set).sort()];
  }, [examCategories]);

  const featuredExams = useMemo(() => {
    const bySlug = new Map(examCategories.map((e) => [e.slug, e]));
    const preferred = ["upsc-prelims", "general-aptitude"].map((s) => bySlug.get(s)).filter(Boolean);
    const picked = [];
    for (const e of preferred) {
      if (picked.length >= 3) break;
      if (e.active === false) continue;
      picked.push(e);
    }
    if (picked.length < 3) {
      const fallback = [...examCategories]
        .filter((e) => e.active !== false && !picked.some((p) => p.slug === e.slug))
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 3 - picked.length);
      picked.push(...fallback);
    }
    return picked;
  }, [examCategories]);

  const quickStart = useMemo(
    () => [
      {
        id: "start-upsc",
        label: "Civil Services",
        hint: "UPSC Prelims",
        category: "Civil Services",
        preferredSlug: "upsc-prelims",
      },
      {
        id: "start-gate",
        label: "Engineering",
        hint: "GATE / JEE",
        category: "Engineering",
        preferredSlug: "gate-cse",
      },
      {
        id: "start-apt",
        label: "Aptitude",
        hint: "General Aptitude",
        category: "General",
        preferredSlug: "general-aptitude",
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading exams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      {/* Hero Section */}
      <section className="border-b border-neutral-200 bg-white">
        {/* subtle premium background */}
        <div className="absolute inset-x-0 top-20 -z-10 h-[520px] bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.05),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.04),transparent_55%)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
                <Sparkles className="w-4 h-4 text-neutral-600" />
                <span className="text-xs sm:text-sm font-medium text-neutral-700">
                  Exams • PYQs • DPP • Mock tests
                </span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-neutral-900 tracking-tight">
                Pick an exam. Start practicing in minutes.
              </h1>

              <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                Clean, topic-wise practice with progress tracking. Use the guide to understand pattern & syllabus, then jump straight into PYQs.
              </p>              

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{examCategories.length}</p>
                  <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">Exams</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{stats.totalQuestions.toLocaleString()}+</p>
                  <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">Questions</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-neutral-700" />
                    <span className="sr-only">Progress tracking</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">Progress</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-900">Featured</p>
                  <p className="text-[11px] font-medium text-neutral-500">Start here</p>
                </div>
                <div className="mt-4 space-y-3">
                  {featuredExams.map((e) => (
                    <Link
                      key={e.slug}
                      href={getPracticeHref(e.slug)}
                      className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-lg">
                        {e.icon || "📘"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{e.name}</p>
                        <p className="text-xs text-neutral-600 truncate">
                          {e.count?.toLocaleString() || 0} questions • {e.category || "Exam"}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/exams/upsc-prelims"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    UPSC guide
                  </Link>
                  <Link
                    href="/exams/general-aptitude"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    General Aptitude guide
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b border-neutral-200 sticky top-20 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 sm:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-sm sm:text-base outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                type="button"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-neutral-600 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none bg-white cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="questions">Most Questions</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category chips */}
          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-1">
              {categories.map((c) => {
                const selected = activeCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      selected
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart active filter bar */}
          {(activeCategory !== "All" || !!searchTerm) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-600">Active filters:</span>
              {activeCategory !== "All" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800">
                  Category: {activeCategory}
                  <button
                    type="button"
                    onClick={() => setActiveCategory("All")}
                    className="text-neutral-500 hover:text-neutral-900"
                    aria-label="Clear category filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {!!searchTerm && (
                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800">
                  Search: “{searchTerm}”
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-neutral-500 hover:text-neutral-900"
                    aria-label="Clear search filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setSearchTerm("");
                  setSortBy("popular");
                }}
                className="ml-auto text-xs font-semibold text-neutral-700 hover:text-neutral-900 underline underline-offset-4"
              >
                Reset
              </button>
            </div>
          )}

          {/* Mobile Filter Dropdown */}
          {showFilters && (
            <div className="mt-4 sm:hidden">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setShowFilters(false);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none bg-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="questions">Most Questions</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Exams Grid Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredAndSortedExams.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No exams found</h3>
              <p className="text-neutral-600 mb-4 max-w-md mx-auto">
                {searchTerm 
                  ? `No exams match "${searchTerm}". Try a different search term.`
                  : "No exams available at the moment."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                  type="button"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-neutral-600 text-sm sm:text-base">
                  Showing <span className="font-semibold text-neutral-900">{filteredAndSortedExams.length}</span> exam{filteredAndSortedExams.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Active</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-neutral-300"></div>
                    <span>Coming Soon</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {filteredAndSortedExams.map((exam) => (
                  <ExamCard key={exam.slug} exam={exam} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white border-t border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
            <Trophy className="w-4 h-4 text-neutral-700" />
            <span className="text-sm font-medium text-neutral-700">Ready to Start?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 text-neutral-900">
            Begin Your Exam Preparation Journey
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already practicing and improving 
            their exam performance with 10tracker.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto text-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white border border-neutral-300 text-neutral-800 rounded-lg font-semibold text-lg hover:bg-neutral-50 transition-all duration-200 w-full sm:w-auto text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

