import { Suspense } from 'react';
import ExtensionConnectedPage from '@/features/extension-auth/components/ExtensionConnectedPage';

export const metadata = {
  title: 'Extension connected',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm text-neutral-500">Finishing connect…</div>
      }
    >
      <ExtensionConnectedPage />
    </Suspense>
  );
}
