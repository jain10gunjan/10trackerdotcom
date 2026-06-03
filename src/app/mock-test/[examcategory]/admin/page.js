"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { getCategoryVariants } from '@/lib/mockTestUtils';
import {
  Plus,
  BookOpen,
  BarChart3,
  FileText,
  Zap,
  Calendar,
  Layers,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MockTestAdminPage() {
  const params = useParams();
  const examcategory = params?.examcategory || 'gate-cse';
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tests, setTests] = useState([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const base = `/mock-test/${examcategory}/admin`;

  const fetchTests = useCallback(async () => {
    try {
      setIsLoading(true);
      const variants = getCategoryVariants(examcategory);
      const { data: mockTests, error } = await supabase
        .from('mock_tests')
        .select('id, name, created_at, total_questions, category, is_active')
        .in('category', variants)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = mockTests || [];
      setTests(
        rows.map((t) => ({
          id: t.id,
          name: t.name,
          createdAt: t.created_at,
          questionCount: t.total_questions,
          category: t.category,
          is_active: t.is_active,
        }))
      );

      if (rows.length > 0) {
        const ids = rows.map((t) => t.id);
        const { count } = await supabase
          .from('user_test_attempts')
          .select('id', { count: 'exact', head: true })
          .in('test_id', ids)
          .eq('is_completed', true);
        setAttemptCount(count || 0);
      } else {
        setAttemptCount(0);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  }, [examcategory]);

  useEffect(() => {
    if (isAdmin) fetchTests();
    else if (!authLoading) setIsLoading(false);
  }, [isAdmin, authLoading, fetchTests]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only admin users can access this panel.</p>
        </div>
      </div>
    );
  }

  const totalQuestions = tests.reduce((s, t) => s + (t.questionCount || 0), 0);
  const categoryLabel = String(examcategory).toUpperCase().replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryLabel} Mock Test Admin</h1>
          <p className="text-gray-600">Manage tests and question sets for this exam category</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Tests</p>
            <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Questions (in tests)</p>
            <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Completed Attempts</p>
            <p className="text-2xl font-bold text-gray-900">{attemptCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Category</p>
            <p className="text-lg font-bold text-gray-900 truncate">{categoryLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href={`${base}/create`} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Test</h3>
                  <p className="text-gray-600">Manual or auto question selection</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`${base}/create?mode=topic`} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Layers className="h-6 w-6 text-sky-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create Topic-wise Test</h3>
                  <p className="text-gray-600">20 questions · 30 minutes · single topic</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`${base}/create-yearwise`} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create Year-wise Test</h3>
                  <p className="text-gray-600">Filter PYQs by year</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`${base}/api-integration`} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">API Integration</h3>
                  <p className="text-gray-600">Import questions (allowlisted hosts)</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`${base}/daily-practice`} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Daily Practice</h3>
                  <p className="text-gray-600">Build DPP sets</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/bulk-questions" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bulk Questions</h3>
                  <p className="text-gray-600">Manage examtracker questions</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/mock-test/${examcategory}`} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-neutral-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Student Dashboard</h3>
                  <p className="text-gray-600">Preview learner mock-test hub</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tests</h3>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading tests...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tests created yet for this category</p>
                <Link
                  href={`${base}/create`}
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create First Test
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tests.map((test) => (
                      <tr key={test.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{test.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{test.questionCount || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {test.is_active !== false ? 'Active' : 'Inactive'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
