'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useArticleCategories, clearCategoriesCache } from '@/features/articles/hooks/useArticleCategories';
import { EMPTY_ARTICLE_FORM, ARTICLES_PAGE_SIZE } from './adminArticlesConstants';

export function useAdminArticles({ isAdmin, authLoading }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: ARTICLES_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
    hasMore: false,
  });

  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } =
    useArticleCategories({ enabled: true });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(ARTICLES_PAGE_SIZE);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [showTechJobModal, setShowTechJobModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_ARTICLE_FORM });
  const [selectedSubreddits, setSelectedSubreddits] = useState([]);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        admin: '1',
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedStatus) params.set('status', selectedStatus);

      const response = await fetch(`/api/articles?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setArticles(Array.isArray(result.data) ? result.data : []);
        if (result.pagination) {
          setPagination({
            page: result.pagination.page || page,
            pageSize: result.pagination.pageSize || limit,
            totalCount: result.pagination.totalCount || 0,
            totalPages: result.pagination.totalPages || 1,
            hasMore: Boolean(result.pagination.hasMore),
          });
        }
      } else {
        toast.error(result.error || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to fetch articles');
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [page, limit, debouncedSearch, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchArticles();
    }
  }, [authLoading, isAdmin, fetchArticles]);

  const buildArticlePayload = () => ({
    title: formData.title?.trim() || '',
    content: formData.content || '',
    excerpt: formData.excerpt?.trim() || '',
    category: formData.category?.trim() || '',
    tags: String(formData.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    featured_image_url: formData.featured_image_url?.trim() || '',
    is_featured: Boolean(formData.is_featured),
    social_media_embeds: Array.isArray(formData.social_media_embeds)
      ? formData.social_media_embeds
      : [],
    status: formData.status || 'draft',
    selectedSubreddits,
  });

  const validateArticleForm = () => {
    const title = formData.title?.trim();
    const content = formData.content?.trim();
    const category = formData.category?.trim();

    if (!title) return 'Title is required';
    if (!category) return 'Category is required';
    if (!content) return 'Content is required';
    return null;
  };

  const resetForm = () => {
    setFormData({ ...EMPTY_ARTICLE_FORM });
    setSelectedSubreddits([]);
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    const validationError = validateArticleForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildArticlePayload()),
      });

      const result = await response.json().catch(() => ({}));
      if (result.success) {
        toast.success('Article created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchArticles();
      } else {
        toast.error(result.error || result.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to create article');
    }
  };

  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    if (!editingArticle?.id) {
      toast.error('No article selected for editing');
      return;
    }

    const validationError = validateArticleForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildArticlePayload()),
      });

      const result = await response.json().catch(() => ({}));
      if (result.success) {
        toast.success('Article updated successfully');
        setShowCreateModal(false);
        setEditingArticle(null);
        resetForm();
        fetchArticles();
      } else {
        toast.error(result.error || result.message || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    if (!id) {
      toast.error('Invalid article ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (result.success) {
        toast.success('Article deleted successfully');
        fetchArticles();
      } else {
        toast.error(result.error || result.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const applyArticleToForm = (article) => {
    let embeds = article.social_media_embeds;
    if (typeof embeds === 'string') {
      try {
        embeds = JSON.parse(embeds);
      } catch (e) {
        console.error('Failed to parse social_media_embeds:', e);
        embeds = [];
      }
    }
    if (!Array.isArray(embeds)) {
      embeds = [];
    }

    const tagsValue = Array.isArray(article.tags)
      ? article.tags.join(', ')
      : typeof article.tags === 'string'
        ? article.tags
        : '';

    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      category: article.category || '',
      tags: tagsValue,
      featured_image_url: article.featured_image_url || '',
      is_featured: Boolean(article.is_featured),
      social_media_embeds: embeds,
      status: article.status || 'draft',
    });
    setSelectedSubreddits([]);
  };

  const openEditModal = async (article) => {
    if (!article?.id) {
      toast.error('Invalid article');
      return;
    }

    applyArticleToForm(article);
    setShowCreateModal(true);

    try {
      const response = await fetch(`/api/articles/${article.id}`);
      const result = await response.json().catch(() => ({}));

      if (!result.success || !result.data) {
        toast.error(result.error || 'Could not load full article for editing');
        return;
      }

      applyArticleToForm(result.data);
    } catch (error) {
      console.error('Error loading article for edit:', error);
      toast.error('Could not load full article for editing');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingArticle(null);
    resetForm();
  };

  const populateFormFromExternal = (partial) => {
    setFormData((prev) => ({
      ...prev,
      ...partial,
      social_media_embeds: partial.social_media_embeds || prev.social_media_embeds || [],
    }));
    setEditingArticle(null);
    setShowCreateModal(true);
  };

  const handleCreateCategory = async ({ name, slug, color }) => {
    const res = await fetch('/api/articles/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, color }),
    });
    const result = await res.json();
    if (result.success) {
      clearCategoriesCache();
      await refetchCategories();
    }
    return result;
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return false;
    try {
      const res = await fetch(
        `/api/articles/categories?slug=${encodeURIComponent(cat.slug)}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (result.success) {
        clearCategoriesCache();
        await refetchCategories();
      }
      return result.success;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const setCategoryFilter = (value) => {
    setSelectedCategory(value);
    setPage(1);
  };

  const setStatusFilter = (value) => {
    setSelectedStatus(value);
    setPage(1);
  };

  return {
    articles,
    loading,
    hasLoadedOnce,
    pagination,
    page,
    setPage,
    limit,
    categories,
    categoriesLoading,
    categoriesError,
    refetchCategories,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory: setCategoryFilter,
    selectedStatus,
    setSelectedStatus: setStatusFilter,
    showCreateModal,
    setShowCreateModal,
    showGenerateModal,
    setShowGenerateModal,
    showScrapeModal,
    setShowScrapeModal,
    showTechJobModal,
    setShowTechJobModal,
    editingArticle,
    formData,
    setFormData,
    selectedSubreddits,
    setSelectedSubreddits,
    fetchArticles,
    handleCreateArticle,
    handleUpdateArticle,
    handleDeleteArticle,
    openEditModal,
    closeModal,
    populateFormFromExternal,
    handleCreateCategory,
    handleDeleteCategory,
    resetForm,
  };
}
