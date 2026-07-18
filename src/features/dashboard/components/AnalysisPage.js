'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Search, Filter, ChevronDown, ChevronUp, RefreshCcw, Download, Book, TrendingUp } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Anon Key must be defined in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    subject: 'all',
    year: 'all',
    difficulty: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'descending' });
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('examtracker')
          .select('*')
          .eq('category', 'JEE-MAIN')
          .limit(2000);
        if (error) {
          throw error;
        }
        setQuestions(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load data. Please try again later.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters and search to data
  const filteredData = useMemo(() => {
    return questions
      .filter((q) => {
        const matchesSubject = filter.subject === 'all' || q.subject === filter.subject;
        const matchesYear = filter.year === 'all' || q.year === Number(filter.year);
        const matchesDifficulty = filter.difficulty === 'all' || q.difficulty === filter.difficulty;
        const matchesSearch =
          !searchTerm ||
          q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.subject.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSubject && matchesYear && matchesDifficulty && matchesSearch;
      })
      .sort((a, b) => {
        if (sortConfig.key) {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
  }, [questions, filter, searchTerm, sortConfig]);

  // Data processing functions
  const getTopicData = () => {
    const topicCounts = {};
    filteredData.forEach((q) => {
      const formattedTopic = formatTopic(q.topic);
      topicCounts[formattedTopic] = (topicCounts[formattedTopic] || 0) + 1;
    });
    return Object.entries(topicCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getYearSubjectData = () => {
    const yearData = {};
    filteredData.forEach((q) => {
      if (!yearData[q.year]) {
        yearData[q.year] = { year: q.year, Chemistry: 0, Physics: 0, Mathematics: 0 };
      }
      yearData[q.year][q.subject]++;
    });
    return Object.values(yearData).sort((a, b) => a.year - b.year);
  };

  const getDifficultyData = () => {
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    filteredData.forEach((q) => difficultyCount[q.difficulty]++);
    return [
      { name: 'Easy', value: difficultyCount.easy, color: '#4ade80' },
      { name: 'Medium', value: difficultyCount.medium, color: '#facc15' },
      { name: 'Hard', value: difficultyCount.hard, color: '#f87171' },
    ];
  };

  const getYearwiseDifficultyData = () => {
    const yearData = {};
    filteredData.forEach((q) => {
      if (!yearData[q.year]) {
        yearData[q.year] = { year: q.year, easy: 0, medium: 0, hard: 0 };
      }
      yearData[q.year][q.difficulty]++;
    });
    return Object.values(yearData).sort((a, b) => a.year - b.year);
  };

  const getSubjectTrendData = () => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    const years = [...new Set(filteredData.map((q) => q.year))].sort();

    return subjects.map((subject) => {
      const data = years.map((year) => {
        const count = filteredData.filter((q) => q.subject === subject && q.year === year).length;
        return { year, count };
      });
      return { subject, data };
    });
  };

  const predictTrends = () => {
    const topicsByYear = {};
    filteredData.forEach((q) => {
      if (!topicsByYear[q.year]) topicsByYear[q.year] = {};
      const formattedTopic = formatTopic(q.topic);
      topicsByYear[q.year][formattedTopic] = (topicsByYear[q.year][formattedTopic] || 0) + 1;
    });

    const years = Object.keys(topicsByYear).sort();
    if (years.length < 2) return [];

    const allTopics = new Set();
    years.forEach((year) => {
      Object.keys(topicsByYear[year]).forEach((topic) => allTopics.add(topic));
    });

    const trends = [];
    allTopics.forEach((topic) => {
      let isIncreasing = true;
      let isDecreasing = true;

      for (let i = 1; i < years.length; i++) {
        const prevCount = topicsByYear[years[i - 1]][topic] || 0;
        const currCount = topicsByYear[years[i]][topic] || 0;

        if (currCount <= prevCount) isIncreasing = false;
        if (currCount >= prevCount) isDecreasing = false;
      }

      if (isIncreasing || isDecreasing) {
        const lastYearCount = topicsByYear[years[years.length - 1]][topic] || 0;
        if (lastYearCount > 0) {
          trends.push({
            topic,
            trend: isIncreasing ? 'increasing' : 'decreasing',
            significance: lastYearCount,
          });
        }
      }
    });

    return trends.sort((a, b) => b.significance - a.significance);
  };

  // Helper functions
  const formatTopic = (topic) => {
    return topic
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const exportCSV = () => {
    const sanitize = (value) => {
      if (typeof value === 'string') {
        if (value.startsWith('=') || value.startsWith('+') || value.startsWith('-') || value.startsWith('@')) {
          return `'${value}`;
        }
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headers = ['Subject', 'Topic', 'Year', 'Difficulty'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map((q) =>
        [
          sanitize(q.subject),
          sanitize(formatTopic(q.topic)),
          sanitize(q.year),
          sanitize(q.difficulty),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'jee_questions_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique values for filters
  const uniqueSubjects = ['all', ...new Set(questions.map((q) => q.subject))];
  const uniqueYears = ['all', ...new Set(questions.map((q) => q.year))].sort((a, b) => b - a);
  const uniqueDifficulties = ['all', 'easy', 'medium', 'hard'];

  // Memoized data
  const topicData = useMemo(() => getTopicData(), [filteredData, getTopicData]);
  const yearSubjectData = useMemo(() => getYearSubjectData(), [filteredData, getYearSubjectData]);
  const difficultyData = useMemo(() => getDifficultyData(), [filteredData, getDifficultyData]);
  const yearwiseDifficultyData = useMemo(() => getYearwiseDifficultyData(), [filteredData, getYearwiseDifficultyData]);
  const subjectTrendData = useMemo(() => getSubjectTrendData(), [filteredData, getSubjectTrendData]);
  const trends = useMemo(() => predictTrends(), [filteredData, predictTrends]);

  // Chart configurations
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Book className="mr-2" /> JEE Questions Dashboard
              </h1>
              <p className="text-indigo-200 text-sm">Analyze trends and patterns in JEE Main questions</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                aria-expanded={showFilters}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </button>
              <button
                onClick={exportCSV}
                className="bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className={`bg-white rounded-lg shadow-md mb-6 transition-all duration-300 ${showFilters ? 'p-4' : 'p-2'}`}>
          <div className="relative flex md:w-1/2 mb-2">
            <label htmlFor="search" className="sr-only">
              Search topics or subjects
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              type="text"
              className="pl-10 block w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Search topics or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 items-center mt-3 border-t pt-3">
              <div className="flex items-center text-sm text-gray-700 font-medium">
                <Filter className="h-4 w-4 mr-1 text-gray-400" /> Filters:
              </div>

              <select
                className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={filter.subject}
                onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
              >
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={filter.year}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              >
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={filter.difficulty}
                onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
              >
                {uniqueDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all'
                      ? 'All Difficulties'
                      : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setFilter({ subject: 'all', year: 'all', difficulty: 'all' })}
                className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Questions</p>
            <p className="text-2xl font-bold text-gray-800">{filteredData.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Subjects</p>
            <p className="text-2xl font-bold text-gray-800">{new Set(filteredData.map((q) => q.subject)).size}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Topics</p>
            <p className="text-2xl font-bold text-gray-800">{new Set(filteredData.map((q) => q.topic)).size}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Years</p>
            <p className="text-2xl font-bold text-gray-800">{new Set(filteredData.map((q) => q.year)).size}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex" role="tablist">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-3 px-1 border-b-2 font-medium text-sm`}
                role="tab"
                aria-selected={activeTab === 'overview'}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`${
                  activeTab === 'table'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-3 px-1 border-b-2 font-medium text-sm`}
                role="tab"
                aria-selected={activeTab === 'table'}
              >
                Data Table
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`${
                  activeTab === 'analysis'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-3 px-1 border-b-2 font-medium text-sm`}
                role="tab"
                aria-selected={activeTab === 'analysis'}
              >
                Topic Analysis
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`${
                  activeTab === 'trends'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-3 px-1 border-b-2 font-medium text-sm`}
                role="tab"
                aria-selected={activeTab === 'trends'}
              >
                Trends
              </button>
            </nav>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-500"></div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject Distribution */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Subject Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={uniqueSubjects
                              .filter((s) => s !== 'all')
                              .map((subject) => ({
                                name: subject,
                                value: filteredData.filter((q) => q.subject === subject).length,
                              }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {uniqueSubjects
                              .filter((s) => s !== 'all')
                              .map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} questions`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Difficulty Distribution */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Difficulty Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={difficultyData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {difficultyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} questions`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Year-wise Subject Distribution */}
                    <div className="bg-white border rounded-lg shadow-sm p-4 md:col-span-2">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Year-wise Subject Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={yearSubjectData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Physics" fill="#3b82f6" />
                          <Bar dataKey="Chemistry" fill="#10b981" />
                          <Bar dataKey="Mathematics" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Table Tab */}
                {activeTab === 'table' && (
                  <div className="overflow-x-auto bg-white rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('subject')}
                            role="columnheader"
                            aria-sort={sortConfig.key === 'subject' ? sortConfig.direction : 'none'}
                          >
                            <div className="flex items-center gap-1">
                              Subject
                              {getSortIcon('subject')}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('topic')}
                            role="columnheader"
                            aria-sort={sortConfig.key === 'topic' ? sortConfig.direction : 'none'}
                          >
                            <div className="flex items-center gap-1">
                              Topic
                              {getSortIcon('topic')}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('year')}
                            role="columnheader"
                            aria-sort={sortConfig.key === 'year' ? sortConfig.direction : 'none'}
                          >
                            <div className="flex items-center gap-1">
                              Year
                              {getSortIcon('year')}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('difficulty')}
                            role="columnheader"
                            aria-sort={sortConfig.key === 'difficulty' ? sortConfig.direction : 'none'}
                          >
                            <div className="flex items-center gap-1">
                              Difficulty
                              {getSortIcon('difficulty')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredData.map((question) => (
                          <tr key={question.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{question.subject}</td>
                            <td className="px-6 py-3 text-sm text-gray-500">{formatTopic(question.topic)}</td>
                            <td className="px-6 py-3 text-sm text-gray-500">{question.year}</td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  question.difficulty === 'easy'
                                    ? 'bg-green-100 text-green-800'
                                    : question.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredData.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-gray-500">No questions match your filters</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Tab */}
                {activeTab === 'analysis' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Topics */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Most Frequent Topics</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={topicData.slice(0, 8)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Subject Trends */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Subject Trends Across Years</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" type="category" allowDuplicatedCategory={false} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {subjectTrendData.map((s, index) => (
                            <Line
                              key={s.subject}
                              data={s.data}
                              type="monotone"
                              dataKey="count"
                              name={s.subject}
                              stroke={COLORS[index % COLORS.length]}
                              activeDot={{ r: 8 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Year-wise Difficulty */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Year-wise Difficulty</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={yearwiseDifficultyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="easy" name="Easy" fill="#4ade80" />
                          <Bar dataKey="medium" name="Medium" fill="#facc15" />
                          <Bar dataKey="hard" name="Hard" fill="#f87171" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Topic Distribution */}
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Topic Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={topicData.slice(0, 10)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              percent > 0.05
                                ? `${name.length > 10 ? name.slice(0, 10) + '...' : name}: ${(percent * 100).toFixed(0)}%`
                                : ''
                            }
                          >
                            {topicData.slice(0, 10).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} questions`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <div>
                    {/* Topic Trends */}
                    <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-indigo-500" />
                          Topic Trends Analysis
                        </div>
                      </h3>

                      {trends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trends.slice(0, 6).map((item, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                item.trend === 'increasing' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <span
                                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${
                                    item.trend === 'increasing' ? 'bg-green-100' : 'bg-red-100'
                                  } mr-3`}
                                >
                                  {item.trend === 'increasing' ? (
                                    <ChevronUp
                                      className={`h-5 w-5 ${item.trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}
                                    />
                                  ) : (
                                    <ChevronDown
                                      className={`h-5 w-5 ${item.trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}
                                    />
                                  )}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.topic}</p>
                                  <p
                                    className={`text-xs ${
                                      item.trend === 'increasing' ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {item.trend === 'increasing'
                                      ? 'Increasing trend - higher likelihood in future exams'
                                      : 'Decreasing trend - may appear less frequently'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                          <p className="text-yellow-700 text-sm">
                            Not enough data to determine clear trends. More years of data needed for accurate trend prediction.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Historical Subject Distribution */}
                    <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Subject Distribution Over Years</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={yearSubjectData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Physics" fill="#3b82f6" />
                          <Bar dataKey="Chemistry" fill="#10b981" />
                          <Bar dataKey="Mathematics" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Focus Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-lg shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">High Frequency Topics</h3>
                        <div className="space-y-3">
                          {topicData.slice(0, 5).map((topic, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                  <span className="text-indigo-800 font-semibold">{index + 1}</span>
                                </div>
                                <span className="text-gray-800">{topic.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                  {topic.value} questions
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Predictable Topics</h3>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-700 mb-2">Exam Focus Recommendation</h4>
                          <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                            {[...topicData.slice(0, 3), ...trends.filter((t) => t.trend === 'increasing').slice(0, 2)]
                              .filter((t, i, arr) => arr.findIndex((x) => x.name === t.name || x.topic === t.name) === i)
                              .map((topic, i) => (
                                <li key={i}>{topic.name || topic.topic}</li>
                              ))}
                          </ul>
                          <p className="mt-3 text-xs text-blue-600">
                            These topics show consistent presence across years and are highly likely to appear in future
                            exams.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}