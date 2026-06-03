"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, Plus, Search, Filter, BookOpen
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function CreateYearwiseTestPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [testConfig, setTestConfig] = useState({
    testName: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    instructions: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(20);

  // Check if user is admin
  // Memoized unique values for filters
  const years = useMemo(() => 
    [...new Set(questions.map(q => q.year))]
      .filter(Boolean)
      .sort((a, b) => parseInt(b.match(/\d{4}/)?.[0] || b) - parseInt(a.match(/\d{4}/)?.[0] || a)),
    [questions]
  );

  const topics = useMemo(() => 
    [...new Set(questions.map(q => q.topic))]
      .filter(Boolean)
      .sort(),
    [questions]
  );

  // Pagination calculations
  const { indexOfFirstQuestion, indexOfLastQuestion, totalPages } = useMemo(() => ({
    indexOfLastQuestion: currentPage * questionsPerPage,
    indexOfFirstQuestion: currentPage * questionsPerPage - questionsPerPage,
    totalPages: Math.ceil(filteredQuestions.length / questionsPerPage)
  }), [currentPage, filteredQuestions.length, questionsPerPage]);

  const currentQuestions = useMemo(() => 
    filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion),
    [filteredQuestions, indexOfFirstQuestion, indexOfLastQuestion]
  );

  // Filter questions
  const filterQuestions = useCallback(() => {
    let filtered = questions;
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        [q.question, q.topic, q.subject].some(field => 
          field?.toLowerCase().includes(lowerSearch)
        )
      );
    }
    
    if (selectedYear) filtered = filtered.filter(q => q.year === selectedYear);
    if (selectedTopic) filtered = filtered.filter(q => q.topic === selectedTopic);
    
    setFilteredQuestions(filtered);
    setCurrentPage(1);
  }, [questions, searchTerm, selectedYear, selectedTopic]);

  useEffect(() => {
    filterQuestions();
  }, [filterQuestions]);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/mock-test/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fetch-all-questions',
            examCategory: params.examcategory
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (data.success) {
          setQuestions(data.questions);
          toast.success(`Loaded ${data.questions.length} questions`);
        } else {
          throw new Error(data.error || 'Failed to load questions');
        }
      } catch (error) {
        toast.error(`Error loading questions: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [params.examcategory]);

  // Handlers
  const toggleQuestionSelection = useCallback((questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const selectAllFiltered = useCallback(() => {
    const filteredIds = filteredQuestions.map(q => q._id);
    setSelectedQuestions(prev => [...new Set([...prev, ...filteredIds])]);
    toast.success(`Selected ${filteredIds.length} questions`);
  }, [filteredQuestions]);

  const clearSelection = useCallback(() => {
    setSelectedQuestions([]);
    toast.success('Cleared all selections');
  }, []);

  const createTest = useCallback(async () => {
    if (!selectedQuestions.length || !testConfig.testName.trim()) {
      toast.error(!selectedQuestions.length ? 'Select at least one question' : 'Enter a test name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/mock-test/admin/create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-yearwise-test',
          examCategory: params.examcategory,
          testConfig: { ...testConfig, testName: testConfig.testName.trim() },
          questionIds: selectedQuestions,
          selectedYear,
          selectedTopic
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Test "${testConfig.testName}" created with ${selectedQuestions.length} questions`);
        setShowTestModal(false);
        setTestConfig({ testName: '', duration: 60, totalMarks: 100, passingMarks: 40, instructions: '' });
        setSelectedQuestions([]);
      } else {
        throw new Error(data.error || 'Failed to create test');
      }
    } catch (error) {
      toast.error(`Error creating test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuestions, testConfig, params.examcategory, selectedYear, selectedTopic]);

  const quickYearSelect = useCallback((year) => {
    setSelectedYear(year);
    setSelectedQuestions([]);
    setCurrentPage(1);
    toast.success(`Selected year: ${year}`);
  }, []);

  const quickTopicSelect = useCallback((topic) => {
    setSelectedTopic(topic);
    setSelectedQuestions([]);
    setCurrentPage(1);
    toast.success(`Selected topic: ${topic}`);
  }, []);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{user ? 'Access Denied' : 'Sign In Required'}</h2>
          <p className="text-gray-600">{user ? 'Only admin users can access this panel' : 'Please sign in to access admin panel'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Year-wise Test</h1>
          <p className="text-gray-600">Select questions by year and topic for {params.examcategory?.toUpperCase() || 'All Categories'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<BookOpen className="h-8 w-8 text-blue-600" />} title="Total Questions" value={questions.length} />
          <StatCard icon={<Calendar className="h-8 w-8 text-green-600" />} title="Available Years" value={years.length} />
          <StatCard icon={<CheckCircle className="h-8 w-8 text-orange-600" />} title="Selected" value={selectedQuestions.length} />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Year & Topic Selection
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {years.slice(0, 12).map(year => (
              <button
                key={year}
                onClick={() => quickYearSelect(year)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedYear === year ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {topics.slice(0, 12).map(topic => (
              <button
                key={topic}
                onClick={() => quickTopicSelect(topic)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTopic === topic ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
          {(years.length > 12 || topics.length > 12) && (
            <div className="text-center">
              <button
                onClick={() => { setSelectedYear(''); setSelectedTopic(''); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
              >
                View All {years.length} Years & {topics.length} Topics
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Smart Search & Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Questions</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by question, topic, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Topics</option>
                {topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold text-blue-600">{filteredQuestions.length}</span> of <span className="font-semibold">{questions.length}</span> questions
            </span>
            <div className="flex space-x-3">
              <button onClick={selectAllFiltered} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">
                Select All ({filteredQuestions.length})
              </button>
              <button onClick={clearSelection} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium">
                Clear Selection
              </button>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-center text-sm text-blue-800">
              Page {currentPage} of {totalPages} | Showing {indexOfFirstQuestion + 1} to {Math.min(indexOfLastQuestion, filteredQuestions.length)} of {filteredQuestions.length} questions
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
            {selectedQuestions.length > 0 && (
              <button
                onClick={() => setShowTestModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Test ({selectedQuestions.length})</span>
              </button>
            )}
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions match your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestions.map((question, index) => (
                  <QuestionRow
                    key={question._id}
                    question={question}
                    index={indexOfFirstQuestion + index}
                    isSelected={selectedQuestions.includes(question._id)}
                    onToggleSelection={() => toggleQuestionSelection(question._id)}
                  />
                ))}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {showTestModal && (
          <TestCreationModal
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            selectedQuestions={selectedQuestions}
            isLoading={isLoading}
            onCreate={createTest}
            onClose={() => setShowTestModal(false)}
          />
        )}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        {icon}
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = Math.min(5, totalPages);
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="mt-6 flex items-center justify-center space-x-3">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 font-medium"
      >
        First
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 font-medium"
      >
        Previous
      </button>
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 text-sm border rounded-lg font-medium ${
            currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 font-medium"
      >
        Next
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 font-medium"
      >
        Last
      </button>
    </div>
  );
}

function TestCreationModal({ testConfig, setTestConfig, selectedQuestions, isLoading, onCreate, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create New Test</h3>
        <p className="text-gray-600 mb-6">Configure test with {selectedQuestions.length} selected questions</p>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Name *</label>
            <input
              type="text"
              value={testConfig.testName}
              onChange={(e) => setTestConfig(prev => ({ ...prev, testName: e.target.value }))}
              placeholder="e.g., GATE CSE 2025 Test"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={testConfig.duration}
                onChange={(e) => setTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                min="15"
                max="300"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
              <input
                type="number"
                value={testConfig.totalMarks}
                onChange={(e) => setTestConfig(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 100 }))}
                min="1"
                max="1000"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks</label>
            <input
              type="number"
              value={testConfig.passingMarks}
              onChange={(e) => setTestConfig(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 40 }))}
              min="1"
              max={testConfig.totalMarks}
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
            <textarea
              value={testConfig.instructions}
              onChange={(e) => setTestConfig(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Enter test instructions..."
              rows="4"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Test Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-600">Questions:</span> <span className="ml-2 font-medium">{selectedQuestions.length}</span></div>
              <div><span className="text-gray-600">Duration:</span> <span className="ml-2 font-medium">{testConfig.duration} minutes</span></div>
              <div><span className="text-gray-600">Total Marks:</span> <span className="ml-2 font-medium">{testConfig.totalMarks}</span></div>
              <div><span className="text-gray-600">Passing Marks:</span> <span className="ml-2 font-medium">{testConfig.passingMarks}</span></div>
            </div>
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={isLoading || selectedQuestions.length === 0 || !testConfig.testName.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Test'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({ question, index, isSelected, onToggleSelection }) {
  const [showDetails, setShowDetails] = useState(false);

  const truncateText = (text, maxLength = 120) => 
    text ? text.replace(/<[^>]*>/g, '').trim().slice(0, maxLength) + (text.length > maxLength ? '...' : '') : '';

  const getDifficultyColor = (difficulty) => ({
    easy: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hard: 'bg-red-100 text-red-800 border-red-200'
  }[difficulty?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200');

  return (
    <div className={`border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-md ${
      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="h-5 w-5 text-green-600 focus:ring-green-500 border-2 border-gray-300 rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">#{index + 1}</span>
              {question.difficulty && (
                <span className={`px-3 py-1 text-xs rounded-full border ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty.toUpperCase()}
                </span>
              )}
              {question.year && (
                <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">📅 {question.year}</span>
              )}
              {question.topic && (
                <span className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-full">🎯 {question.topic}</span>
              )}
            </div>
            <div className="text-sm text-gray-800 font-medium">{truncateText(question.question)}</div>
            {showDetails && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {question.subject && <div><span className="text-blue-600 font-semibold">Subject:</span> {question.subject}</div>}
                  {question.topic && <div><span className="text-green-600 font-semibold">Topic:</span> {question.topic}</div>}
                  {question.correct_option && <div><span className="text-purple-600 font-semibold">Answer:</span> {question.correct_option}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            showDetails ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>
    </div>
  );
}