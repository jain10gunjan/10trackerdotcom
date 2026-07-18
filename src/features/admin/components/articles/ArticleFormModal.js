'use client';

import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import EmbedManager from '@/components/EmbedManager';
import ImageUpload from '@/components/ImageUpload';
import { SUBREDDITS } from '@/lib/subreddits';

export default function ArticleFormModal({
  open,
  editingArticle,
  formData,
  setFormData,
  selectedSubreddits,
  setSelectedSubreddits,
  categories,
  categoriesLoading,
  categoriesError,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-4 max-h-[95vh] flex flex-col"
          >
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
                  {editingArticle ? 'Edit Article' : 'Create New Article'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Enter article title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select Category'}
                    </option>
                    {categories && Array.isArray(categories) && categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))
                    ) : !categoriesLoading ? (
                      <option value="" disabled>No categories available</option>
                    ) : null}
                  </select>
                  {categoriesError && (
                    <p className="mt-1 text-sm text-red-600">Error loading categories. Please refresh.</p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Brief description of the article"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your article content here..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                {/* Featured Image */}
                <ImageUpload
                  value={formData.featured_image_url}
                  onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
                  label="Featured Image"
                  required={false}
                />

                {/* Social Media Embeds */}
                <div>
                  <EmbedManager
                    embeds={formData.social_media_embeds || []}
                    onChange={(embeds) => setFormData({ ...formData, social_media_embeds: embeds })}
                  />
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-neutral-800 focus:ring-neutral-800 border-neutral-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-neutral-700">
                    Mark as Featured Article
                  </label>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                {/* Subreddit Selection - Only show when publishing */}
                {formData.status === 'published' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Subreddits to Post (Optional)
                    </label>
                    <div className="border border-neutral-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SUBREDDITS.map((subreddit) => (
                          <div key={subreddit.name} className="flex items-center">
                            <input
                              type="checkbox"
                              id={subreddit.name}
                              checked={selectedSubreddits.some(s => s.name === subreddit.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubreddits([...selectedSubreddits, subreddit]);
                                } else {
                                  setSelectedSubreddits(selectedSubreddits.filter(s => s.name !== subreddit.name));
                                }
                              }}
                              className="h-4 w-4 text-neutral-800 focus:ring-neutral-800 border-neutral-300 rounded"
                            />
                            <label htmlFor={subreddit.name} className="ml-2 text-sm text-neutral-700">
                              {subreddit.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedSubreddits.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <p className="text-sm text-neutral-600 mb-2">
                            Selected: {selectedSubreddits.length} subreddit{selectedSubreddits.length !== 1 ? 's' : ''}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedSubreddits.map((subreddit) => (
                              <span
                                key={subreddit.name}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {subreddit.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      Select one or more subreddits to post this article to. The article will be added to the Google Sheet for each selected subreddit.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 pt-4 sm:pt-6 border-t border-neutral-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
  );
}
