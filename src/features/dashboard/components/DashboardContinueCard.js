'use client';

import ExamHubContinueCard from '@/features/exam-hub/components/ExamHubContinueCard';

function ContinueSkeleton() {
  return (
    <div className="space-y-4">
      <ExamHubContinueCard loading show variant="practice" />
    </div>
  );
}

export default function DashboardContinueCard({
  continueOptions,
  loading = false,
}) {
  if (loading) {
    return <ContinueSkeleton />;
  }

  const { practice, mock, fallback } = continueOptions || {};
  const hasPractice = Boolean(practice?.href);
  const hasMock = Boolean(mock?.href);
  const hasFallback = Boolean(fallback?.href) && !hasPractice && !hasMock;

  if (!hasPractice && !hasMock && !hasFallback) {
    return null;
  }

  return (
    <div className="space-y-4" aria-label="Continue learning">
      {hasPractice ? (
        <ExamHubContinueCard
          continueItem={practice}
          show
          variant="practice"
          eyebrow="Pick up where you left off"
          description={practice.description}
        />
      ) : null}

      {hasMock ? (
        <ExamHubContinueCard
          continueItem={mock}
          show
          variant="mock"
          eyebrow="Mock test in progress"
          description={mock.description}
          ctaLabel="Resume"
        />
      ) : null}

      {hasFallback ? (
        <ExamHubContinueCard
          continueItem={fallback}
          show
          variant="default"
          eyebrow="Continue learning"
          description={fallback.description}
          ctaLabel="Get started"
        />
      ) : null}
    </div>
  );
}
