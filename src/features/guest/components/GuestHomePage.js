'use client';

import { useState } from 'react';
import GuestHomeHero from '@/features/guest/components/GuestHomeHero';
import GuestHomePulseStats from '@/features/guest/components/GuestHomePulseStats';
import GuestHomeExamSpotlight from '@/features/guest/components/GuestHomeExamSpotlight';
import GuestHomePrepLoop from '@/features/guest/components/GuestHomePrepLoop';
import GuestHomeOgTrackers from '@/features/guest/components/GuestHomeOgTrackers';
import GuestHomePlanTimeline from '@/features/guest/components/GuestHomePlanTimeline';
import GuestHomeCloseBand from '@/features/guest/components/GuestHomeCloseBand';
import { useAuth } from '@/context/AuthContext';
import { SHOW_OG_TRACKERS, SHOW_ROADMAPS } from '@/lib/siteNav';

/**
 * Unsigned home (`/`). Flow: value → browse exams → how it works → OG paths → soft sign-in.
 * Google sign-in appears once (close band); the nav owns persistent auth.
 */
export default function GuestHomePage({
  featuredExams = [],
  featuredRoadmaps = [],
  stats = {},
}) {
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const examCount = stats.examCount ?? featuredExams.length;
  const questionCount = stats.questionCount ?? 0;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle({ redirectUrl: '/' });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <GuestHomeHero />

      <GuestHomePulseStats examCount={examCount} questionCount={questionCount} />

      <GuestHomeExamSpotlight exams={featuredExams.slice(0, 4)} />

      <GuestHomePrepLoop />

      {SHOW_ROADMAPS ? (
        <GuestHomePlanTimeline roadmaps={featuredRoadmaps.slice(0, 3)} />
      ) : SHOW_OG_TRACKERS ? (
        <GuestHomeOgTrackers />
      ) : null}

      <GuestHomeCloseBand
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />
    </div>
  );
}
