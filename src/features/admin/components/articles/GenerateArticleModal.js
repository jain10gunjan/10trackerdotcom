'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Save,
  X,
} from 'lucide-react';

export default function GenerateArticleModal({ open, onClose, onUseArticle }) {
  const [headline, setHeadline] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [copied, setCopied] = useState({});

  const resetGenerateForm = () => {
    setHeadline('');
    setGeneratedArticle(null);
    setGenerateError(null);
    setCopied({});
  };

  const handleClose = () => {
    onClose();
    resetGenerateForm();
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
        headers: { 'Content-Type': 'application/json' },
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

    onUseArticle({
      title: generatedArticle.data.title,
      content: generatedArticle.data.articleHtml || generatedArticle.data.article,
      excerpt: generatedArticle.data.description,
    });

    handleClose();
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
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
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Generate Article with AI
                  </h2>
                </div>
                <button
                  onClick={() => {
                    handleClose();
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
  );
}
