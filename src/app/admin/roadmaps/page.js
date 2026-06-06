'use client';

import RoadmapsAdmin from '@/components/admin/roadmaps/RoadmapsAdmin';

export default function AdminRoadmapsPage() {
  return (
    <div>
      <p className="text-sm text-neutral-600 mb-6 max-w-2xl">
        Create study roadmaps with day-by-day tasks, set price and free preview days, and manage
        content. Purchases use Razorpay (one-time, lifetime access, no refunds). Same admin access
        as the rest of the panel.
      </p>
      <RoadmapsAdmin />
    </div>
  );
}
