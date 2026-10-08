'use client';

import { Search, Filter, ArrowUpDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All tests' },
  { value: 'new', label: 'Not attempted' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In progress' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'duration', label: 'Duration' },
  { value: 'questions', label: 'Most questions' },
];

export default function TestListToolbar({
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            placeholder="Search mock tests…"
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={difficultyFilter}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-neutral-800 font-medium cursor-pointer"
            >
              <option value="all">All levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-neutral-800 font-medium cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm">
            <ArrowUpDown className="w-4 h-4 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-neutral-800 font-medium cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
