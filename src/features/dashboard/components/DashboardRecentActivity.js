'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Layers, ChevronRight } from 'lucide-react';
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
        subtitle: formatExamSlug(exam.area),
        at: null,
        href: `/${exam.area}/practice/${topic.topic}`,
      });
    }
  }
  return items.slice(0, 15);
}

const TYPE_META = {
  practice: {
    icon: BookOpen,
    label: 'Practice',
    iconBg: 'bg-emerald-50 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  mock: {
    icon: ClipboardList,
    label: 'Mock',
    iconBg: 'bg-indigo-50 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
};

function ActivityRow({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.practice;
  const Icon = meta.icon;

  return (
    <li className="border-b border-neutral-100 last:border-0">
      <Link
        href={item.href || '#'}
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50/80 transition-colors group"
      >
        <div
          className={`w-9 h-9 rounded-lg border border-neutral-100 flex items-center justify-center shrink-0 ${meta.iconBg}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center gap-1 sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{item.title}</p>
            <p className="text-xs text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
          </div>

          <span
            className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}
          >
            {meta.label}
          </span>

          <div className="flex items-center gap-3 sm:justify-end">
            {item.score != null ? (
              <span className="text-sm font-semibold tabular-nums text-neutral-800">
                {item.score}%
              </span>
            ) : null}
            <span className="text-xs text-neutral-400 tabular-nums whitespace-nowrap">
              {timeAgo(item.at)}
            </span>
            <ChevronRight className="hidden sm:block w-4 h-4 text-neutral-300 group-hover:text-neutral-500 shrink-0" />
          </div>
        </div>
      </Link>
    </li>
  );
}

function ActivityList({ items, emptyMessage }) {
  if (!items?.length) {
    return <p className="text-sm text-neutral-500 py-12 text-center px-5">{emptyMessage}</p>;
  }

  return (
    <ul>
      {items.map((item, i) => (
        <ActivityRow key={`${item.type}-${item.href}-${item.at || 'na'}-${i}`} item={item} />
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
    if (fromRecent.length) return fromRecent.slice(0, 15);
    return practiceItemsFromAggregate(practiceAreas);
  }, [recentActivity?.practice, practiceAreas]);

  const mockItems = useMemo(
    () => (recentActivity?.mock || []).slice(0, 15),
    [recentActivity?.mock]
  );
  const allItems = useMemo(() => {
    const merged = [...practiceItems, ...mockItems];
    return merged
      .sort((a, b) => {
        const ta = a.at ? new Date(a.at).getTime() : 0;
        const tb = b.at ? new Date(b.at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 15);
  }, [practiceItems, mockItems]);

  const tabs = [
    { id: 'all', label: 'All', icon: Layers, count: allItems.length },
    { id: 'practice', label: 'Practice', icon: BookOpen, count: practiceItems.length },
    { id: 'mock', label: 'Mocks', icon: ClipboardList, count: mockItems.length },
  ];

  const [tab, setTab] = useState('all');

  const items = (
    tab === 'practice' ? practiceItems : tab === 'mock' ? mockItems : allItems
  ).slice(0, 15);

  const emptyMessages = {
    practice: primarySlug
      ? 'No practice sessions yet. Pick a topic from your exam hub.'
      : 'No practice sessions yet.',
    mock: 'No mock tests yet. Take a mock to see attempts here.',
    all: 'No activity yet. Practice or take a mock to get started.',
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Activity type"
        className="flex flex-wrap gap-1.5 px-5 pt-4 pb-3 border-b border-neutral-100"
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`min-w-[1.1rem] rounded-md px-1 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-neutral-200/80 text-neutral-600'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" key={tab}>
        <ActivityList items={items} emptyMessage={emptyMessages[tab]} />
      </div>
    </div>
  );
}
