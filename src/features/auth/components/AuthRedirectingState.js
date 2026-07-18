'use client';

import AuthPageShell from '@/features/auth/components/AuthPageShell';
import AuthCard from '@/features/auth/components/AuthCard';

export default function AuthRedirectingState({ title = 'Signing you in…', subtitle }) {
  return (
    <AuthPageShell backHref={null}>
      <AuthCard>
        <div className="text-center py-4">
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900"
            role="status"
            aria-label={title}
          />
          <p className="mt-5 text-sm font-medium text-neutral-900">{title}</p>
          {subtitle ? <p className="mt-1.5 text-xs text-neutral-500">{subtitle}</p> : null}
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
