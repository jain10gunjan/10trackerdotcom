'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Layers } from 'lucide-react';

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ActivityList({ items, emptyMessage }) {
  if (!items?.length) {
    return <p className="text-sm text-neutral-500 py-6 text-center">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item, i) => (
        <li key={`${item.type}-${item.at}-${i}`}>
          <Link
            href={item.href || '#'}
            className="flex items-center justify-between gap-3 py-3 px-1 hover:bg-neutral-50 rounded-lg transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-700">
                {item.title}
              </p>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              {item.score != null ? (
                <p className="text-sm font-semibold tabular-nums text-neutral-800">{item.score}%</p>
              ) : null}
              <p className="text-[11px] text-neutral-400 tabular-nums">{timeAgo(item.at)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardRecentActivity({ recentActivity, primarySlug }) {
  const tabs = [
    { id: 'practice', label: 'Recent practice', icon: BookOpen },
    { id: 'mock', label: 'Mock tests', icon: ClipboardList },
    { id: 'all', label: 'All activity', icon: Layers },
  ];

  const [tab, setTab] = useState('all');

  const items =
    tab === 'practice'
      ? recentActivity?.practice
      : tab === 'mock'
        ? recentActivity?.mock
        : recentActivity?.all;

  const emptyMessages = {
    practice: primarySlug
      ? 'No practice sessions yet. Pick a topic from your exam hub.'
      : 'No practice sessions yet.',
    mock: 'No mock tests yet.',
    all: 'No activity yet. Practice or take a mock to get started.',
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-neutral-100 -mx-1 mb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>
      <ActivityList items={items} emptyMessage={emptyMessages[tab]} />
    </div>
  );
}
