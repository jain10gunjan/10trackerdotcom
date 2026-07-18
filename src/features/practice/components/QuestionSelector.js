"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { MATHJAX_CONFIG } from "@/lib/mathjaxConfig";

const categoryForApi = (param) =>
  (param || 'gate-cse').toString().trim().toUpperCase().replace(/_/g, '-');

const QuestionSelector = ({ 
  selectedQuestions, 
  onQuestionToggle, 
  onClose, 
  maxQuestions = 65,
  examcategory = '',
  initialTopic,
  initialSubject,
  initialChapter,
}) => {
  const categoryParam = examcategory || 'gate-cse';
  const topicsApi = `/api/mock-test/admin/topics?category=${encodeURIComponent(categoryParam)}`;
  const questionsApiBase = '/api/mock-test/admin/questions';
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject: initialSubject || 'all',
    topic: initialTopic || 'all',
    chapter: initialChapter || 'all',
    difficulty: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const difficultySummary = useMemo(() => {
    const base = { easy: 0, medium: 0, hard: 0 };
    questions.forEach((q) => {
      if (q.difficulty && base[q.difficulty] !== undefined) {
        base[q.difficulty] += 1;
      }
    });
    return base;
  }, [questions]);

  // Memoized filter function for better performance
  const applyFilters = useCallback((questionsList, currentFilters) => {
    return questionsList.filter(question => {
      const matchesSubject = currentFilters.subject === 'all' || question.subject === currentFilters.subject;
      const matchesTopic = currentFilters.topic === 'all' || question.topic === currentFilters.topic;
      const matchesDifficulty = currentFilters.difficulty === 'all' || question.difficulty === currentFilters.difficulty;
      const matchesSearch = !currentFilters.search || 
        question.question.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        question.topic.toLowerCase().includes(currentFilters.search.toLowerCase());
      
      return matchesSubject && matchesTopic && matchesDifficulty && matchesSearch;
    });
  }, []);

  // Sync initial scope into filters when modal opens with scope
  useEffect(() => {
    if (initialTopic || initialSubject || initialChapter) {
      setFilters(prev => ({
        ...prev,
        ...(initialTopic && { topic: initialTopic }),
        ...(initialSubject && { subject: initialSubject }),
        ...(initialChapter && { chapter: initialChapter }),
      }));
    }
  }, [initialTopic, initialSubject, initialChapter]);

  // Fetch available subjects and topics
  useEffect(() => {
    const fetchTopicsAndSubjects = async () => {
      try {
        const response = await fetch(topicsApi);
        const data = await response.json();

        if (data.success) {
          setAvailableSubjects(['all', ...(data.subjects || [])]);
          setAvailableTopics(['all', ...(data.topics || [])]);
        }
      } catch (error) {
        console.error('Error fetching topics and subjects:', error);
      }
    };

    fetchTopicsAndSubjects();
  }, [topicsApi]);

  // Fetch chapters when subject is selected (for category-scoped selector)
  useEffect(() => {
    if (!examcategory || !filters.subject || filters.subject === 'all') {
      setAvailableChapters([]);
      return;
    }
    let cancelled = false;
    setChaptersLoading(true);
    const category = categoryForApi(examcategory);
    fetch(`/api/chapters/by-subject?category=${encodeURIComponent(category)}&subject=${encodeURIComponent(filters.subject)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data?.data?.chapters) setAvailableChapters(['all', ...data.data.chapters.map(c => c.title)]);
        else if (!cancelled) setAvailableChapters([]);
      })
      .catch(() => { if (!cancelled) setAvailableChapters([]); })
      .finally(() => { if (!cancelled) setChaptersLoading(false); });
    return () => { cancelled = true; };
  }, [examcategory, filters.subject]);

  // Fetch questions with current filters (decoupled from selection so we don't refetch on every click)
  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        subject: filters.subject,
        topic: filters.topic,
        difficulty: filters.difficulty,
        search: filters.search || '',
      });
      if (filters.chapter && filters.chapter !== 'all') params.set('chapter', filters.chapter);

      const url = examcategory
        ? `${questionsApiBase}?category=${encodeURIComponent(examcategory)}&${params}`
        : `${questionsApiBase}?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        setFilteredQuestions(data.questions);
        setPagination(prev => ({
          ...prev,
          page: data.pagination.page,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        toast.error(data.error || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, examcategory, questionsApiBase]);

  // Fetch questions when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuestions(1);
  }, [filters, fetchQuestions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'subject') next.chapter = 'all';
      return next;
    });
  };

  // Handle question selection
  const handleQuestionToggle = (question) => {
    if (selectedQuestions.find(q => q._id === question._id)) {
      onQuestionToggle(question, 'remove');
    } else if (selectedQuestions.length < maxQuestions) {
      onQuestionToggle(question, 'add');
    } else {
      toast.error(`Maximum ${maxQuestions} questions allowed`);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchQuestions(newPage);
    }
  };

  // Memoized question cards for better performance
  const questionCards = useMemo(() => {
    return filteredQuestions.map(question => {
      const isSelected = selectedQuestions.find(q => q._id === question._id);
      const isDisabled = !isSelected && selectedQuestions.length >= maxQuestions;
      
      return (
        <div
          key={question._id}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            isSelected 
              ? 'border-blue-500 bg-blue-50' 
              : isDisabled 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          }`}
          onClick={() => !isDisabled && handleQuestionToggle(question)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {question.subject}
              </span>
            </div>
            {isSelected && (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          
          <MathJax dynamic hideUntilTypeset={"first"}>
            <div
              className="text-sm text-gray-700 line-clamp-3 mb-2"
              dangerouslySetInnerHTML={{ __html: question.question }}
            />
          </MathJax>
          
          <div className="text-xs text-gray-500">
            <span className="font-medium">Topic:</span> {question.topic}
          </div>
        </div>
      );
    });
  }, [filteredQuestions, selectedQuestions, maxQuestions, handleQuestionToggle]);

  return (
    <MathJaxContext config={MATHJAX_CONFIG}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Questions</h2>
            <p className="text-sm text-gray-600">
              {selectedQuestions.length} of {maxQuestions} questions selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

          {/* Scrollable content: filters + list + pagination */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Filters */}
          <div className="p-4 sm:p-6 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableSubjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <select
                  value={filters.topic}
                  onChange={(e) => handleFilterChange('topic', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableTopics.map(topic => (
                    <option key={topic} value={topic}>
                      {topic === 'all' ? 'All Topics' : topic}
                    </option>
                  ))}
                </select>
              </div>

              {examcategory && availableChapters.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
                  <select
                    value={filters.chapter}
                    onChange={(e) => handleFilterChange('chapter', e.target.value)}
                    disabled={chaptersLoading}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="all">All Chapters</option>
                    {availableChapters.filter(c => c !== 'all').map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              </div>
            )}

            {/* Difficulty summary chips */}
            {!loading && questions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1 text-xs">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                  easy&nbsp;{difficultySummary.easy}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100">
                  medium&nbsp;{difficultySummary.medium}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                  hard&nbsp;{difficultySummary.hard}
                </span>
              </div>
            )}
          </div>

          {/* Questions + Selected Sidebar */}
          <div className="p-4 sm:p-6 flex gap-4 overflow-hidden bg-white">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No questions found with current filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questionCards}
                </div>
              )}
            </div>

            {/* Selected questions summary (desktop) */}
            <div className="hidden lg:flex lg:flex-col lg:w-72 flex-shrink-0 border-l border-gray-100 pl-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                Selected ({selectedQuestions.length}/{maxQuestions})
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Click a card to add or remove it from this list.
              </p>
              <div className="flex-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50">
                {selectedQuestions.length === 0 ? (
                  <div className="h-full flex items-center justify-center px-3 text-[11px] text-gray-500 text-center">
                    No questions selected yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 text-xs">
                    {selectedQuestions.map((q, idx) => (
                      <li key={q._id || idx} className="px-3 py-2">
                        <p className="font-medium text-gray-800 line-clamp-2">
                          Q{idx + 1}.{" "}
                          <MathJax dynamic hideUntilTypeset={"first"}>
                            <span
                              dangerouslySetInnerHTML={{ __html: q.question }}
                            />
                          </MathJax>
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          {q.subject || "Subject"} · {q.topic || "Topic"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 pb-4 sm:pb-6 bg-white border-t">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total questions)
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
                  {pagination.page}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedQuestions.length} questions selected
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </MathJaxContext>
  );
};

export default QuestionSelector;
