import { Suspense } from 'react';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to 10Tracker with Google to save practice progress, mock test scores, and analytics.',
};

function AuthPageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse mb-6" />
        <div className="h-80 bg-white border border-neutral-200 rounded-3xl animate-pulse" />
      </div>
    </div>
  );
}

export default function SignInLayout({ children }) {
  return <Suspense fallback={<AuthPageSkeleton />}>{children}</Suspense>;
}
