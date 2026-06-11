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
    <div className="mb-5 sm:mb-6 rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm overflow-x-auto scrollbar-none">
      <div className="flex gap-1 min-w-max sm:min-w-0">
        {MOCK_HUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.requiresAuth && !isAuthenticated;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`
                flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                ${isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDisabled
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
              {isDisabled ? <Lock className="h-3 w-3 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(MockTestHubTabs);
