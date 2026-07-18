'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Loader2,
  Copy,
  Check,
  Save,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScrapeTechJobModal({ open, onClose, onUseArticle }) {
  const [techJobUrl, setTechJobUrl] = useState('');
  const [scrapedTechJob, setScrapedTechJob] = useState(null);
  const [scrapingTechJob, setScrapingTechJob] = useState(false);
  const [techJobError, setTechJobError] = useState(null);
  const [techJobCopied, setTechJobCopied] = useState({});

  const resetTechJobForm = () => {
    setTechJobUrl('');
    setScrapedTechJob(null);
    setTechJobError(null);
    setTechJobCopied({});
  };

  const handleClose = () => {
    onClose();
    resetTechJobForm();
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
        headers: { 'Content-Type': 'application/json' },
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

    onUseArticle({
      title: scrapedTechJob.data.title,
      content: scrapedTechJob.data.finalVersion,
      excerpt: scrapedTechJob.data.excerpt || scrapedTechJob.data.description || '',
      ...(scrapedTechJob.data.companyImage
        ? { featured_image_url: scrapedTechJob.data.companyImage }
        : {}),
    });

    handleClose();
  };

  const handleTechJobCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setTechJobCopied({ ...techJobCopied, [key]: true });
    setTimeout(() => {
      setTechJobCopied({ ...techJobCopied, [key]: false });
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
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Scrape Tech Job from URL
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
  );
}
