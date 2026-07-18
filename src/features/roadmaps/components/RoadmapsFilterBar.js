'use client';

import { Filter, Search, X } from 'lucide-react';

export default function RoadmapsFilterBar({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  categories,
  activeCategory,
  onCategoryChange,
  resultCount,
  showMobileFilters,
  onToggleMobileFilters,
}) {
  const hasFilters = activeCategory !== 'All' || Boolean(searchTerm.trim());
  const showCategories = categories.length > 1;

  return (
    <div className="sticky top-20 z-20 bg-white/95 backdrop-blur border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search roadmaps…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleMobileFilters}
              className="sm:hidden inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700"
            >
              <Filter className="w-4 h-4" />
              Sort
            </button>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="hidden sm:block px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              aria-label="Sort roadmaps"
            >
              <option value="featured">Featured</option>
              <option value="days">Longest plans</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {showCategories ? (
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCategoryChange(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    activeCategory === c
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-2 text-xs text-neutral-500">
          {resultCount} roadmap{resultCount === 1 ? '' : 's'}
          {hasFilters ? ' matching filters' : ''}
        </p>

        {showMobileFilters ? (
          <div className="sm:hidden mt-3 pt-3 border-t border-neutral-100">
            <label className="text-xs font-medium text-neutral-500 block mb-1.5">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="days">Longest plans</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
