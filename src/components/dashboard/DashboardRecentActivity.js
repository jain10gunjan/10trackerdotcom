'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Layers } from 'lucide-react';
import { formatExamSlug } from '@/lib/platformExams';

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

function formatTopicLabel(topic) {
  return String(topic || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function practiceItemsFromAggregate(practiceAreas = []) {
  const items = [];
  for (const exam of practiceAreas) {
    for (const topic of exam.topics || []) {
      if (!topic.completedQuestions) continue;
      items.push({
        type: 'practice',
        area: exam.area,
        topic: topic.topic,
        title: formatTopicLabel(topic.topic),
        subtitle: `${formatExamSlug(exam.area)} · ${topic.completedQuestions} questions`,
        at: null,
        href: `/${exam.area}/practice/${topic.topic}`,
      });
    }
  }
  return items.slice(0, 15);
}

function ActivityList({ items, emptyMessage }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-neutral-500 py-10 text-center px-4">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item, i) => (
        <li key={`${item.type}-${item.href}-${item.at || 'na'}-${i}`}>
          <Link
            href={item.href || '#'}
            className="flex items-center justify-between gap-3 py-3 px-2 hover:bg-neutral-50 rounded-lg transition-colors group"
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

export default function DashboardRecentActivity({
  recentActivity,
  practiceAreas = [],
  primarySlug,
}) {
  const practiceItems = useMemo(() => {
    const fromRecent = recentActivity?.practice || [];
    if (fromRecent.length) return fromRecent;
    return practiceItemsFromAggregate(practiceAreas);
  }, [recentActivity?.practice, practiceAreas]);

  const mockItems = recentActivity?.mock || [];
  const allItems = useMemo(() => {
    const merged = [...practiceItems, ...mockItems];
    return merged
      .sort((a, b) => {
        const ta = a.at ? new Date(a.at).getTime() : 0;
        const tb = b.at ? new Date(b.at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 20);
  }, [practiceItems, mockItems]);

  const tabs = [
    { id: 'practice', label: 'Recent practice', icon: BookOpen, count: practiceItems.length },
    { id: 'mock', label: 'Mock tests', icon: ClipboardList, count: mockItems.length },
    { id: 'all', label: 'All activity', icon: Layers, count: allItems.length },
  ];

  const [tab, setTab] = useState('all');

  const items =
    tab === 'practice' ? practiceItems : tab === 'mock' ? mockItems : allItems;

  const emptyMessages = {
    practice: primarySlug
      ? 'No practice sessions yet. Pick a topic from your exam hub.'
      : 'No practice sessions yet.',
    mock: 'No mock tests yet. Take a mock to see attempts here.',
    all: 'No activity yet. Practice or take a mock to get started.',
  };

  return (
    <div className="flex flex-col min-h-[360px]">
      <div
        role="tablist"
        aria-label="Activity type"
        className="flex flex-wrap gap-1 border-b border-neutral-100 -mx-1 mb-0 shrink-0"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span
                className={`ml-0.5 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="flex-1 min-h-0 overflow-y-auto mt-1 -mx-1 px-1"
        key={tab}
      >
        <ActivityList items={items} emptyMessage={emptyMessages[tab]} />
      </div>
    </div>
  );
}
