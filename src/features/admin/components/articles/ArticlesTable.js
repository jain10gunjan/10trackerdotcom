'use client';

import {
  Edit,
  Trash2,
  Eye,
  Search,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatArticleDate } from './adminArticlesConstants';

export default function ArticlesTable({
  articles,
  searchTerm,
  selectedCategory,
  selectedStatus,
  pagination,
  page,
  setPage,
  onEdit,
  onDelete,
  onCreate,
}) {
  return (
    <>
        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Views</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-neutral-50">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        {article.featured_image_url && (
                          <img
                            src={article.featured_image_url}
                            alt={article.title}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                            <span className="line-clamp-1">{article.title}</span>
                            {article.is_featured && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500 line-clamp-1 mt-1">
                            {(article.excerpt || (article.content || '').replace(/<[^>]+>/g, '').substring(0, 100) || 'No excerpt')}
                            {((article.excerpt || article.content) && '...')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {article.category_name || article.category}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        article.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-neutral-500">
                      {article.view_count || 0}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-neutral-500">
                      {formatArticleDate(article.created_at)}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!article.slug) {
                              toast.error('Article has no slug');
                              return;
                            }
                            window.open(`/articles/${article.slug}`, '_blank');
                          }}
                          className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                          title="View Article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(article)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(article.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-neutral-200">
            {articles.map((article) => (
              <div key={article.id} className="p-4 hover:bg-neutral-50">
                <div className="flex items-start gap-3">
                  {article.featured_image_url && (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 flex-1">
                        {article.title}
                      </h3>
                      {article.is_featured && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                      {(article.excerpt || (article.content || '').replace(/<[^>]+>/g, '').substring(0, 100) || 'No excerpt')}
                      {(article.excerpt || article.content) ? '...' : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {article.category_name || article.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        article.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.status || 'unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count || 0} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatArticleDate(article.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!article.slug) {
                            toast.error('Article has no slug');
                            return;
                          }
                          window.open(`/articles/${article.slug}`, '_blank');
                        }}
                        className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => onEdit(article)}
                        className="flex-1 px-3 py-2 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(article.id)}
                        className="px-3 py-2 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No articles found</h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm || selectedCategory || selectedStatus
                ? 'Try adjusting your search or filters'
                : 'Create your first article to get started'
              }
            </p>
            {!searchTerm && !selectedCategory && !selectedStatus && (
              <button
                onClick={() => onCreate()}
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              >
                Create Article
              </button>
            )}
          </div>
        )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs md:text-sm flex-wrap">
          <p className="text-neutral-500">
            Showing page {pagination.page} of {pagination.totalPages}
            {typeof pagination.totalCount === 'number' ? ` (${pagination.totalCount} total)` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs md:text-sm ${
                page <= 1
                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              className={`px-3 py-1.5 rounded-lg border text-xs md:text-sm ${
                page >= pagination.totalPages
                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
