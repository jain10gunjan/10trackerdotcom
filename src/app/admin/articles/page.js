'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  Tag,
  User,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Globe,
  Briefcase,
  Twitter,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';
import RichTextEditor from '@/components/RichTextEditor';
import { useArticleCategories, clearCategoriesCache } from '@/lib/hooks/useArticleCategories';
import EmbedManager from '@/components/EmbedManager';
import ImageUpload from '@/components/ImageUpload';
import { SUBREDDITS } from '@/lib/subreddits';

const SARKARI_CATEGORIES = [
  { value: '', label: 'All Types' },
  { value: 'results', label: 'Results' },
  { value: 'admit_cards', label: 'Admit Cards' },
  { value: 'latest_jobs', label: 'Latest Jobs' },
  { value: 'answer_key', label: 'Answer Key' },
  { value: 'documents', label: 'Documents' },
  { value: 'admission', label: 'Admission' },
];

const AdminArticlesPage = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use shared hook for categories
  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useArticleCategories({ enabled: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [showTechJobModal, setShowTechJobModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    featured_image_url: '',
    is_featured: false,
    social_media_embeds: [],
    status: 'draft'
  });
  const [selectedSubreddits, setSelectedSubreddits] = useState([]);
  
  // Sarkari result links state
  const [sarkariLinks, setSarkariLinks] = useState([]);
  const [sarkariLoading, setSarkariLoading] = useState(false);
  const [sarkariError, setSarkariError] = useState(null);
  const [sarkariPage, setSarkariPage] = useState(1);
  const [sarkariTotalPages, setSarkariTotalPages] = useState(1);
  const [sarkariCategory, setSarkariCategory] = useState('');
  
  // Article generation state
  const [headline, setHeadline] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [copied, setCopied] = useState({});

  // Article scraping state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapedArticle, setScrapedArticle] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const [scrapeCopied, setScrapeCopied] = useState({});

  // Tech job scraping state
  const [techJobUrl, setTechJobUrl] = useState('');
  const [scrapedTechJob, setScrapedTechJob] = useState(null);
  const [scrapingTechJob, setScrapingTechJob] = useState(false);
  const [techJobError, setTechJobError] = useState(null);
  const [techJobCopied, setTechJobCopied] = useState({});

  // Twitter read state
  const [twitterUsers, setTwitterUsers] = useState([]);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [twitterError, setTwitterError] = useState(null);
  const [twitterUsernamesInput, setTwitterUsernamesInput] = useState('Indianinfoguide');
  const [twitterLimit, setTwitterLimit] = useState(10);

  // Twitter post / scheduling state
  const [tweetForm, setTweetForm] = useState({
    title: '',
    link: '',
    hashtags: '',
    imageUrl: '',
    scheduledAt: ''
  });
  const [tweetPosting, setTweetPosting] = useState(false);
  const [tweetPostError, setTweetPostError] = useState(null);
  const [tweetPostSuccess, setTweetPostSuccess] = useState(null);
  const [scheduledTweets, setScheduledTweets] = useState([]);


  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, []);

  // Fetch Sarkari result links (latest 20 by default)
  useEffect(() => {
    fetchSarkariLinks(sarkariPage, sarkariCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sarkariPage, sarkariCategory]);

  // Optional: preload tweets for default username
  // useEffect(() => {
  //   // Fire once on mount to show latest tweets for default handle
  //   handleFetchTweets();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=50');
      const result = await response.json();
      if (result.success) {
        setArticles(result.data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchSarkariLinks = async (page = 1, category = '') => {
    try {
      setSarkariLoading(true);
      setSarkariError(null);

      const params = new URLSearchParams({
        mode: 'list',
        page: String(page),
        limit: '20',
      });

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/sarkari-result-links?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch Sarkari links');
      }

      setSarkariLinks(result.data || []);
      setSarkariTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching Sarkari links:', error);
      setSarkariError(error.message || 'Failed to fetch Sarkari links');
    } finally {
      setSarkariLoading(false);
    }
  };

  // Fetch tweets from /api/twitter-read
  // const handleFetchTweets = async () => {
  //   const raw = twitterUsernamesInput.trim();
  //   if (!raw) {
  //     setTwitterUsers([]);
  //     return;
  //   }

  //   const usernames = raw
  //     .split(',')
  //     .map((u) => u.trim())
  //     .filter(Boolean);

  //   if (usernames.length === 0) {
  //     setTwitterUsers([]);
  //     return;
  //   }

  //   try {
  //     setTwitterLoading(true);
  //     setTwitterError(null);

  //     const response = await fetch('/api/twitter-read', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         usernames,
  //         limit: twitterLimit
  //       })
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Failed to fetch tweets');
  //     }

  //     if (!data || !Array.isArray(data.users)) {
  //       throw new Error('Unexpected response from twitter-read API');
  //     }

  //     setTwitterUsers(data.users);
  //   } catch (error) {
  //     console.error('Error fetching tweets:', error);
  //     setTwitterError(error.message || 'Failed to fetch tweets');
  //   } finally {
  //     setTwitterLoading(false);
  //   }
  // };

  const handleTweetFormChange = (field, value) => {
    setTweetForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const postTweetNow = async (payload) => {
    try {
      setTweetPosting(true);
      setTweetPostError(null);
      setTweetPostSuccess(null);

      const response = await fetch('/api/twitterpost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to post tweet');
      }

      setTweetPostSuccess('Tweet posted successfully');
      toast.success('Tweet posted successfully');
      return data;
    } catch (error) {
      console.error('Error posting tweet:', error);
      setTweetPostError(error.message || 'Failed to post tweet');
      toast.error(error.message || 'Failed to post tweet');
      throw error;
    } finally {
      setTweetPosting(false);
    }
  };

  const handlePostTweetNow = async () => {
    if (!tweetForm.title.trim()) {
      setTweetPostError('Tweet text (title) is required');
      return;
    }

    const payload = {
      title: tweetForm.title.trim(),
      link: tweetForm.link.trim() || undefined,
      hashtags: tweetForm.hashtags.trim() || undefined,
      imageUrl: tweetForm.imageUrl.trim() || undefined
    };

    await postTweetNow(payload);
  };

  // Very lightweight client-side scheduling only while the admin page is open
  const handleScheduleTweet = () => {
    if (!tweetForm.title.trim()) {
      setTweetPostError('Tweet text (title) is required');
      return;
    }

    if (!tweetForm.scheduledAt) {
      setTweetPostError('Please select a scheduled date & time');
      return;
    }

    const scheduledTime = new Date(tweetForm.scheduledAt);
    if (Number.isNaN(scheduledTime.getTime())) {
      setTweetPostError('Invalid scheduled date & time');
      return;
    }

    const now = new Date();
    if (scheduledTime <= now) {
      setTweetPostError('Scheduled time must be in the future');
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      title: tweetForm.title.trim(),
      link: tweetForm.link.trim() || undefined,
      hashtags: tweetForm.hashtags.trim() || undefined,
      imageUrl: tweetForm.imageUrl.trim() || undefined
    };

    // Schedule with setTimeout – works only while this page is open
    const delay = scheduledTime.getTime() - now.getTime();
    const timeoutId = setTimeout(async () => {
      try {
        await postTweetNow(payload);
        setScheduledTweets((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'sent', sentAt: new Date().toISOString() } : item
          )
        );
      } catch (e) {
        setScheduledTweets((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'failed', error: e.message } : item
          )
        );
      }
    }, delay);

    setScheduledTweets((prev) => [
      ...prev,
      {
        id,
        payload,
        scheduledAt: scheduledTime.toISOString(),
        status: 'scheduled',
        timeoutId
      }
    ]);

    toast.success('Tweet scheduled (browser must stay open)');
  };

  const cancelScheduledTweet = (id) => {
    setScheduledTweets((prev) => {
      const found = prev.find((t) => t.id === id);
      if (found && found.timeoutId) {
        clearTimeout(found.timeoutId);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    // Temporarily removed admin check for testing
    // if (!isAdmin) {
    //   toast.error('Admin access required');
    //   return;
    // }

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          social_media_embeds: formData.social_media_embeds || [],
          selectedSubreddits: selectedSubreddits
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Article created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchArticles();
      } else {
        toast.error(result.error || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to create article');
    }
  };

  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    // Temporarily removed admin check for testing
    // if (!isAdmin) {
    //   toast.error('Admin access required');
    //   return;
    // }

    try {
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          social_media_embeds: formData.social_media_embeds || [],
          selectedSubreddits: selectedSubreddits
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Article updated successfully');
        setEditingArticle(null);
        resetForm();
        fetchArticles();
      } else {
        toast.error(result.error || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    }
  };

  const handleDeleteArticle = async (id) => {
    // Temporarily removed admin check for testing
    // if (!isAdmin) {
    //   toast.error('Admin access required');
    //   return;
    // }

    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Article deleted successfully');
        fetchArticles();
      } else {
        toast.error(result.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      featured_image_url: '',
      is_featured: false,
      social_media_embeds: [],
      status: 'draft'
    });
    setSelectedSubreddits([]);
  };

  const resetGenerateForm = () => {
    setHeadline('');
    setGeneratedArticle(null);
    setGenerateError(null);
    setCopied({});
  };

  const resetScrapeForm = () => {
    setScrapeUrl('');
    setScrapedArticle(null);
    setScrapeError(null);
    setScrapeCopied({});
  };

  const resetTechJobForm = () => {
    setTechJobUrl('');
    setScrapedTechJob(null);
    setTechJobError(null);
    setTechJobCopied({});
  };

  const handleGenerateArticle = async () => {
    if (!headline.trim()) {
      setGenerateError('Please enter a headline');
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setGeneratedArticle(null);

    try {
      const response = await fetch('/api/generate-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ headline }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      if (data.success) {
        setGeneratedArticle(data);
      } else {
        throw new Error(data.error || 'Failed to generate article');
      }
    } catch (err) {
      setGenerateError(err.message || 'An error occurred while generating the article');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseGeneratedArticle = () => {
    if (!generatedArticle?.data) return;

    // Populate form with generated content
    setFormData({
      title: generatedArticle.data.title,
      content: generatedArticle.data.articleHtml || generatedArticle.data.article,
      excerpt: generatedArticle.data.description,
      category: formData.category || '',
      tags: formData.tags || '',
      featured_image_url: formData.featured_image_url || '',
      is_featured: formData.is_featured || false,
      social_media_embeds: formData.social_media_embeds || []
    });

    // Close generate modal and open create modal
    setShowGenerateModal(false);
    setShowCreateModal(true);
    resetGenerateForm();
  };

  const handleScrapeArticle = async () => {
    if (!scrapeUrl.trim()) {
      setScrapeError('Please enter a URL');
      return;
    }

    setScraping(true);
    setScrapeError(null);
    setScrapedArticle(null);

    try {
      const response = await fetch('/api/scrape-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape article');
      }

      if (data.success) {
        setScrapedArticle(data);
        toast.success('Article scraped successfully');
      } else {
        throw new Error(data.error || 'Failed to scrape article');
      }
    } catch (err) {
      setScrapeError(err.message || 'An error occurred while scraping the article');
      toast.error(err.message || 'Failed to scrape article');
    } finally {
      setScraping(false);
    }
  };

  const handleUseScrapedArticle = () => {
    if (!scrapedArticle?.data) return;

    // Populate form with scraped content
    setFormData({
      title: scrapedArticle.data.title,
      content: scrapedArticle.data.finalVersion,
      excerpt: scrapedArticle.data.excerpt || scrapedArticle.data.description || '',
      category: formData.category || '',
      tags: formData.tags || '',
      featured_image_url: formData.featured_image_url || '',
      is_featured: formData.is_featured || false,
      social_media_embeds: formData.social_media_embeds || []
    });

    // Close scrape modal and open create modal
    setShowScrapeModal(false);
    setShowCreateModal(true);
    resetScrapeForm();
  };

  const handleScrapeCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setScrapeCopied({ ...scrapeCopied, [key]: true });
    setTimeout(() => {
      setScrapeCopied({ ...scrapeCopied, [key]: false });
    }, 2000);
  };

  const handleTechJobScrape = async () => {
    if (!techJobUrl.trim()) {
      setTechJobError('Please enter a job URL');
      return;
    }

    setScrapingTechJob(true);
    setTechJobError(null);
    setScrapedTechJob(null);

    try {
      const response = await fetch('/api/scrape-tech-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: techJobUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape tech job');
      }

      if (data.success) {
        setScrapedTechJob(data);
        toast.success('Tech job scraped successfully');
      } else {
        throw new Error(data.error || 'Failed to scrape tech job');
      }
    } catch (err) {
      setTechJobError(err.message || 'An error occurred while scraping the tech job');
      toast.error(err.message || 'Failed to scrape tech job');
    } finally {
      setScrapingTechJob(false);
    }
  };

  const handleUseScrapedTechJob = () => {
    if (!scrapedTechJob?.data) return;

    // Populate form with scraped content
    setFormData({
      title: scrapedTechJob.data.title,
      content: scrapedTechJob.data.finalVersion,
      excerpt: scrapedTechJob.data.excerpt || scrapedTechJob.data.description || '',
      category: formData.category || '',
      tags: formData.tags || '',
      featured_image_url: scrapedTechJob.data.companyImage || formData.featured_image_url || '',
      is_featured: formData.is_featured || false,
      social_media_embeds: formData.social_media_embeds || []
    });

    // Close tech job modal and open create modal
    setShowTechJobModal(false);
    setShowCreateModal(true);
    resetTechJobForm();
  };

  const handleTechJobCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setTechJobCopied({ ...techJobCopied, [key]: true });
    setTimeout(() => {
      setTechJobCopied({ ...techJobCopied, [key]: false });
    }, 2000);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    
    // Handle social_media_embeds - ensure it's always an array
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
    
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      category: article.category,
      tags: article.tags?.join(', ') || '',
      featured_image_url: article.featured_image_url || '',
      is_featured: article.is_featured || false,
      social_media_embeds: embeds,
      status: article.status || 'draft'
    });
    setSelectedSubreddits([]);
    
    console.log('📝 Loading article for edit:', {
      id: article.id,
      title: article.title,
      embeds: embeds,
      embedsCount: embeds.length
    });
    
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingArticle(null);
    resetForm();
  };

  const closeGenerateModal = () => {
    setShowGenerateModal(false);
    resetGenerateForm();
  };

  const closeScrapeModal = () => {
    setShowScrapeModal(false);
    resetScrapeForm();
  };

  const closeTechJobModal = () => {
    setShowTechJobModal(false);
    resetTechJobForm();
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  if (loading) {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Article Management</h1>
          <p className="text-neutral-600">Manage your articles and content</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories && Array.isArray(categories) && categories.length > 0 ? (
                  categories.map(category => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))
                ) : !categoriesLoading ? (
                  <option value="" disabled>No categories</option>
                ) : null}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate Article
              </button>
              <button
                onClick={() => setShowScrapeModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Globe className="w-4 h-4" />
                Scrape Article
              </button>
              <button
                onClick={() => setShowTechJobModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Briefcase className="w-4 h-4" />
                Add Tech Job
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Article
              </button>
            </div>
          </div>
        </div>

        {/* Category Management */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Manage Categories</h2>
          </div>

          {/* Add Category */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = form.name.value.trim();
              const slug = form.slug.value.trim();
              const color = form.color.value.trim() || '#3B82F6';
              if (!name) return;
              try {
                const res = await fetch('/api/articles/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, slug, color })
                });
                const result = await res.json();
                if (result.success) {
                  clearCategoriesCache();
                  await refetchCategories();
                  form.reset();
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6"
          >
            <input name="name" placeholder="Category name" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 md:col-span-2" />
            <input name="slug" placeholder="slug (optional)" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800" />
            <input name="color" placeholder="#3B82F6" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800" />
            <button type="submit" className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700">Add</button>
          </form>

          {/* List Categories */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {categories && Array.isArray(categories) && categories.map((cat) => (
                  <tr key={cat.slug}>
                    <td className="px-4 py-2 text-sm text-neutral-800">{cat.name}</td>
                    <td className="px-4 py-2 text-sm text-neutral-500">{cat.slug}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                        <span className="text-neutral-600">{cat.color}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete category "${cat.name}"?`)) return;
                          try {
                            const res = await fetch(`/api/articles/categories?slug=${encodeURIComponent(cat.slug)}`, { method: 'DELETE' });
                            const result = await res.json();
                            if (result.success) {
                              clearCategoriesCache();
                            await refetchCategories();
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="px-3 py-1 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Twitter – Read & Post */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left: Read tweets */}
            {/* <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Twitter className="w-5 h-5 text-sky-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Twitter – Latest Tweets</h2>
                    <p className="text-xs text-neutral-500">
                      Fetch tweets for handles and quickly copy text / media URLs. New tweets are highlighted.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFetchTweets}
                  disabled={twitterLoading}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs hover:bg-neutral-700 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {twitterLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Refresh
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3 h-3" />
                      Refresh
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Twitter usernames (comma separated)
                  </label>
                  <input
                    type="text"
                    value={twitterUsernamesInput}
                    onChange={(e) => setTwitterUsernamesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Indianinfoguide, anotherhandle"
                  />
                </div>
                <div className="w-full md:w-28">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Tweets / user
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={twitterLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (Number.isNaN(val)) {
                        setTwitterLimit(10);
                      } else {
                        setTwitterLimit(Math.min(Math.max(val, 1), 100));
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                  />
                </div>
              </div>

              {twitterError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {twitterError}
                </div>
              )}

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {twitterLoading && twitterUsers.length === 0 && (
                  <div className="py-8 text-center text-neutral-500 text-sm flex flex-col items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading tweets...</span>
                  </div>
                )}

                {!twitterLoading && twitterUsers.length === 0 && (
                  <div className="py-8 text-center text-neutral-400 text-sm">
                    No tweets loaded yet. Click &quot;Refresh&quot; to fetch tweets.
                  </div>
                )}

                {twitterUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="border border-neutral-200 rounded-lg p-3 bg-neutral-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {user.profileImageUrl && (
                          <img
                            src={user.profileImageUrl}
                            alt={user.username || ''}
                            className="w-8 h-8 rounded-full border border-neutral-200"
                          />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                            {user.name || user.username || 'Unknown'}
                            {user.newTweetCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                {user.newTweetCount} new
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500">
                            @{user.username} • {user.tweetCount} tweets
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      {user.tweets.map((tweet) => {
                        const hasMedia = Array.isArray(tweet.media) && tweet.media.length > 0;
                        const imageMedia = (tweet.media || []).filter(
                          (m) => m.type === 'photo' && m.url
                        );
                        const videoMedia = (tweet.media || []).filter(
                          (m) => m.type === 'video' && m.url
                        );

                        return (
                          <div
                            key={tweet.id}
                            className="bg-white border border-neutral-200 rounded-md p-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-neutral-800 whitespace-pre-wrap flex-1">
                                {tweet.text}
                              </p>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                    tweet.isNew
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}
                                >
                                  {tweet.isNew ? 'New' : 'Seen'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tweet.text || '');
                                    toast.success('Tweet text copied');
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-800"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy text
                                </button>
                              </div>
                            </div>

                            {hasMedia && (
                              <div className="mt-2 space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  {imageMedia.length > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      {imageMedia.length} image
                                      {imageMedia.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {videoMedia.length > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 font-medium flex items-center gap-1">
                                      {/* Simple video badge without custom icon */}
                                      {/* <span className="inline-block w-2 h-2 rounded-full bg-purple-500" /> */}
                                      {/* {videoMedia.length} video */}
                                      {/* {videoMedia.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {imageMedia.map((m, idx) => (
                                    <button
                                      key={`${m.url}-${idx}`}
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(m.url);
                                        toast.success('Image URL copied');
                                      }}
                                      title={m.url}
                                      className="group border border-neutral-200 rounded-md overflow-hidden bg-neutral-100 hover:border-neutral-400"
                                    >
                                      <img
                                        src={m.url}
                                        alt="Tweet media"
                                        className="w-16 h-16 object-cover block"
                                      />
                                    </button>
                                  ))}
                                  {videoMedia.map((m, idx) => (
                                    <button
                                      key={`${m.url}-${idx}`}
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(m.url);
                                        toast.success('Video thumbnail URL copied');
                                      }}
                                      title={m.url}
                                      className="group border border-purple-200 rounded-md px-2 py-1 text-[10px] text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center gap-1"
                                    >
                                      <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                                      Copy video thumb
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            // </div> */}

            {/* Right: Compose / schedule tweet */}
            <div className="w-full lg:w-80 border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <div className="flex items-center gap-2 mb-3">
                <Twitter className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Compose / Schedule Tweet
                </h3>
              </div>

              {tweetPostError && (
                <div className="mb-2 p-2 rounded-md bg-red-50 border border-red-200 text-[11px] text-red-700">
                  {tweetPostError}
                </div>
              )}
              {tweetPostSuccess && (
                <div className="mb-2 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
                  {tweetPostSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Tweet text (title) *
                  </label>
                  <textarea
                    rows={3}
                    value={tweetForm.title}
                    onChange={(e) => handleTweetFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 resize-none"
                    placeholder="Write tweet text here..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Link (optional)
                  </label>
                  <input
                    type="url"
                    value={tweetForm.link}
                    onChange={(e) => handleTweetFormChange('link', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="https://10tracker.com/articles/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Hashtags (space separated, optional)
                  </label>
                  <input
                    type="text"
                    value={tweetForm.hashtags}
                    onChange={(e) => handleTweetFormChange('hashtags', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="#India #News #Infra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={tweetForm.imageUrl}
                    onChange={(e) => handleTweetFormChange('imageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Paste media URL from tweets above"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Schedule (optional, browser must stay open)
                  </label>
                  <input
                    type="datetime-local"
                    value={tweetForm.scheduledAt}
                    onChange={(e) => handleTweetFormChange('scheduledAt', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                  />
                  <p className="mt-1 text-[10px] text-neutral-500">
                    Scheduling runs only while this admin page is open. For guaranteed scheduling,
                    move this logic to a server/cron later.
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handlePostTweetNow}
                    disabled={tweetPosting || !tweetForm.title.trim()}
                    className="w-full px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {tweetPosting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Twitter className="w-3 h-3" />
                        Post now
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleTweet}
                    disabled={tweetPosting || !tweetForm.title.trim() || !tweetForm.scheduledAt}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3 h-3" />
                    Schedule
                  </button>
                </div>

                {scheduledTweets.length > 0 && (
                  <div className="mt-3 border-t border-neutral-200 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-neutral-700">
                        Scheduled tweets ({scheduledTweets.length})
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {scheduledTweets.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 text-[10px] py-1"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-neutral-800">
                              {item.payload.title}
                            </div>
                            <div className="text-neutral-500">
                              {new Date(item.scheduledAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                                item.status === 'scheduled'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : item.status === 'sent'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {item.status}
                            </span>
                            {item.status === 'scheduled' && (
                              <button
                                type="button"
                                onClick={() => cancelScheduledTweet(item.id)}
                                className="text-[10px] text-neutral-500 hover:text-neutral-900"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sarkari Result New Links */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Sarkari Result – New Links
              </h2>
              <p className="text-sm text-neutral-600">
                See the latest scraped links from Sarkari Result. Copy title/URL and open the source quickly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={sarkariCategory}
                onChange={(e) => {
                  setSarkariPage(1);
                  setSarkariCategory(e.target.value);
                }}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-sm"
              >
                {SARKARI_CATEGORIES.map((cat) => (
                  <option key={cat.value || 'all'} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fetchSarkariLinks(sarkariPage, sarkariCategory)}
                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 text-sm flex items-center gap-2"
              >
                {sarkariLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>

          {sarkariError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {sarkariError}
            </div>
          )}

          <div className="overflow-x-auto -mx-3 md:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sarkariLoading && sarkariLinks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading latest Sarkari links...
                      </div>
                    </td>
                  </tr>
                ) : sarkariLinks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                      No links found. Try refreshing or running the Sarkari scraper.
                    </td>
                  </tr>
                ) : (
                  sarkariLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800">
                          {SARKARI_CATEGORIES.find((c) => c.value === link.category)?.label || link.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-sm font-medium text-neutral-900 line-clamp-2">
                          {link.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(link.url);
                            toast.success('URL copied');
                          }}
                          className="group flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 break-all text-left"
                          title={link.url}
                        >
                          <span className="truncate max-w-[180px] md:max-w-[260px] group-hover:underline">
                            {link.url}
                          </span>
                          <Copy className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(link.url, '_blank')}
                            className="p-2 text-neutral-400 hover:text-neutral-700"
                            title="Open source link"
                          >
                            <Globe className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(link.title);
                              toast.success('Title copied');
                            }}
                            className="p-2 text-neutral-400 hover:text-neutral-700"
                            title="Copy title"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3 text-xs md:text-sm flex-wrap">
            <p className="text-neutral-500">
              Showing page {sarkariPage} of {sarkariTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={sarkariPage <= 1 || sarkariLoading}
                onClick={() => setSarkariPage((p) => Math.max(p - 1, 1))}
                className={`px-3 py-1.5 rounded-lg border text-xs md:text-sm ${
                  sarkariPage <= 1 || sarkariLoading
                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={sarkariPage >= sarkariTotalPages || sarkariLoading}
                onClick={() =>
                  setSarkariPage((p) =>
                    sarkariTotalPages ? Math.min(p + 1, sarkariTotalPages) : p + 1
                  )
                }
                className={`px-3 py-1.5 rounded-lg border text-xs md:text-sm ${
                  sarkariPage >= sarkariTotalPages || sarkariLoading
                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

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
                {filteredArticles.map((article) => (
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
                            {article.excerpt || article.content.substring(0, 100)}...
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
                        {article.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-neutral-500">
                      {article.view_count || 0}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-neutral-500">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                          className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                          title="View Article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
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
            {filteredArticles.map((article) => (
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
                      {article.excerpt || article.content.substring(0, 100)}...
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
                        {article.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count || 0} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                        className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(article)}
                        className="flex-1 px-3 py-2 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
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

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No articles found</h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filters'
                : 'Create your first article to get started'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              >
                Create Article
              </button>
            )}
          </div>
        )}
      </div>

      {/* Generate Article Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Generate Article with AI
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    resetGenerateForm();
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Enter Headline
                    </label>
                    <textarea
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Enter a news headline, e.g., 'India's GDP Growth Rate Reaches 7.8% in Q3 2024'"
                      className="w-full h-32 p-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleGenerateArticle}
                    disabled={generating || !headline.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Article...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Article
                      </>
                    )}
                  </button>
                  {generateError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {generateError}
                    </div>
                  )}
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Generated Article</h3>
                  {generatedArticle ? (
                    <div className="space-y-4">
                      {/* Meta Information */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-900">Article Stats</span>
                          <span className="text-xs text-blue-700">
                            {generatedArticle.meta?.wordCount || 0} words
                          </span>
                        </div>
                        <div className="text-xs text-blue-700">
                          Expansions: {generatedArticle.meta?.expansionsUsed || 0} | 
                          Cost: {generatedArticle.cost?.realistic_range_inr || 'N/A'}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-neutral-700">Title</label>
                          <button
                            onClick={() => handleCopy(generatedArticle.data.title, 'title')}
                            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            {copied.title ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-semibold">
                          {generatedArticle.data.title}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-neutral-700">Description</label>
                          <button
                            onClick={() => handleCopy(generatedArticle.data.description, 'description')}
                            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            {copied.description ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 text-sm">
                          {generatedArticle.data.description}
                        </div>
                      </div>

                      {/* Use Article Button */}
                      <button
                        onClick={handleUseGeneratedArticle}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Use This Article
                      </button>
                    </div>
                  ) : (
                    <div className="border border-neutral-300 rounded-lg p-8 text-center text-neutral-400">
                      Generated article will appear here
                    </div>
                  )}
                </div>
              </div>

              {/* Article Preview */}
              {generatedArticle && (
                <div className="mt-6 border-t border-neutral-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Article Preview</h3>
                    <button
                      onClick={() => handleCopy(generatedArticle.data.articleHtml || generatedArticle.data.article, 'articleHtml')}
                      className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                    >
                      {copied.articleHtml ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied HTML!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy HTML
                        </>
                      )}
                    </button>
                  </div>
                  <div className="border border-neutral-300 rounded-lg p-6 bg-white">
                    <style dangerouslySetInnerHTML={{__html: `
                      .article-body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.8;
                        color: #1f2937;
                      }
                      .article-body p {
                        margin-bottom: 1.5rem;
                        color: #374151;
                        font-size: 1rem;
                        line-height: 1.8;
                      }
                      .article-body p:last-child {
                        margin-bottom: 0;
                      }
                      .article-body h1, .article-body h2, .article-body h3 {
                        font-weight: 700;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        color: #111827;
                      }
                      .article-body h1 {
                        font-size: 2rem;
                      }
                      .article-body h2 {
                        font-size: 1.75rem;
                      }
                      .article-body h3 {
                        font-size: 1.5rem;
                      }
                      .article-body ul, .article-body ol {
                        margin: 1.5rem 0;
                        padding-left: 1.75rem;
                      }
                      .article-body li {
                        margin-bottom: 0.75rem;
                        color: #374151;
                        line-height: 1.7;
                      }
                      .article-body strong {
                        font-weight: 700;
                        color: #111827;
                      }
                    `}} />
                    <div className="prose prose-lg max-w-none">
                      <h1 className="text-3xl font-bold mb-4 text-neutral-900">{generatedArticle.data.title}</h1>
                      <p className="text-lg text-neutral-600 mb-6 italic">{generatedArticle.data.description}</p>
                      <div 
                        className="article-content"
                        dangerouslySetInnerHTML={{ __html: generatedArticle.data.articleHtml || generatedArticle.data.article }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Scrape Article Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Scrape Article from URL
                  </h2>
                </div>
                <button
                  onClick={closeScrapeModal}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Enter Article URL
                    </label>
                    <input
                      type="url"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://sarkariresult.com.cm/bpsc-project-manager-recruitment-2026/"
                      className="w-full p-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <button
                    onClick={handleScrapeArticle}
                    disabled={scraping || !scrapeUrl.trim()}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    {scraping ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scraping Article...
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5" />
                        Scrape Article
                      </>
                    )}
                  </button>
                  {scrapeError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {scrapeError}
                    </div>
                  )}
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Scraped Article</h3>
                  {scrapedArticle ? (
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-neutral-700">Title</label>
                          <button
                            onClick={() => handleScrapeCopy(scrapedArticle.data.title, 'title')}
                            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            {scrapeCopied.title ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-semibold">
                          {scrapedArticle.data.title}
                        </div>
                      </div>

                      {/* Excerpt */}
                      {scrapedArticle.data.excerpt && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-neutral-700">Excerpt</label>
                            <button
                              onClick={() => handleScrapeCopy(scrapedArticle.data.excerpt, 'excerpt')}
                              className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                            >
                              {scrapeCopied.excerpt ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 text-sm">
                            {scrapedArticle.data.excerpt}
                          </div>
                        </div>
                      )}

                      {/* Use Article Button */}
                      <button
                        onClick={handleUseScrapedArticle}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Use This Article
                      </button>
                    </div>
                  ) : (
                    <div className="border border-neutral-300 rounded-lg p-8 text-center text-neutral-400">
                      Scraped article will appear here
                    </div>
                  )}
                </div>
              </div>

              {/* Article Preview */}
              {scrapedArticle && (
                <div className="mt-6 border-t border-neutral-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Article Preview</h3>
                    <button
                      onClick={() => handleScrapeCopy(scrapedArticle.data.finalVersion, 'content')}
                      className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                    >
                      {scrapeCopied.content ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied HTML!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy HTML
                        </>
                      )}
                    </button>
                  </div>
                  <div className="border border-neutral-300 rounded-lg p-6 bg-white">
                    <style dangerouslySetInnerHTML={{__html: `
                      .article-content {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.8;
                        color: #1f2937;
                      }
                      .article-content p {
                        margin-bottom: 1.5rem;
                        color: #374151;
                        font-size: 1rem;
                        line-height: 1.8;
                      }
                      .article-content p:last-child {
                        margin-bottom: 0;
                      }
                      .article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6 {
                        font-weight: 700;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        color: #111827;
                      }
                      .article-content h1 {
                        font-size: 2rem;
                      }
                      .article-content h2 {
                        font-size: 1.75rem;
                      }
                      .article-content h3 {
                        font-size: 1.5rem;
                      }
                      .article-content h4 {
                        font-size: 1.25rem;
                      }
                      .article-content h5 {
                        font-size: 1.125rem;
                      }
                      .article-content h6 {
                        font-size: 1rem;
                      }
                      .article-content ul, .article-content ol {
                        margin: 1.5rem 0;
                        padding-left: 1.75rem;
                      }
                      .article-content li {
                        margin-bottom: 0.75rem;
                        color: #374151;
                        line-height: 1.7;
                      }
                      .article-content strong {
                        font-weight: 700;
                        color: #111827;
                      }
                      .article-content table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1.5rem 0;
                      }
                      .article-content table th,
                      .article-content table td {
                        border: 1px solid #d1d5db;
                        padding: 0.75rem;
                        text-align: left;
                      }
                      .article-content table th {
                        background-color: #f3f4f6;
                        font-weight: 600;
                      }
                      .article-content span {
                        display: inline;
                      }
                      .article-content div {
                        margin-bottom: 1rem;
                      }
                    `}} />
                    <div className="prose prose-lg max-w-none prose-neutral prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-a:text-blue-600 prose-strong:text-neutral-900">
                      <h1 className="text-3xl font-bold mb-4 text-neutral-900">{scrapedArticle.data.title}</h1>
                      {scrapedArticle.data.excerpt && (
                        <p className="text-lg text-neutral-600 mb-6 italic">{scrapedArticle.data.excerpt}</p>
                      )}
                      <div 
                        className="prose prose-lg max-w-none prose-neutral prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-a:text-blue-600 prose-strong:text-neutral-900"
                        dangerouslySetInnerHTML={{ __html: scrapedArticle.data.finalVersion }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Scrape Tech Job Modal */}
      {showTechJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Scrape Tech Job from URL
                  </h2>
                </div>
                <button
                  onClick={closeTechJobModal}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Enter Job URL
                    </label>
                    <input
                      type="url"
                      value={techJobUrl}
                      onChange={(e) => setTechJobUrl(e.target.value)}
                      placeholder="https://www.jobfound.org/job/..."
                      className="w-full p-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleTechJobScrape}
                    disabled={scrapingTechJob || !techJobUrl.trim()}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    {scrapingTechJob ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scraping Tech Job...
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-5 h-5" />
                        Scrape Tech Job
                      </>
                    )}
                  </button>
                  {techJobError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {techJobError}
                    </div>
                  )}
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Scraped Tech Job</h3>
                  {scrapedTechJob ? (
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-neutral-700">Title</label>
                          <button
                            onClick={() => handleTechJobCopy(scrapedTechJob.data.title, 'title')}
                            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            {techJobCopied.title ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-semibold">
                          {scrapedTechJob.data.title}
                        </div>
                      </div>

                      {/* Excerpt */}
                      {scrapedTechJob.data.excerpt && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-neutral-700">Excerpt</label>
                            <button
                              onClick={() => handleTechJobCopy(scrapedTechJob.data.excerpt, 'excerpt')}
                              className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                            >
                              {techJobCopied.excerpt ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 text-sm">
                            {scrapedTechJob.data.excerpt}
                          </div>
                        </div>
                      )}

                      {/* Use Article Button */}
                      <button
                        onClick={handleUseScrapedTechJob}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Use This Job
                      </button>
                    </div>
                  ) : (
                    <div className="border border-neutral-300 rounded-lg p-8 text-center text-neutral-400">
                      Scraped tech job will appear here
                    </div>
                  )}
                </div>
              </div>

              {/* Job Preview */}
              {scrapedTechJob && (
                <div className="mt-6 border-t border-neutral-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Job Preview</h3>
                    <button
                      onClick={() => handleTechJobCopy(scrapedTechJob.data.finalVersion, 'content')}
                      className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                    >
                      {techJobCopied.content ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied HTML!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy HTML
                        </>
                      )}
                    </button>
                  </div>
                  <div className="border border-neutral-300 rounded-lg p-6 bg-white">
                    <div 
                      className="prose prose-lg max-w-none prose-neutral prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-a:text-blue-600 prose-strong:text-neutral-900"
                      dangerouslySetInnerHTML={{ __html: scrapedTechJob.data.finalVersion }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
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
                  onClick={closeModal}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle} className="flex-1 flex flex-col overflow-hidden">
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
                  onClick={closeModal}
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
      )}
    </div>
  );
};

export default AdminArticlesPage;
