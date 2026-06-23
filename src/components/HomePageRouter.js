'use client';

import { useAuth } from '@/app/context/AuthContext';
import GuestHomePage from '@/components/guest/GuestHomePage';
import StudentHomeDashboard from '@/components/dashboard/StudentHomeDashboard';

export default function HomePageRouter({
  featuredExams = [],
  featuredRoadmaps = [],
  stats = {},
}) {
  const { user } = useAuth();

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
