'use client';

import { memo } from 'react';
import { BookOpen, Trophy, BarChart3, Lock } from 'lucide-react';

export const MOCK_HUB_TABS = [
  { id: 'tests', label: 'Tests', icon: BookOpen, requiresAuth: false },
  { id: 'rank', label: 'Rank', icon: Trophy, requiresAuth: false },
  { id: 'progress', label: 'My progress', icon: BarChart3, requiresAuth: true },
];

function MockTestHubTabs({ activeTab, onTabChange, isAuthenticated }) {
  return (
    <div
      className="mb-6 sm:mb-8 inline-flex w-full flex-wrap items-center gap-1 rounded-2xl border border-neutral-200/80 bg-white/90 p-1 shadow-sm backdrop-blur"
      role="tablist"
      aria-label="Mock test sections"
    >
      {MOCK_HUB_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isDisabled = tab.requiresAuth && !isAuthenticated;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={`
              flex-1 min-w-[7.5rem] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors
              ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : isDisabled
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }
            `}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
            {isDisabled ? <Lock className="h-3 w-3 shrink-0 opacity-70" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export default memo(MockTestHubTabs);
