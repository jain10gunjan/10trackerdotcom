'use client';

import { useState } from 'react';
import GuestHomeHero from '@/features/guest/components/GuestHomeHero';
import GuestHomePulseStats from '@/features/guest/components/GuestHomePulseStats';
import GuestHomeExamSpotlight from '@/features/guest/components/GuestHomeExamSpotlight';
import GuestHomePlanTimeline from '@/features/guest/components/GuestHomePlanTimeline';
import GuestHomeRetentionKit from '@/features/guest/components/GuestHomeRetentionKit';
import GuestHomePrepLoop from '@/features/guest/components/GuestHomePrepLoop';
import GuestHomeCloseBand from '@/features/guest/components/GuestHomeCloseBand';
import { useAuth } from '@/context/AuthContext';

export default function GuestHomePage({
  featuredExams = [],
  featuredRoadmaps = [],
  stats = {},
}) {
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const examCount = stats.examCount ?? featuredExams.length;
  const roadmapCount = stats.roadmapCount ?? featuredRoadmaps.length;
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
      <GuestHomeHero
        stats={{
          examCount,
          roadmapCount,
          questionCount,
        }}
      />

      <GuestHomePulseStats
        examCount={examCount}
        roadmapCount={roadmapCount}
        questionCount={questionCount}
      />

      <GuestHomeExamSpotlight exams={featuredExams.slice(0, 4)} />

      <GuestHomePlanTimeline roadmaps={featuredRoadmaps.slice(0, 3)} />

      <GuestHomeRetentionKit
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />

      <GuestHomePrepLoop
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />

      <GuestHomeCloseBand
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />
    </div>
  );
}
