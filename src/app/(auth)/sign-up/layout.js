import { Suspense } from 'react';

export const metadata = {
  title: 'Create account',
  description: 'Create a free 10Tracker account with Google. Practice MCQs, take mock tests, and track your exam prep.',
};

function AuthPageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-white border border-neutral-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white border border-neutral-200 rounded-3xl animate-pulse" />
      </div>
    </div>
  );
}

export default function SignUpLayout({ children }) {
  return <Suspense fallback={<AuthPageSkeleton />}>{children}</Suspense>;
}
