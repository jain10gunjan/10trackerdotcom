'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { trackContentEvent } from '@/lib/analytics';

const STORAGE_KEY = 'tt_article_views';
const DEDUPE_MS = 12 * 60 * 60 * 1000;
const pendingViews = new Map();

function readViewMemory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === 'object' ? map : {};
  } catch {
    return {};
  }
}

function rememberedCount(articleId) {
  const entry = readViewMemory()[String(articleId)];
  const at = Number(entry?.at || 0);
  const count = Number(entry?.count);
  if (!Number.isFinite(at) || Date.now() - at >= DEDUPE_MS) return null;
  return Number.isFinite(count) ? count : null;
}

function markCounted(articleId, count) {
  try {
    const now = Date.now();
    const next = {};
    for (const [id, entry] of Object.entries(readViewMemory())) {
      if (now - Number(entry?.at) < DEDUPE_MS) next[id] = entry;
    }
    next[String(articleId)] = {
      at: now,
      count: Number.isFinite(Number(count)) ? Number(count) : null,
    };
    const entries = Object.entries(next).slice(-80);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Private mode or quota — server cookie still dedupes.
  }
}

export default function ArticleViewTracker({ articleId, initialCount = 0 }) {
  const [count, setCount] = useState(Number(initialCount) || 0);

  useEffect(() => {
    setCount(Number(initialCount) || 0);
  }, [initialCount]);

  useEffect(() => {
    if (!articleId) return;
    trackContentEvent('viewed', 'article', articleId);

    const remembered = rememberedCount(articleId);
    if (remembered != null && remembered >= (Number(initialCount) || 0)) {
      setCount(remembered);
    }

    let cancelled = false;
    const apply = (data) => {
      if (cancelled || !data?.success) return;
      const nextCount = Number(data.viewCount);
      if (Number.isFinite(nextCount)) {
        markCounted(articleId, nextCount);
        setCount(nextCount);
        return;
      }
      markCounted(articleId, remembered);
    };

    if (remembered != null) {
      return () => {
        cancelled = true;
      };
    }

    let job = pendingViews.get(articleId);
    if (!job) {
      job = fetch(`/api/articles/${articleId}/view`, {
        method: 'POST',
        keepalive: true,
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
        .finally(() => {
          pendingViews.delete(articleId);
        });
      pendingViews.set(articleId, job);
    }

    job.then(apply).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return (
    <span className="inline-flex items-center gap-1">
      <Eye className="w-3.5 h-3.5" />
      {count.toLocaleString()} {count === 1 ? 'view' : 'views'}
    </span>
  );
}
