'use client';

import { useState, useEffect } from 'react';
import { Copy, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SARKARI_CATEGORIES } from './adminArticlesConstants';

export default function SarkariLinksPanel() {
  const [sarkariLinks, setSarkariLinks] = useState([]);
  const [sarkariLoading, setSarkariLoading] = useState(false);
  const [sarkariError, setSarkariError] = useState(null);
  const [sarkariPage, setSarkariPage] = useState(1);
  const [sarkariTotalPages, setSarkariTotalPages] = useState(1);
  const [sarkariCategory, setSarkariCategory] = useState('');

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

  useEffect(() => {
    fetchSarkariLinks(sarkariPage, sarkariCategory);
  }, [sarkariPage, sarkariCategory]);

  return (
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
  );
}
