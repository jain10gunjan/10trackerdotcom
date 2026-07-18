'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Loader2,
  Copy,
  Check,
  Save,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScrapeArticleModal({ open, onClose, onUseArticle }) {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapedArticle, setScrapedArticle] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const [scrapeCopied, setScrapeCopied] = useState({});

  const resetScrapeForm = () => {
    setScrapeUrl('');
    setScrapedArticle(null);
    setScrapeError(null);
    setScrapeCopied({});
  };

  const handleClose = () => {
    onClose();
    resetScrapeForm();
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
        headers: { 'Content-Type': 'application/json' },
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

    onUseArticle({
      title: scrapedArticle.data.title,
      content: scrapedArticle.data.finalVersion,
      excerpt: scrapedArticle.data.excerpt || scrapedArticle.data.description || '',
    });

    handleClose();
  };

  const handleScrapeCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setScrapeCopied({ ...scrapeCopied, [key]: true });
    setTimeout(() => {
      setScrapeCopied({ ...scrapeCopied, [key]: false });
    }, 2000);
  };

  if (!open) return null;

  return (
      
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
                  onClick={handleClose}
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
  );
}
