'use client';

import { useAuth } from '@/context/AuthContext';
import GuestHomePage from '@/features/guest/components/GuestHomePage';
import StudentHomeDashboard from '@/features/dashboard/components/StudentHomeDashboard';
import HomeDashboardShell from '@/features/dashboard/components/HomeDashboardShell';

export default function HomePageRouter({
  featuredExams = [],
  featuredRoadmaps = [],
  stats = {},
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <HomeDashboardShell />;
  }

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
