'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OgYouTubePlayer from '@/features/og-trackers/components/OgYouTubePlayer';
import OgWatchCurriculum from '@/features/og-trackers/components/OgWatchCurriculum';
import {
  appendOgReturnParams,
  isJudgeResourceType,
  isPlatformResourceType,
} from '@/features/og-trackers/lib/platformUrls';
import { ogWatchPath, resumeSeconds } from '@/features/og-trackers/lib/watchUrl';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';
import {
  APP_GUTTER,
  APP_MOBILE_BOTTOM_CLEARANCE,
  APP_NAV_CONTENT_OFFSET,
} from '@/lib/appChrome';

function Shimmer({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-neutral-200/70 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

function formatDuration(seconds) {
  const total = Math.floor(Number(seconds));
  if (!Number.isFinite(total) || total < 0) return null;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${minutes}:${ss}`;
}

function formatPosition(index, total) {
  const width = Math.max(2, String(total).length);
  return `${String(index + 1).padStart(width, '0')} / ${String(total).padStart(width, '0')}`;
}

function paramValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function sameId(a, b) {
  return String(a) === String(b);
}

function neighborAction(resource, pathSlug) {
  if (!resource || resource.locked || resource.sequenceLocked) return null;
  const type = String(resource.type || '').toUpperCase();
  if (type === 'VIDEO') {
    if (!resource.youtubeVideoId) return null;
    return { kind: 'link', href: ogWatchPath(pathSlug, resource.id) };
  }
  if (isPlatformResourceType(type)) {
    const raw = String(resource.externalUrl || '').trim();
    if (!raw) return null;
    const href = appendOgReturnParams(raw, {
      pathSlug,
      resourceId: resource.id,
    });
    if (!href) return null;
    if (raw.startsWith('/') && !raw.startsWith('//')) return { kind: 'link', href };
    if (/^https?:\/\//i.test(raw)) return { kind: 'anchor', href };
    return null;
  }
  if (isJudgeResourceType(type)) {
    const raw = String(resource.externalUrl || '').trim();
    if (!raw) return null;
    return { kind: 'blank', href: raw };
  }
  return null;
}

function WatchShell({ children }) {
  return (
    <div
      className="min-h-[70vh] bg-neutral-50/80 pb-[var(--og-watch-bottom)] lg:pb-8"
      style={{
        paddingTop: APP_NAV_CONTENT_OFFSET,
        '--og-watch-bottom': APP_MOBILE_BOTTOM_CLEARANCE,
      }}
    >
      <div className={`mx-auto max-w-7xl ${APP_GUTTER} pt-5 sm:pt-7`}>{children}</div>
    </div>
  );
}

function BackToPath({ slug }) {
  return (
    <Link
      href={slug ? `/og-trackers/${slug}` : '/og-trackers'}
      className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to path
    </Link>
  );
}

function WatchSkeleton() {
  return (
    <WatchShell>
      <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
      <Shimmer className="mb-4 h-4 w-28" />
      <Shimmer className="mb-5 h-4 w-48" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Shimmer className="aspect-video w-full rounded-2xl" />
          <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-6 w-2/3" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Shimmer key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </WatchShell>
  );
}

function WatchNotice({ slug, title, detail, error = false }) {
  return (
    <WatchShell>
      <BackToPath slug={slug} />
      <div className="mt-6 max-w-lg rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center shadow-sm">
        <p className={`text-sm font-medium ${error ? 'text-red-600' : 'text-neutral-900'}`}>
          {title}
        </p>
        {detail ? <p className="mt-2 text-sm text-neutral-600">{detail}</p> : null}
      </div>
    </WatchShell>
  );
}

function NeighborButton({ direction, resource, pathSlug }) {
  const isNext = direction === 'next';
  const action = resource ? neighborAction(resource, pathSlug) : null;
  const enabled = Boolean(action);
  const locked = Boolean(resource?.locked || resource?.sequenceLocked);
  const EdgeIcon = locked
    ? Lock
    : action?.kind === 'blank'
      ? ExternalLink
      : isNext
        ? ChevronRight
        : ChevronLeft;
  const label = isNext ? 'Next' : 'Previous';
  const title = !resource
    ? isNext
      ? 'No next lesson'
      : 'No previous lesson'
    : resource.title;

  const className = [
    'flex w-full min-w-0 items-center gap-2 rounded-2xl border px-3 py-3 text-sm transition-colors',
    enabled
      ? isNext
        ? 'border-transparent text-white shadow-sm hover:opacity-95'
        : 'border-neutral-200 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50'
      : 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400',
  ].join(' ');

  const style = enabled && isNext ? { backgroundColor: GUEST_BRAND.blue } : undefined;
  const reason = !enabled
    ? resource?.locked
      ? 'Premium'
      : resource?.sequenceLocked
        ? `Finish ${resource.unlockBlockedBy?.title || 'the previous lesson'} first`
        : undefined
    : undefined;

  const content = (
    <>
      {!isNext ? <EdgeIcon className="w-4 h-4 shrink-0" /> : null}
      <span className={`min-w-0 flex-1 ${isNext ? 'text-right' : 'text-left'}`}>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-medium">{title}</span>
      </span>
      {isNext ? <EdgeIcon className="w-4 h-4 shrink-0" /> : null}
    </>
  );

  if (!enabled) {
    return (
      <button type="button" disabled className={className} title={reason}>
        {content}
      </button>
    );
  }

  if (action.kind === 'link') {
    return (
      <Link href={action.href} className={className} style={style}>
        {content}
      </Link>
    );
  }

  if (action.kind === 'blank') {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <a href={action.href} className={className} style={style}>
      {content}
    </a>
  );
}

export default function OgWatchPage() {
  const params = useParams();
  const slug = paramValue(params?.slug);
  const resourceId = paramValue(params?.resourceId);
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onMilestone = useCallback((update) => {
    if (!update || update.percent == null) return;
    const percent = Number(update.percent);
    if (!Number.isFinite(percent)) return;
    const status = update.status || (percent >= 90 ? 'COMPLETED' : 'IN_PROGRESS');
    setData((prev) => {
      if (!prev?.resources) return prev;
      let changed = false;
      const resources = prev.resources.map((item) => {
        if (!sameId(item.id, resourceId)) return item;
        changed = true;
        return {
          ...item,
          progress: {
            ...(item.progress || {}),
            percentWatched: percent,
            status,
          },
        };
      });
      if (!changed) return prev;
      const completed = resources.filter((item) => item.progress?.status === 'COMPLETED').length;
      const total = resources.length;
      return {
        ...prev,
        resources,
        path: prev.path
          ? {
              ...prev.path,
              completedResources: completed,
              percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            }
          : prev.path,
      };
    });
  }, [resourceId]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Failed to load path');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    (async () => {
      try {
        const res = await fetch(`/api/og-trackers/${slug}`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.setupHint || 'Failed to load path');
        }
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load path');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <WatchSkeleton />;

  if (error || !data?.path) {
    return (
      <WatchNotice
        slug={slug}
        error
        title={error || 'Tracker not found'}
      />
    );
  }

  const resources = Array.isArray(data.resources) ? data.resources : [];
  const beaconTokens =
    data.beaconTokens && typeof data.beaconTokens === 'object' ? data.beaconTokens : {};
  const resource = resources.find((item) => sameId(item.id, resourceId)) || null;

  if (!resource) {
    return <WatchNotice slug={slug} title="This lesson isn't on the path." />;
  }

  if (resource.locked) {
    return (
      <WatchNotice
        slug={slug}
        title="This lesson is part of premium."
      />
    );
  }

  if (resource.sequenceLocked) {
    const blocker = resource.unlockBlockedBy?.title || 'previous step';
    return (
      <WatchNotice slug={slug} title={`Finish “${blocker}” first.`} />
    );
  }

  const isVideo = String(resource.type || '').toUpperCase() === 'VIDEO' && resource.youtubeVideoId;
  if (!isVideo) {
    const copy =
      String(resource.type || '').toUpperCase() === 'VIDEO'
        ? 'This video isn\'t available yet.'
        : 'This step opens from the path.';
    return <WatchNotice slug={slug} title={copy} />;
  }

  const index = resources.findIndex((item) => sameId(item.id, resource.id));
  const previous = index > 0 ? resources[index - 1] : null;
  const next = index >= 0 && index < resources.length - 1 ? resources[index + 1] : null;
  const percentWatched = Math.max(
    0,
    Math.min(100, Math.round(Number(resource.progress?.percentWatched) || 0))
  );
  const completed = resource.progress?.status === 'COMPLETED' || percentWatched >= 90;
  const durationLabel =
    resource.durationSeconds == null || resource.durationSeconds === ''
      ? null
      : formatDuration(resource.durationSeconds);
  const sectionLabel =
    typeof resource.sectionLabel === 'string' ? resource.sectionLabel.trim() : '';
  const description =
    typeof data.path.description === 'string' ? data.path.description.trim() : '';
  const pathPercent = Number.isFinite(Number(data.path.percent)) ? data.path.percent : 0;

  return (
    <WatchShell>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <BackToPath slug={slug} />
          <p className="mt-3 truncate text-sm font-medium text-neutral-900">{data.path.title}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-[11px] font-medium text-neutral-500">Path</span>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: GUEST_BRAND.blue }}
          >
            {pathPercent}%
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <OgYouTubePlayer
            key={String(resource.id)}
            videoId={resource.youtubeVideoId}
            resourceId={resource.id}
            initialPercent={resource.progress?.percentWatched || 0}
            beaconToken={beaconTokens[resource.id] || null}
            trackProgress={Boolean(user)}
            startSeconds={resumeSeconds(resource)}
            onMilestone={onMilestone}
          />

          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
            {sectionLabel ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {sectionLabel}
              </p>
            ) : null}
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              {resource.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
              <span className="tabular-nums">{formatPosition(Math.max(index, 0), resources.length)}</span>
              {durationLabel ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">{durationLabel}</span>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <span className="tabular-nums">{percentWatched}%</span>
              {completed ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                </>
              ) : null}
            </p>
            {description ? (
              <p className="mt-3 line-clamp-3 text-sm text-neutral-600">{description}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NeighborButton direction="previous" resource={previous} pathSlug={slug} />
            <NeighborButton direction="next" resource={next} pathSlug={slug} />
          </div>
        </div>

        <aside
          className="min-w-0 lg:sticky lg:self-start"
          style={{ top: `calc(${APP_NAV_CONTENT_OFFSET} + 0.75rem)` }}
        >
          <OgWatchCurriculum
            pathSlug={slug}
            resources={resources}
            currentId={resource.id}
          />
        </aside>
      </div>
    </WatchShell>
  );
}
