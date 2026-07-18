'use client';

import Link from 'next/link';
import {
  Plus,
  Search,
  Sparkles,
  Globe,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminArticles } from './useAdminArticles';
import CategoryManager from './CategoryManager';
import ArticlesTable from './ArticlesTable';
import ArticleFormModal from './ArticleFormModal';
import GenerateArticleModal from './GenerateArticleModal';
import ScrapeArticleModal from './ScrapeArticleModal';
import ScrapeTechJobModal from './ScrapeTechJobModal';
import SarkariLinksPanel from './SarkariLinksPanel';
import TwitterComposePanel from './TwitterComposePanel';

export default function AdminArticlesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const admin = useAdminArticles({ isAdmin, authLoading });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Authentication Required</h1>
          <p className="text-neutral-600 mb-6">Please sign in to access the admin panel.</p>
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Access Denied</h1>
          <p className="text-neutral-600 mb-6">You don&apos;t have permission to access the admin panel.</p>
          <Link
            href="/"
            className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!admin.hasLoadedOnce && admin.loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Article Management</h1>
          <p className="text-neutral-600">Manage your articles and content</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={admin.searchTerm}
                onChange={(e) => admin.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              />
            </div>

            <div className="md:w-48">
              <select
                value={admin.selectedCategory}
                onChange={(e) => admin.setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                disabled={admin.categoriesLoading}
              >
                <option value="">All Categories</option>
                {admin.categories && Array.isArray(admin.categories) && admin.categories.length > 0 ? (
                  admin.categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))
                ) : !admin.categoriesLoading ? (
                  <option value="" disabled>No categories</option>
                ) : null}
              </select>
            </div>

            <div className="md:w-40">
              <select
                value={admin.selectedStatus}
                onChange={(e) => admin.setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => admin.setShowGenerateModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate Article
              </button>
              <button
                onClick={() => admin.setShowScrapeModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Globe className="w-4 h-4" />
                Scrape Article
              </button>
              <button
                onClick={() => admin.setShowTechJobModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Briefcase className="w-4 h-4" />
                Add Tech Job
              </button>
              <button
                onClick={() => admin.setShowCreateModal(true)}
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Article
              </button>
            </div>
          </div>
        </div>

        <CategoryManager
          categories={admin.categories}
          onCreateCategory={admin.handleCreateCategory}
          onDeleteCategory={admin.handleDeleteCategory}
        />

        <TwitterComposePanel />

        <SarkariLinksPanel />

        <ArticlesTable
          articles={admin.articles}
          searchTerm={admin.searchTerm}
          selectedCategory={admin.selectedCategory}
          selectedStatus={admin.selectedStatus}
          pagination={admin.pagination}
          page={admin.page}
          setPage={admin.setPage}
          onEdit={admin.openEditModal}
          onDelete={admin.handleDeleteArticle}
          onCreate={() => admin.setShowCreateModal(true)}
        />
      </div>

      <GenerateArticleModal
        open={admin.showGenerateModal}
        onClose={() => admin.setShowGenerateModal(false)}
        onUseArticle={(partial) => admin.populateFormFromExternal(partial)}
      />

      <ScrapeArticleModal
        open={admin.showScrapeModal}
        onClose={() => admin.setShowScrapeModal(false)}
        onUseArticle={(partial) => admin.populateFormFromExternal(partial)}
      />

      <ScrapeTechJobModal
        open={admin.showTechJobModal}
        onClose={() => admin.setShowTechJobModal(false)}
        onUseArticle={(partial) => admin.populateFormFromExternal(partial)}
      />

      <ArticleFormModal
        open={admin.showCreateModal}
        editingArticle={admin.editingArticle}
        formData={admin.formData}
        setFormData={admin.setFormData}
        selectedSubreddits={admin.selectedSubreddits}
        setSelectedSubreddits={admin.setSelectedSubreddits}
        categories={admin.categories}
        categoriesLoading={admin.categoriesLoading}
        categoriesError={admin.categoriesError}
        onClose={admin.closeModal}
        onSubmit={admin.editingArticle ? admin.handleUpdateArticle : admin.handleCreateArticle}
      />
    </div>
  );
}
