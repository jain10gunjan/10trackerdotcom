'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { VIDEO_MILESTONES } from '@/features/og-trackers/lib/constants';
import { extractYouTubeVideoId } from '@/features/og-trackers/lib/youtubeId';

let ytApiPromise = null;

function loadYouTubeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('SSR'));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    const done = () => {
      if (window.YT?.Player) resolve(window.YT);
    };

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        /* ignore */
      }
      done();
    };

    if (!document.querySelector('script[data-og-yt-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.dataset.ogYtApi = '1';
      tag.onerror = () => reject(new Error('Failed to load YouTube API'));
      document.head.appendChild(tag);
    }

    // Script may already be loaded / callback already fired
    let tries = 0;
    const poll = setInterval(() => {
      tries += 1;
      if (window.YT?.Player) {
        clearInterval(poll);
        done();
      } else if (tries > 100) {
        clearInterval(poll);
        reject(new Error('YouTube API timeout'));
      }
    }, 50);
  });

  return ytApiPromise;
}

/**
 * Milestone-based YouTube progress.
 * Interval only while PLAYING + tab visible. Never remounts on callback identity changes.
 */
export function useYouTubeProgress({
  videoId: videoIdRaw,
  resourceId,
  initialPercent = 0,
  startSeconds = 0,
  beaconToken = null,
  trackProgress = true,
  onMilestone,
}) {
  const videoId = extractYouTubeVideoId(videoIdRaw);
  const reactId = useId().replace(/:/g, '');
  const mountId = `og-yt-${reactId}`;

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPercentRef = useRef(initialPercent);
  const milestonesHitRef = useRef(new Set());
  const playingRef = useRef(false);
  const onMilestoneRef = useRef(onMilestone);
  const beaconTokenRef = useRef(beaconToken);
  const trackProgressRef = useRef(trackProgress);
  const startSecondsRef = useRef(startSeconds);
  const initialPercentRef = useRef(initialPercent);
  const hasSoughtRef = useRef(false);
  const resumeTargetRef = useRef(0);
  const resumeCorrectedRef = useRef(false);
  startSecondsRef.current = startSeconds;
  initialPercentRef.current = initialPercent;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [percent, setPercent] = useState(initialPercent);

  useEffect(() => {
    onMilestoneRef.current = onMilestone;
  }, [onMilestone]);

  useEffect(() => {
    beaconTokenRef.current = beaconToken;
  }, [beaconToken]);

  useEffect(() => {
    trackProgressRef.current = trackProgress;
  }, [trackProgress]);

  useEffect(() => {
    lastPercentRef.current = Math.max(lastPercentRef.current, initialPercent || 0);
    setPercent((p) => Math.max(p, initialPercent || 0));
    // Seed milestones already passed so we don't re-fire
    for (const m of VIDEO_MILESTONES) {
      if (m <= (initialPercent || 0)) milestonesHitRef.current.add(m);
    }
  }, [initialPercent, videoId, resourceId]);

  const persist = useCallback(async (newPercent, useBeacon = false) => {
    if (!trackProgressRef.current || !resourceId) return;
    if (newPercent <= lastPercentRef.current) return;

    lastPercentRef.current = newPercent;
    setPercent(newPercent);

    const status = newPercent >= 90 ? 'COMPLETED' : 'IN_PROGRESS';
    onMilestoneRef.current?.({ percent: newPercent, status });

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const payload = JSON.stringify({
        token: beaconTokenRef.current,
        resourceId,
        percentWatched: newPercent,
      });
      navigator.sendBeacon(
        '/api/og-trackers/progress/beacon',
        new Blob([payload], { type: 'application/json' })
      );
      return;
    }

    try {
      await fetch('/api/og-trackers/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resourceId,
          percentWatched: newPercent,
          status,
        }),
      });
    } catch (err) {
      console.error('useYouTubeProgress persist', err);
    }
  }, [resourceId]);

  const checkMilestones = useCallback(() => {
    const player = playerRef.current;
    if (!player?.getDuration || !player?.getCurrentTime) return;

    let duration = 0;
    let current = 0;
    try {
      duration = player.getDuration();
      current = player.getCurrentTime();
    } catch {
      return;
    }
    if (!duration || duration <= 0) return;

    const pct = Math.min(100, Math.floor((current / duration) * 100));

    for (const m of VIDEO_MILESTONES) {
      if (pct >= m && !milestonesHitRef.current.has(m) && m > lastPercentRef.current) {
        milestonesHitRef.current.add(m);
        persist(m, false);
      }
    }
  }, [persist]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    if (typeof document !== 'undefined' && document.hidden) return;
    intervalRef.current = setInterval(checkMilestones, 1500);
  }, [clearTick, checkMilestones]);

  const flushCurrent = useCallback(
    (useBeacon = true) => {
      const player = playerRef.current;
      if (!player?.getDuration || !player?.getCurrentTime) return;
      try {
        const duration = player.getDuration();
        if (!duration || duration <= 0) return;
        const pct = Math.min(100, Math.floor((player.getCurrentTime() / duration) * 100));
        if (pct > lastPercentRef.current) persist(pct, useBeacon);
      } catch {
        /* ignore */
      }
    },
    [persist]
  );

  useEffect(() => {
    hasSoughtRef.current = false;
    resumeTargetRef.current = 0;
    resumeCorrectedRef.current = false;

    if (!videoId) {
      setError(videoIdRaw ? 'Invalid YouTube video ID or URL' : 'No video configured');
      setReady(false);
      return undefined;
    }

    setError(null);
    setReady(false);
    let cancelled = false;
    const pendingSeekTimers = [];
    const clearPendingSeek = () => {
      while (pendingSeekTimers.length) {
        clearTimeout(pendingSeekTimers.pop());
      }
    };

    // One seek per video. Reads startSeconds / initialPercent from refs so later
    // progress updates do not recreate the player or seek again.
    const rememberTarget = (player) => {
      if (resumeTargetRef.current > 0) return resumeTargetRef.current;
      const start = Number(startSecondsRef.current) || 0;
      if (start > 0) {
        resumeTargetRef.current = start;
        return start;
      }
      const pct = Number(initialPercentRef.current) || 0;
      if (!(pct >= 1 && pct <= 100)) return 0;
      let duration = 0;
      try {
        duration = player?.getDuration?.() || 0;
      } catch {
        duration = 0;
      }
      if (!duration) return 0;
      const seconds = Math.floor((duration * Math.min(pct, 99)) / 100);
      resumeTargetRef.current = seconds;
      return seconds;
    };

    const seekToTarget = (player, seconds) => {
      if (!player?.seekTo || !seconds || seconds <= 0) return;
      try {
        player.seekTo(seconds, true);
      } catch {
        /* ignore */
      }
    };

    const resumeFromSaved = (player) => {
      if (cancelled || hasSoughtRef.current || !player?.seekTo) return;

      const start = Number(startSecondsRef.current) || 0;
      if (start > 0) {
        hasSoughtRef.current = true;
        seekToTarget(player, rememberTarget(player));
        return;
      }

      const pct = Number(initialPercentRef.current) || 0;
      if (!(pct >= 1 && pct <= 100)) {
        hasSoughtRef.current = true;
        return;
      }

      hasSoughtRef.current = true;
      let attempts = 0;
      const seekWhenDurationKnown = () => {
        if (cancelled) return;
        const seconds = rememberTarget(player);
        if (seconds > 0) {
          seekToTarget(player, seconds);
          return;
        }
        attempts += 1;
        if (attempts >= 15) return;
        pendingSeekTimers.push(setTimeout(seekWhenDurationKnown, 250));
      };
      seekWhenDurationKnown();
    };

    // YouTube often ignores a seek made before the first play. Correct once.
    const correctResumeOnPlay = (player) => {
      if (cancelled || resumeCorrectedRef.current || !player?.getCurrentTime) return;
      const target = rememberTarget(player);
      if (!(target > 2)) return;
      resumeCorrectedRef.current = true;
      let current = 0;
      try {
        current = player.getCurrentTime() || 0;
      } catch {
        current = 0;
      }
      if (current + 2 < target) seekToTarget(player, target);
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        const el = document.getElementById(mountId);
        if (!el) return;

        // Destroy previous if any
        try {
          playerRef.current?.destroy?.();
        } catch {
          /* ignore */
        }

        const startFloor = Math.floor(Number(startSecondsRef.current) || 0);

        playerRef.current = new YT.Player(mountId, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            ...(startFloor > 0 ? { start: startFloor } : {}),
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              setReady(true);
              resumeFromSaved(event?.target);
            },
            onError: (event) => {
              if (!cancelled) {
                setError(`YouTube error ${event?.data || ''}`.trim());
              }
            },
            onStateChange: (event) => {
              const state = event.data;
              if (state === 1) {
                playingRef.current = true;
                correctResumeOnPlay(event?.target);
                startTick();
              } else {
                playingRef.current = false;
                clearTick();
                checkMilestones();
                if (state === 2 || state === 0) {
                  flushCurrent(true);
                }
              }
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load player');
      });

    const onVisibility = () => {
      if (document.hidden) {
        clearTick();
        flushCurrent(true);
      } else if (playingRef.current) {
        startTick();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearPendingSeek();
      document.removeEventListener('visibilitychange', onVisibility);
      clearTick();
      flushCurrent(true);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // Intentionally only remount when video identity changes — not on callback churn,
    // startSeconds, or initialPercent. Resume seek reads those from refs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, mountId]);

  return { mountId, ready, percent, error, videoId };
}
