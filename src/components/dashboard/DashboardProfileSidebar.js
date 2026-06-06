'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Pencil,
  Coins,
  Trophy,
  Flame,
  BookOpen,
  BarChart3,
  Infinity,
} from 'lucide-react';

function initials(name, email) {
  const n = String(name || '').trim();
  if (n) {
    const parts = n.split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : n.slice(0, 2).toUpperCase();
  }
  return String(email || '?').slice(0, 2).toUpperCase();
}

function StatRow({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-neutral-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm font-semibold text-neutral-900 tabular-nums">{value}</p>
        {hint ? <p className="text-[11px] text-neutral-400 mt-0.5">{hint}</p> : null}
      </div>
    </div>
  );
}

export default function DashboardProfileSidebar({
  user,
  profile,
  examsPreparing = [],
  stats,
  unlimited,
}) {
  const displayName =
    profile?.displayName ||
    user?.name ||
    user?.fullName ||
    user?.email?.split('@')[0] ||
    'Student';
  const avatarUrl = profile?.avatarUrl || user?.image || null;
  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ');
  const rankLabel = stats?.rank
    ? stats.rank.outsideTop
      ? `#${stats.rank.rank} (outside top 10)`
      : `#${stats.rank.rank}`
    : '—';

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 text-center border-b border-neutral-100">
          <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xl font-semibold text-neutral-600">
                {initials(displayName, user?.email)}
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 truncate">{displayName}</h1>
          {user?.email ? (
            <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
          ) : null}
          {profile?.bio ? (
            <p className="text-sm text-neutral-600 mt-3 text-left leading-relaxed line-clamp-4">
              {profile.bio}
            </p>
          ) : null}
        </div>

        <div className="px-5 py-3 space-y-2 border-b border-neutral-100">
          {location ? (
            <p className="flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 shrink-0 text-neutral-400" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
          {examsPreparing.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {examsPreparing.map((e) => (
                <span
                  key={e.slug}
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                    e.isPrimary
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {e.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <Link
            href="/profile"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit profile
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
          Your stats
        </h2>
        <StatRow
          icon={unlimited ? Infinity : Coins}
          label="Credits"
          value={
            unlimited
              ? 'Unlimited plan'
              : stats?.credits != null
                ? `${stats.credits.toLocaleString()} credits`
                : '—'
          }
        />
        <StatRow icon={Trophy} label="Leaderboard rank" value={rankLabel} hint={stats?.rankExam} />
        <StatRow
          icon={Flame}
          label="Study streak"
          value={
            stats?.currentStreak
              ? `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`
              : 'No active streak'
          }
          hint={
            stats?.maxStreak
              ? `Max ${stats.maxStreak} · ${stats.activeDays} active days`
              : undefined
          }
        />
        <StatRow
          icon={BookOpen}
          label="Topics practiced"
          value={stats?.topicsPracticed != null ? stats.topicsPracticed.toLocaleString() : '—'}
        />
        <StatRow
          icon={BarChart3}
          label="Mock average"
          value={
            stats?.mockAverageScore != null && stats.mockTestsCompleted > 0
              ? `${stats.mockAverageScore}%`
              : '—'
          }
          hint={
            stats?.mockTestsCompleted
              ? `${stats.mockTestsCompleted} mock${stats.mockTestsCompleted === 1 ? '' : 's'} completed`
              : undefined
          }
        />
      </div>
    </aside>
  );
}
