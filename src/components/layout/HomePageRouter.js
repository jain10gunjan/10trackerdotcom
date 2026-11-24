'use client';

import { useAuth } from '@/context/AuthContext';
import GuestHomePage from '@/features/guest/components/GuestHomePage';
import StudentHomeDashboard from '@/features/dashboard/components/StudentHomeDashboard';

export default function HomePageRouter({
  featuredExams = [],
  featuredRoadmaps = [],
  stats = {},
}) {
  const { user } = useAuth();

  // Always render the guest homepage for anonymous/loading HTML so crawlers
  // and the first paint get the real offer (H1, exams, CTAs). Swap to the
  // signed-in dashboard only after auth resolves to a user.
  if (user) {
    return <StudentHomeDashboard />;
  }

  return (
    <GuestHomePage
      featuredExams={featuredExams}
      featuredRoadmaps={featuredRoadmaps}
      stats={stats}
    />
  );
}
