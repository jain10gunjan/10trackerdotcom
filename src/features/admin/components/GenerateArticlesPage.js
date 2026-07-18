'use client';

import React, { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, FileText } from 'lucide-react';

const GenerateArticlesPage = () => {
  const [headline, setHeadline] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({});

  const handleGenerate = async () => {
    if (!headline.trim()) {
      setError('Please enter a headline');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

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
        setResult(data);
      } else {
        throw new Error(data.error || 'Failed to generate article');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the article');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const loadExample = () => {
    setHeadline("India's GDP Growth Rate Reaches 7.8% in Q3 2024");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              AI Article Generator
            </h1>
          </div>
          <p className="text-gray-600">
            Enter a headline and generate a comprehensive, SEO-optimized news article with factual content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Enter Headline
              </h2>
              <button
                onClick={loadExample}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Load Example
              </button>
            </div>
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Enter a news headline, e.g., 'India's GDP Growth Rate Reaches 7.8% in Q3 2024'"
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !headline.trim()}
              className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
            >
              {loading ? (
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
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Article
            </h2>
            {result ? (
              <div className="space-y-4">
                {/* Meta Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900">Article Stats</span>
                    <span className="text-xs text-blue-700">
                      {result.meta?.wordCount || 0} words
                    </span>
                  </div>
                  <div className="text-xs text-blue-700">
                    Expansions: {result.meta?.expansionsUsed || 0} | 
                    Cost: {result.cost?.realistic_range_inr || 'N/A'}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Title</label>
                    <button
                      onClick={() => handleCopy(result.data.title, 'title')}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
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
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold">
                    {result.data.title}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <button
                      onClick={() => handleCopy(result.data.description, 'description')}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
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
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {result.data.description}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-400">
                Generated article will appear here
              </div>
            )}
          </div>
        </div>

        {/* Article Preview Section */}
        {result && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Article Preview (HTML)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(result.data.articleHtml || result.data.article, 'articleHtml')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
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
                <button
                  onClick={() => handleCopy(result.data.article, 'article')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  {copied.article ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Text!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg p-6 bg-white">
              <style dangerouslySetInnerHTML={{__html: `
                .article-body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  line-height: 1.8;
                  color: #1f2937;
                }
                .article-body .article-section {
                  margin-bottom: 2.5rem;
                }
                .article-body .section-heading {
                  font-size: 1.75rem;
                  font-weight: 800;
                  color: #111827;
                  margin-top: 2.5rem;
                  margin-bottom: 1.5rem;
                  padding-bottom: 0.75rem;
                  border-bottom: 3px solid #e5e7eb;
                  letter-spacing: -0.02em;
                }
                .article-body .section-heading:first-child {
                  margin-top: 0;
                }
                .article-body h1.section-heading {
                  font-size: 2rem;
                  font-weight: 900;
                }
                .article-body h2.section-heading {
                  font-size: 1.75rem;
                  font-weight: 800;
                }
                .article-body h3.section-heading {
                  font-size: 1.5rem;
                  font-weight: 700;
                }
                .article-body .article-paragraph {
                  margin-bottom: 1.5rem;
                  color: #374151;
                  font-size: 1rem;
                  line-height: 1.8;
                }
                .article-body .article-paragraph:last-child {
                  margin-bottom: 0;
                }
                .article-body .article-list {
                  margin: 1.5rem 0;
                  margin-left: 0;
                  padding-left: 1.75rem;
                  list-style-type: disc;
                  list-style-position: outside;
                }
                .article-body .article-list-item {
                  margin-bottom: 0.75rem;
                  color: #374151;
                  line-height: 1.7;
                  padding-left: 0.5rem;
                }
                .article-body .article-list-item:last-child {
                  margin-bottom: 0;
                }
                .article-body strong {
                  font-weight: 700;
                  color: #111827;
                }
              `}} />
              <div className="prose prose-lg max-w-none">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">{result.data.title}</h1>
                <p className="text-lg text-gray-600 mb-6 italic">{result.data.description}</p>
                {result.data.articleHtml ? (
                  <div 
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: result.data.articleHtml }}
                  />
                ) : (
                  <div 
                    className="article-content text-gray-800 whitespace-pre-line"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      lineHeight: '1.7'
                    }}
                  >
                    {result.data.article}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HTML Code Section */}
        {result && result.data.articleHtml && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <details className="cursor-pointer">
              <summary className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span>View HTML Code</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopy(result.data.articleHtml, 'htmlCode');
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copied.htmlCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy HTML
                    </>
                  )}
                </button>
              </summary>
              <div className="mt-4">
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-96 text-xs font-mono">
                  {result.data.articleHtml}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* JSON Output Section (Collapsible) */}
        {result && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <details className="cursor-pointer">
              <summary className="text-lg font-semibold text-gray-900 mb-4">
                View JSON Response
              </summary>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Full API Response</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(result, null, 2), 'json')}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
                  >
                    {copied.json ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-96 text-xs font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateArticlesPage;

