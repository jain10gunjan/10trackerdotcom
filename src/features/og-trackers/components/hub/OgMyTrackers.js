'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';

function countLine(item) {
  const lectures = Number(item?.videoCount) || 0;
  const practice = Number(item?.practiceCount) || 0;
  const mocks = Number(item?.mockCount) || 0;
  const mockWord = mocks === 1 ? 'mock' : 'mocks';
  return `${lectures} lectures · ${practice} practice · ${mocks} ${mockWord}`;
}

/**
 * User track — private AI / owned trackers only.
 */
export default function OgMyTrackers({
  mine = [],
  loading = false,
  signedIn = false,
}) {
  const items = Array.isArray(mine) ? mine : [];
  const showEmpty = !loading && items.length === 0;

  return (
    <div>
      <div className="mb-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: GUEST_BRAND.blue }}
        >
          User track
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Your private trackers
        </h2>
        <p className="mt-2 max-w-xl text-sm text-neutral-600">
          Built from your YouTube playlists. Only visible to you — never in Exam track.
        </p>
      </div>

      {!signedIn ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-neutral-950">Sign in to open User track</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
            Your AI playlist trackers stay private on this account.
          </p>
          <Link
            href="/sign-in?redirect=/og-trackers?track=user"
            className="mt-4 inline-flex text-sm font-semibold underline underline-offset-2"
            style={{ color: GUEST_BRAND.blue }}
          >
            Sign in
          </Link>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading your trackers…
        </div>
      ) : showEmpty ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-neutral-950">No tracker in User track yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
            Paste a GATE CSE playlist. We map lectures, then attach practice and real mocks.
          </p>
          <Link
            href="/og-trackers/ai"
            className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm font-semibold"
            style={{ color: GUEST_BRAND.blue }}
          >
            <Sparkles className="h-4 w-4" />
            Build from a playlist
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Link
              href="/og-trackers/ai"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: GUEST_BRAND.blue }}
            >
              <Sparkles className="h-4 w-4" />
              Build another
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {items.map((item) => {
              const percent = Math.max(0, Math.min(100, Number(item.percent) || 0));
              return (
                <Link
                  key={item.slug}
                  href={`/og-trackers/${item.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] transition-colors hover:border-[#3F5EB9]/40 sm:p-6"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    User track
                  </p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-neutral-950 transition-colors group-hover:text-[#1e2f6b] sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm tabular-nums text-neutral-600">{countLine(item)}</p>
                  <div className="mt-auto pt-5">
                    <div className="mb-1.5 flex justify-between text-xs text-neutral-500">
                      <span>Complete</span>
                      <span className="font-semibold tabular-nums text-neutral-800">{percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(percent, percent === 0 ? 3 : percent)}%`,
                          backgroundColor: GUEST_BRAND.blue,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
