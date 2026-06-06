'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Image as ImageIcon,
  Loader2,
  Check,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastPromise } from '@/lib/toastAsync';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';

const AdminPostableEntriesPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosted, setFilterPosted] = useState('all'); // 'all', 'posted', 'unposted'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    category: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  const { categories, loading: categoriesLoading } = useArticleCategories({ enabled: true });

  useEffect(() => {
    fetchEntries();
  }, [filterPosted]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterPosted === 'posted') params.append('is_posted', 'true');
      if (filterPosted === 'unposted') params.append('is_posted', 'false');

      const response = await fetch(`/api/postable-entries/list?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setEntries(result.data || []);
      } else {
        toast.error(result.error || 'Failed to fetch entries');
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.image_url.trim() || !formData.category) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await toastPromise(
        async () => {
          const url = '/api/postable-entries';
          const method = editingEntry ? 'PUT' : 'POST';
          const body = editingEntry ? { ...formData, id: editingEntry.id } : formData;

          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'Failed to save entry');
          }

          setShowCreateModal(false);
          setEditingEntry(null);
          setFormData({ title: '', image_url: '', category: '' });
          await fetchEntries();
          return editingEntry ? 'Entry updated successfully' : 'Entry created successfully';
        },
        {
          loading: 'Saving entry…',
          success: (msg) => msg,
          error: (err) => err.message || 'Failed to save entry',
        }
      );
    } catch {
      /* toast.promise surfaces the error */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await toastPromise(
        async () => {
          const response = await fetch(`/api/postable-entries?id=${id}`, {
            method: 'DELETE',
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'Failed to delete entry');
          }
          await fetchEntries();
          return 'Entry deleted successfully';
        },
        {
          loading: 'Deleting entry…',
          success: (msg) => msg,
          error: (err) => err.message || 'Failed to delete entry',
        }
      );
    } catch {
      /* toast.promise surfaces the error */
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      image_url: entry.image_url,
      category: entry.category,
    });
    setShowCreateModal(true);
  };

  const handleReset = () => {
    setEditingEntry(null);
    setFormData({ title: '', image_url: '', category: '' });
    setShowCreateModal(false);
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const unpostedCount = entries.filter(e => !e.is_posted).length;
  const postedCount = entries.filter(e => e.is_posted).length;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Postable Entries
              </h1>
              <p className="text-neutral-600">
                Manage entries that can be posted one by one
              </p>
            </div>
            <button
              onClick={() => {
                handleReset();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Entry
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="text-sm text-neutral-600 mb-1">Total Entries</div>
              <div className="text-2xl font-bold text-neutral-900">{entries.length}</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="text-sm text-neutral-600 mb-1">Unposted</div>
              <div className="text-2xl font-bold text-blue-600">{unpostedCount}</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="text-sm text-neutral-600 mb-1">Posted</div>
              <div className="text-2xl font-bold text-green-600">{postedCount}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterPosted('all')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  filterPosted === 'all'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPosted('unposted')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  filterPosted === 'unposted'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                Unposted
              </button>
              <button
                onClick={() => setFilterPosted('posted')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  filterPosted === 'posted'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                Posted
              </button>
              <button
                onClick={fetchEntries}
                className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {editingEntry ? 'Edit Entry' : 'Create New Entry'}
                  </h2>
                  <button
                    onClick={handleReset}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    placeholder="Enter title"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
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
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingEntry ? 'Update Entry' : 'Create Entry'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-600" />
            <p className="text-neutral-600">Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
            <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <h3 className="text-lg text-neutral-900 mb-1">No entries found</h3>
            <p className="text-neutral-600 text-sm">
              {searchTerm ? 'Try adjusting your search' : 'Create your first entry to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative w-full h-48 bg-neutral-100">
                  <img
                    src={entry.image_url}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden absolute inset-0 items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-neutral-400" />
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {entry.is_posted ? (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Posted
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Unposted
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded">
                      {entry.category}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mb-4">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPostableEntriesPage;
