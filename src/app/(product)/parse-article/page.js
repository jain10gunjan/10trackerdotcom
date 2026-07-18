'use client';

import React, { useState } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';

const ParseArticlePage = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleParse = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data');
      return;
    }

    setLoading(true);
    setError(null);
    setHtmlOutput('');

    try {
      // Parse the JSON input
      const jsonData = JSON.parse(jsonInput);

      // Call the API route
      const response = await fetch('/api/parse-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const result = await response.json();

      if (result.success) {
        setHtmlOutput(result.html);
      } else {
        setError(result.error || 'Failed to parse article');
      }
    } catch (err) {
      setError(err.message || 'Invalid JSON format');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = () => {
    const exampleJson = {
      "success": true,
      "article": "**1. SEO Headline:**  \nFederal Bank Office Assistant Recruitment 2026 – Apply Online for Multiple Vacancies\n\n**2. Meta Description:**  \nApply now for the Federal Bank Office Assistant position in 2026. Multiple vacancies across India. Check eligibility, salary, application process, and official links.\n\n**3. Introduction:**  \nThe Federal Bank has announced its recruitment drive for the Office Assistant position in 2026. This opportunity caters to candidates who have completed their 10th standard and possess basic computer skills.\n\n**4. Important Details**  \n\n| Parameter | Details |\n|-----------|----------|\n| Post Name | Office Assistant |\n| Organization | Federal Bank |\n| Total Vacancies | Multiple |\n\n**5. Eligibility & Selection Process:**  \n\n| Criteria | Details |\n|----------|----------|\n| Educational Qualification | Pass in 10th Standard |\n| Age Limit | 18 to 20 years |"
    };
    setJsonInput(JSON.stringify(exampleJson, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Parse Article JSON to HTML
          </h1>
          <p className="text-gray-600">
            Paste your JSON data with article content and convert it to HTML with properly formatted tables
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">JSON Input</h2>
              <button
                onClick={loadExample}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Load Example
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your JSON here, e.g., {"success": true, "article": "markdown content..."}'
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={handleParse}
              disabled={loading}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                'Parse to HTML'
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">HTML Output</h2>
              {htmlOutput && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  {copied ? (
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
              )}
            </div>
            {htmlOutput ? (
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                  {htmlOutput}
                </pre>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-400">
                HTML output will appear here
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {htmlOutput && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
            <div 
              className="border border-gray-300 rounded-lg p-6 bg-white"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ParseArticlePage;
