'use client';

import { useState } from 'react';

export default function TestArticleAPIs() {
  const [headline, setHeadline] = useState('Netflix and Warner Bros acquisition news');
  const [category, setCategory] = useState('news');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(null);

  const testSearchFacts = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setStep('search-facts');

    try {
      const response = await fetch('/api/generate-and-save-article/search-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline })
      });

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Search failed');
        return;
      }

      setResults({
        step: 'search-facts',
        data: data.data,
        meta: data.meta
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCreateArticle = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setStep('create-article');

    // Use provided factual notes or generate some
    const factualNotes = results?.step === 'search-facts' 
      ? results.data.factualNotes 
      : `${headline}: This is a test factual note. The topic is currently being discussed in the news. Official sources have confirmed the information.`;

    try {
      const response = await fetch('/api/generate-and-save-article/create-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          factualNotes,
          expandToWordCount: true
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Article creation failed');
        return;
      }

      setResults({
        step: 'create-article',
        data: data.data,
        meta: data.meta
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testSaveArticle = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setStep('save-article');

    // Use created article or create test data
    const articleData = results?.step === 'create-article'
      ? {
          title: results.data.title,
          description: results.data.description,
          article: results.data.article
        }
      : {
          title: headline,
          description: 'Test article description',
          article: '# Test Article\n\nThis is a test article for testing the save API.'
        };

    try {
      const response = await fetch('/api/generate-and-save-article/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleData,
          category,
          image_url: imageUrl || undefined,
          status: 'published'
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Save failed');
        return;
      }

      setResults({
        step: 'save-article',
        data: data.data,
        meta: data.meta
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCompleteFlow = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setStep('complete-flow');

    try {
      // Step 1: Search Facts
      setStep('search-facts');
      const searchRes = await fetch('/api/generate-and-save-article/search-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline })
      });
      const searchData = await searchRes.json();
      
      if (!searchData.success) {
        setError(`Search failed: ${searchData.error}`);
        return;
      }

      // Step 2: Create Article
      setStep('create-article');
      const createRes = await fetch('/api/generate-and-save-article/create-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          factualNotes: searchData.data.factualNotes,
          expandToWordCount: true
        })
      });
      const createData = await createRes.json();
      
      if (!createData.success) {
        setError(`Article creation failed: ${createData.error}`);
        return;
      }

      // Step 3: Save Article
      setStep('save-article');
      const saveRes = await fetch('/api/generate-and-save-article/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createData.data.title,
          description: createData.data.description,
          article: createData.data.article,
          category,
          image_url: imageUrl || undefined,
          status: 'published'
        })
      });
      const saveData = await saveRes.json();
      
      if (!saveData.success) {
        setError(`Save failed: ${saveData.error}`);
        return;
      }

      setResults({
        step: 'complete-flow',
        searchData: searchData.data,
        createData: createData.data,
        saveData: saveData.data,
        meta: {
          searchMeta: searchData.meta,
          createMeta: createData.meta,
          saveMeta: saveData.meta
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  const getStepLabel = (stepName) => {
    const labels = {
      'search-facts': 'Searching for facts...',
      'create-article': 'Creating article...',
      'save-article': 'Saving article...',
      'complete-flow': 'Running complete flow...'
    };
    return labels[stepName] || stepName;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Article Generation API Tester</h1>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Enter headline"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="e.g., news"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testSearchFacts}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Test Search Facts
            </button>

            <button
              onClick={testCreateArticle}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              Test Create Article
            </button>

            <button
              onClick={testSaveArticle}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              Test Save Article
            </button>

            <button
              onClick={testCompleteFlow}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              Test Complete Flow
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-lg">{step ? getStepLabel(step) : 'Loading...'}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {results.step === 'complete-flow' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">✅ Complete Flow Successful!</h3>
                  
                  <div className="mt-4 space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold">Step 1: Search Facts</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Processing time: {results.meta.searchMeta.processingTimeMs}ms
                      </p>
                      <p className="text-sm mt-2 line-clamp-3">
                        {results.searchData.factualNotes.substring(0, 200)}...
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold">Step 2: Create Article</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Word count: {results.createData.wordCount} words
                      </p>
                      <p className="text-sm text-gray-600">
                        Processing time: {results.meta.createMeta.processingTimeMs}ms
                      </p>
                      <p className="text-sm font-semibold mt-2">{results.createData.title}</p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold">Step 3: Save Article</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Article ID: {results.saveData.id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Slug: {results.saveData.slug}
                      </p>
                      <p className="text-sm text-gray-600">
                        Suggested Subreddit: {results.saveData.suggested_subreddit || 'N/A'}
                      </p>
                      <a
                        href={results.saveData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                      >
                        View Article →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Step: {results.step}</h3>
                  
                  {results.step === 'search-facts' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Processing time: {results.meta.processingTimeMs}ms
                      </p>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">
                          {results.data.factualNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {results.step === 'create-article' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Word count: {results.data.wordCount} words
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Processing time: {results.meta.processingTimeMs}ms
                      </p>
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <p className="font-semibold mb-2">{results.data.title}</p>
                        <p className="text-sm mb-4">{results.data.description}</p>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: results.data.articleHtml }}
                        />
                      </div>
                    </div>
                  )}

                  {results.step === 'save-article' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Article ID: {results.data.id}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Slug: {results.data.slug}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Category: {results.data.category}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Suggested Subreddit: {results.data.suggested_subreddit || 'N/A'}
                      </p>
                      <a
                        href={results.data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View Article →
                      </a>
                    </div>
                  )}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    View Raw JSON
                  </summary>
                  <pre className="mt-2 bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">How to Use</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Enter a headline and category to test</li>
            <li>Click individual test buttons to test each API separately</li>
            <li>Click &quot;Test Complete Flow&quot; to test all 3 APIs in sequence</li>
            <li>Results will show below after each test completes</li>
            <li>Check the browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
