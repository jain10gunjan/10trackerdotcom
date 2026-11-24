'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { appendOgReturnParams } from '@/features/og-trackers/lib/platformUrls';
import { ogWatchPath } from '@/features/og-trackers/lib/watchUrl';

const JUDGE_TYPES = new Set([
  'LEETCODE_PROBLEM',
  'CODESTUDIO_PROBLEM',
  'HACKERRANK_PROBLEM',
]);

function typeLabel(type) {
  if (type === 'VIDEO') return 'Video';
  if (type === 'LEETCODE_PROBLEM') return 'LeetCode';
  if (type === 'CODESTUDIO_PROBLEM') return 'CodeStudio';
  if (type === 'HACKERRANK_PROBLEM') return 'HackerRank';
  if (type === 'PRACTICE_CHAPTER') return 'Practice';
  if (type === 'MOCK_TEST') return 'Mock test';
  return type || '';
}

function groupBySection(resources) {
  const groups = [];
  const index = new Map();
  resources.forEach((resource, i) => {
    const label = String(resource?.sectionLabel || '').trim() || 'Path';
    if (!index.has(label)) {
      index.set(label, groups.length);
      groups.push({ label, items: [] });
    }
    groups[index.get(label)].items.push({
      resource,
      indexLabel: String(i + 1).padStart(2, '0'),
    });
  });
  return groups;
}

function StatusMark({ blocked, status }) {
  if (blocked) {
    return <Lock className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />;
  }
  if (status === 'COMPLETED') {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />;
  }
  if (status === 'IN_PROGRESS') {
    return <Circle className="h-4 w-4 shrink-0 fill-amber-100 text-amber-500" aria-hidden />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />;
}

function lessonTarget(resource, pathSlug, isCurrent) {
  if (resource.locked || resource.sequenceLocked) return null;

  if (resource.type === 'VIDEO') {
    if (!resource.youtubeVideoId || isCurrent) return null;
    return { kind: 'link', href: ogWatchPath(pathSlug, resource.id) };
  }

  if (resource.type === 'PRACTICE_CHAPTER' || resource.type === 'MOCK_TEST') {
    const url = typeof resource.externalUrl === 'string' ? resource.externalUrl.trim() : '';
    if (!url) return null;
    const href = appendOgReturnParams(url, { pathSlug, resourceId: resource.id });
    if (!href) return null;
    if (url.startsWith('/') && !url.startsWith('//')) return { kind: 'link', href };
    if (/^https?:\/\//i.test(url)) return { kind: 'anchor', href };
    return null;
  }

  if (JUDGE_TYPES.has(resource.type)) {
    const url = typeof resource.externalUrl === 'string' ? resource.externalUrl.trim() : '';
    if (!url) return null;
    return { kind: 'external', href: url };
  }

  return null;
}

function LessonRow({ resource, indexLabel, pathSlug, isCurrent }) {
  const blocked = Boolean(resource.locked || resource.sequenceLocked);
  const percent = Number(resource.progress?.percentWatched);
  const percentShown =
    resource.type === 'VIDEO' && Number.isFinite(percent) && percent > 0
      ? Math.round(percent)
      : 0;
  const target = lessonTarget(resource, pathSlug, isCurrent);

  const className = [
    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm',
    isCurrent ? 'bg-neutral-100 font-semibold' : '',
    blocked ? 'text-neutral-400' : 'text-neutral-900',
    target && !isCurrent ? 'hover:bg-neutral-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <StatusMark blocked={blocked} status={resource.progress?.status} />
      <span className="w-6 shrink-0 text-xs font-medium tabular-nums text-neutral-400">
        {indexLabel}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{resource.title}</span>
      <span
        className={`shrink-0 text-[11px] font-normal ${blocked ? 'text-neutral-400' : 'text-neutral-500'}`}
      >
        {typeLabel(resource.type)}
        {percentShown > 0 ? <span className="tabular-nums"> {percentShown}%</span> : null}
      </span>
    </>
  );

  const currentProp = isCurrent ? 'true' : undefined;

  if (target?.kind === 'link') {
    return (
      <Link href={target.href} className={className} aria-current={currentProp}>
        {body}
      </Link>
    );
  }

  if (target?.kind === 'anchor') {
    return (
      <a href={target.href} className={className} aria-current={currentProp}>
        {body}
      </a>
    );
  }

  if (target?.kind === 'external') {
    return (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-current={currentProp}
      >
        {body}
      </a>
    );
  }

  return (
    <div className={className} aria-current={currentProp}>
      {body}
    </div>
  );
}

export default function OgWatchCurriculum({ pathSlug, resources, currentId }) {
  const items = Array.isArray(resources) ? resources : [];
  const completed = items.filter((resource) => resource?.progress?.status === 'COMPLETED').length;
  const groups = groupBySection(items);

  return (
    <nav
      aria-label="Lessons"
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white lg:max-h-[70vh]"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2.5">
        <h2 className="text-sm font-semibold text-neutral-900">Lessons</h2>
        <span
          className="text-[11px] tabular-nums text-neutral-500"
          aria-label={`${completed} of ${items.length} completed`}
        >
          {completed}/{items.length}
        </span>
      </div>
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {groups.map((group) => (
          <section key={group.label}>
            <h3 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {group.label}
            </h3>
            <ul className="divide-y divide-neutral-100">
              {group.items.map(({ resource, indexLabel }) => (
                <li key={resource.id}>
                  <LessonRow
                    resource={resource}
                    indexLabel={indexLabel}
                    pathSlug={pathSlug}
                    isCurrent={String(resource.id) === String(currentId)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
