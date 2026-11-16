'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy GATE CSE ₹999 checkout — redirected to credits/subscriptions pricing.
 */
export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pricing');
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-neutral-600">
      Redirecting to pricing…
    </div>
  );
}
